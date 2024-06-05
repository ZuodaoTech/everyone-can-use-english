import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import { ChatMessageHistory, BufferMemory } from "langchain/memory/index";
import { ConversationChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import OpenAI from "openai";
import { type LLMResult } from "@langchain/core/outputs";
import { v4 } from "uuid";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { t } from "i18next";

export const useConversation = () => {
  const { EnjoyApp, webApi, user, apiUrl, learningLanguage } = useContext(
    AppSettingsProviderContext
  );
  const { openai, googleGenerativeAi, currentEngine } = useContext(
    AISettingsProviderContext
  );

  const pickLlm = (conversation: ConversationType) => {
    const {
      baseUrl,
      model,
      temperature,
      maxTokens,
      frequencyPenalty,
      presencePenalty,
      numberOfChoices,
    } = conversation.configuration;

    if (conversation.engine === "enjoyai") {
      return new ChatOpenAI({
        openAIApiKey: user.accessToken,
        configuration: {
          baseURL: `${apiUrl}/api/ai`,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        n: numberOfChoices,
      });
    } else if (conversation.engine === "openai") {
      if (!openai) throw new Error("OpenAI API key is required");

      return new ChatOpenAI({
        openAIApiKey: openai.key,
        configuration: {
          baseURL: baseUrl || openai.baseUrl,
        },
        maxRetries: 0,
        modelName: model,
        temperature,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        n: numberOfChoices,
      });
    } else if (conversation.engine === "ollama") {
      return new ChatOllama({
        baseUrl,
        model,
        temperature,
        frequencyPenalty,
        presencePenalty,
        maxRetries: 2,
      });
    } else if (conversation.engine === "googleGenerativeAi") {
      if (!googleGenerativeAi)
        throw new Error("Google Generative AI API key is required");

      return new ChatGoogleGenerativeAI({
        apiKey: googleGenerativeAi.key,
        modelName: model,
        temperature: temperature,
        maxOutputTokens: maxTokens,
        maxRetries: 2,
      });
    }
  };

  const fetchChatHistory = async (conversation: ConversationType) => {
    const chatMessageHistory = new ChatMessageHistory();
    let limit = conversation.configuration.historyBufferSize;
    if (!limit || limit < 0) {
      limit = 0;
    }
    const _messages: MessageType[] = await EnjoyApp.messages.findAll({
      where: { conversationId: conversation.id },
      order: [["createdAt", "DESC"]],
      limit,
    });

    _messages
      .sort(
        (a, b) =>
          new Date(a.createdAt).getUTCMilliseconds() -
          new Date(b.createdAt).getUTCMilliseconds()
      )
      .forEach((message) => {
        if (message.role === "user") {
          chatMessageHistory.addUserMessage(message.content);
        } else if (message.role === "assistant") {
          chatMessageHistory.addAIChatMessage(message.content);
        }
      });

    return chatMessageHistory;
  };

  const chat = async (
    message: Partial<MessageType>,
    params: {
      conversation: ConversationType;
    }
  ): Promise<Partial<MessageType>[]> => {
    const { conversation } = params;

    if (conversation.type === "gpt") {
      return askGPT(message, params);
    } else if (conversation.type === "tts") {
      return askTTS(message, params);
    } else {
      return [];
    }
  };

  /*
   * Ask GPT
   * chat with GPT conversation
   * Use LLM to generate response
   */
  const askGPT = async (
    message: Partial<MessageType>,
    params: {
      conversation: ConversationType;
    }
  ): Promise<Partial<MessageType>[]> => {
    const { conversation } = params;
    const chatHistory = await fetchChatHistory(conversation);
    const memory = new BufferMemory({
      chatHistory,
      memoryKey: "history",
      returnMessages: true,
    });
    const prompt = ChatPromptTemplate.fromMessages([
      ["system" as MessageRoleEnum, conversation.configuration.roleDefinition],
      new MessagesPlaceholder("history"),
      ["human", "{input}"],
    ]);

    const llm = pickLlm(conversation);
    const chain = new ConversationChain({
      llm: llm as any,
      memory,
      prompt,
      verbose: true,
    });
    let response: LLMResult["generations"][0] = [];
    await chain.call({ input: message.content }, [
      {
        handleLLMEnd: async (output) => {
          response = output.generations[0];
        },
      },
    ]);

    const replies = response.map((r) => {
      return {
        id: v4(),
        content: r.text,
        role: "assistant" as MessageRoleEnum,
        conversationId: conversation.id,
      };
    });

    message.role = "user" as MessageRoleEnum;
    message.conversationId = conversation.id;

    await EnjoyApp.messages.createInBatch([message, ...replies]);

    return replies;
  };

  /*
   * Ask TTS
   * chat with TTS conversation
   * It reply with the same text
   * and create speech using TTS
   */
  const askTTS = async (
    message: Partial<MessageType>,
    params: {
      conversation: ConversationType;
    }
  ): Promise<Partial<MessageType>[]> => {
    const { conversation } = params;
    const reply: MessageType = {
      id: v4(),
      content: message.content,
      role: "assistant" as MessageRoleEnum,
      conversationId: conversation.id,
      speeches: [],
    };
    message.role = "user" as MessageRoleEnum;
    message.conversationId = conversation.id;

    const speech = await tts({
      sourceType: "Message",
      sourceId: reply.id,
      text: reply.content,
      configuration: conversation.configuration.tts,
    });
    await EnjoyApp.messages.createInBatch([message, reply]);

    reply.speeches = [speech];

    return [reply];
  };

  const tts = async (params: Partial<SpeechType>) => {
    const { configuration } = params;
    const { engine, model = "tts-1", voice } = configuration || {};

    let buffer;
    if (model.match(/^(openai|tts-)/)) {
      buffer = await openaiTTS(params);
    } else if (model.startsWith("azure")) {
      buffer = await azureTTS(params);
    }

    return EnjoyApp.speeches.create(
      {
        text: params.text,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        configuration: {
          engine,
          model,
          voice,
        },
      },
      {
        type: "audio/mp3",
        arrayBuffer: buffer,
      }
    );
  };

  const openaiTTS = async (params: Partial<SpeechType>) => {
    const { configuration } = params;
    const {
      engine = currentEngine.name,
      model = "tts-1",
      voice = "alloy",
      baseUrl,
    } = configuration || {};

    let client: OpenAI;

    if (engine === "enjoyai") {
      client = new OpenAI({
        apiKey: user.accessToken,
        baseURL: `${apiUrl}/api/ai`,
        dangerouslyAllowBrowser: true,
        maxRetries: 1,
      });
    } else if (openai) {
      client = new OpenAI({
        apiKey: openai.key,
        baseURL: baseUrl || openai.baseUrl,
        dangerouslyAllowBrowser: true,
        maxRetries: 1,
      });
    } else {
      throw new Error(t("openaiKeyRequired"));
    }

    const file = await client.audio.speech.create({
      input: params.text,
      model: model.replace("openai/", ""),
      voice,
    });

    return file.arrayBuffer();
  };

  const azureTTS = async (
    params: Partial<SpeechType>
  ): Promise<ArrayBuffer> => {
    const { configuration, text } = params;
    const { model, voice } = configuration || {};

    if (model !== "azure/speech") return;

    const { id, token, region } = await webApi.generateSpeechToken({
      purpose: "tts",
      input: text,
    });
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
    speechConfig.speechRecognitionLanguage = learningLanguage;
    speechConfig.speechSynthesisVoiceName = voice;

    const speechSynthesizer = new sdk.SpeechSynthesizer(
      speechConfig,
      audioConfig
    );

    return new Promise((resolve, reject) => {
      speechSynthesizer.speakTextAsync(
        text,
        (result) => {
          speechSynthesizer.close();

          if (result && result.audioData) {
            webApi.consumeSpeechToken(id);
            resolve(result.audioData);
          } else {
            webApi.revokeSpeechToken(id);
            reject(result);
          }
        },
        (error) => {
          speechSynthesizer.close();
          webApi.revokeSpeechToken(id);
          reject(error);
        }
      );
    });
  };

  return {
    chat,
    tts,
  };
};
