import { app } from "electron";
import {
  AfterCreate,
  AfterDestroy,
  BeforeDestroy,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  HasMany,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import { Message, Speech } from "@main/db/models";
import { ChatMessageHistory, BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatOllama } from "langchain/chat_models/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";
import { type Generation } from "langchain/dist/schema";
import settings from "@main/settings";
import db from "@main/db";
import mainWindow from "@main/window";
import { t } from "i18next";
import log from "electron-log/main";
import fs from "fs-extra";
import path from "path";
import Ffmpeg from "@main/ffmpeg";
import whisper from "@main/whisper";
import { hashFile } from "@/utils";
import fetch from 'electron-fetch';

const logger = log.scope("db/models/conversation");
@Table({
  modelName: "Conversation",
  tableName: "conversations",
  underscored: true,
  timestamps: true,
})
export class Conversation extends Model<Conversation> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.ENUM("openai", "ollama", "google-generative-ai"))
  engine: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  configuration: {
    model: string;
    roleDefinition?: string;
    temperature?: number;
    maxTokens?: number;
  } & { [key: string]: any };

  @Column(DataType.VIRTUAL)
  get model(): string {
    return this.getDataValue("configuration").model;
  }

  @Column(DataType.VIRTUAL)
  get roleDefinition(): string {
    return this.getDataValue("configuration").roleDefinition;
  }

  @HasMany(() => Message)
  messages: Message[];

  @AfterCreate
  static notifyForCreate(conversation: Conversation) {
    this.notify(conversation, "create");
  }

  @BeforeDestroy
  static destroyAllMessages(conversation: Conversation) {
    Message.findAll({ where: { conversationId: conversation.id } }).then(
      (messages) => {
        messages.forEach((message) => message.destroy());
      }
    );
  }

  @AfterDestroy
  static notifyForDestroy(conversation: Conversation) {
    this.notify(conversation, "destroy");
  }

  static notify(
    conversation: Conversation,
    action: "create" | "update" | "destroy"
  ) {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Conversation",
      id: conversation.id,
      action: action,
      record: conversation.toJSON(),
    });
  }

  // convert messages to chat history
  async chatHistory() {
    const chatMessageHistory = new ChatMessageHistory();
    let limit = this.configuration.historyBufferSize;
    if (!limit || limit < 0) {
      limit = 0;
    }
    const _messages = await Message.findAll({
      where: { conversationId: this.id },
      order: [["createdAt", "DESC"]],
      limit,
    });
    logger.debug(_messages);

    _messages
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((message) => {
        if (message.role === "user") {
          chatMessageHistory.addUserMessage(message.content);
        } else if (message.role === "assistant") {
          chatMessageHistory.addAIChatMessage(message.content);
        }
      });

    return chatMessageHistory;
  }

  // choose llm based on engine
  llm() {
    if (this.engine == "openai") {
      const key = settings.getSync("openai.key") as string;
      if (!key) {
        throw new Error(t("openaiKeyRequired"));
      }
      return new ChatOpenAI({
        openAIApiKey: key,
        modelName: this.model,
        configuration: {
          baseURL: this.configuration.baseUrl,
          fetch
        },
        temperature: this.configuration.temperature,
        n: this.configuration.numberOfChoices,
        maxTokens: this.configuration.maxTokens,
        frequencyPenalty: this.configuration.frequencyPenalty,
        presencePenalty: this.configuration.presencePenalty,
      });
    } else if (this.engine === "googleGenerativeAi") {
      const key = settings.getSync("googleGenerativeAi.key") as string;
      if (!key) {
        throw new Error(t("googleGenerativeAiKeyRequired"));
      }
      return new ChatGoogleGenerativeAI({
        apiKey: key,
        modelName: this.model,
        temperature: this.configuration.temperature,
        maxOutputTokens: this.configuration.maxTokens,
      });
    } else if (this.engine == "ollama") {
      return new ChatOllama({
        baseUrl: this.configuration.baseUrl,
        model: this.model,
        temperature: this.configuration.temperature,
        frequencyPenalty: this.configuration.frequencyPenalty,
        presencePenalty: this.configuration.presencePenalty,
      });
    }
  }

  // choose memory based on conversation scenario
  async memory() {
    const chatHistory = await this.chatHistory();
    return new BufferMemory({
      chatHistory,
      memoryKey: "history",
      returnMessages: true,
    });
  }

  chatPrompt() {
    return ChatPromptTemplate.fromMessages([
      ["system", this.roleDefinition],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);
  }

  async chain() {
    return new ConversationChain({
      llm: this.llm(),
      memory: await this.memory(),
      prompt: this.chatPrompt(),
      verbose: app.isPackaged ? false : true,
    });
  }

  async ask(params: {
    messageId?: string;
    content?: string;
    file?: string;
    blob?: {
      type: string;
      arrayBuffer: ArrayBuffer;
    };
  }) {
    let { content, file, blob, messageId } = params;

    if (!content && !blob) {
      throw new Error(t("models.conversation.contentRequired"));
    }

    let md5 = "";
    let extname = ".wav";
    if (file) {
      extname = path.extname(file);
      md5 = await hashFile(file, { algo: "md5" });
      fs.copySync(
        file,
        path.join(settings.userDataPath(), "speeches", `${md5}${extname}`)
      );
    } else if (blob) {
      const filename = `${Date.now()}${extname}`;
      const format = blob.type.split("/")[1];
      const tempfile = path.join(
        settings.cachePath(),
        `${Date.now()}.${format}`
      );
      await fs.outputFile(tempfile, Buffer.from(blob.arrayBuffer));
      const wavFile = path.join(settings.userDataPath(), "speeches", filename);

      const ffmpeg = new Ffmpeg();
      await ffmpeg.convertToWav(tempfile, wavFile);

      md5 = await hashFile(wavFile, { algo: "md5" });
      fs.renameSync(
        wavFile,
        path.join(path.dirname(wavFile), `${md5}${extname}`)
      );

      const previousMessage = await Message.findOne({
        where: { conversationId: this.id },
        order: [["createdAt", "DESC"]],
      });
      let prompt = "";
      if (previousMessage?.content) {
        prompt = previousMessage.content.replace(/"/g, '\\"');
      }
      const { transcription } = await whisper.transcribe(wavFile, {
        force: true,
        extra: [`--prompt "${prompt}"`],
      });
      content = transcription
        .map((t: TranscriptionSegmentType) => t.text)
        .join(" ")
        .trim();

      logger.debug("transcription", transcription);
    }

    const chain = await this.chain();
    let response: Generation[] = [];
    const result = await chain.call({ input: content }, [
      {
        handleLLMEnd: async (output) => {
          response = output.generations[0];
        },
      },
    ]);
    logger.debug("LLM result:", result);

    if (!response) {
      throw new Error(t("models.conversation.failedToGenerateResponse"));
    }

    const transaction = await db.connection.transaction();

    await Message.create(
      {
        id: messageId,
        conversationId: this.id,
        role: "user",
        content,
      },
      {
        include: [Conversation],
        transaction,
      }
    );

    const replies = await Promise.all(
      response.map(async (generation) => {
        if (!generation?.text) {
          throw new Error(t("models.conversation.failedToGenerateResponse"));
        }
        return await Message.create(
          {
            conversationId: this.id,
            role: "assistant",
            content: generation.text,
          },
          {
            include: [Conversation],
            transaction,
          }
        );
      })
    );

    if (md5) {
      await Speech.create(
        {
          sourceId: messageId,
          sourceType: "message",
          text: content,
          md5,
          extname,
          configuration: {
            engine: "Human",
          },
        },
        {
          include: [Message],
          transaction,
        }
      );
    }

    await transaction.commit();

    return replies.map((reply) => reply.toJSON());
  }
}
