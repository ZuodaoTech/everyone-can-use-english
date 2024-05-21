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
  BeforeSave,
} from "sequelize-typescript";
import { Message, Speech } from "@main/db/models";
import mainWindow from "@main/window";
import log from "@main/logger";
import { t } from "i18next";

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
    type: "gpt" | "tts";
    roleDefinition?: string;
    temperature?: number;
    maxTokens?: number;
  } & { [key: string]: any };

  @Column(DataType.VIRTUAL)
  get type(): "gpt" | "tts" {
    return this.getDataValue("configuration").type || "gpt";
  }

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

  @BeforeSave
  static validateConfiguration(conversation: Conversation) {
    if (conversation.type === "tts") {
      if (!conversation.configuration.tts) {
        throw new Error(t("models.conversation.ttsConfigurationIsRequired"));
      }
      if (!conversation.configuration.tts.engine) {
        throw new Error(t("models.conversation.ttsEngineIsRequired"));
      }
      if (!conversation.configuration.tts.model) {
        throw new Error("models.conversation.ttsModelIsRequired");
      }

      conversation.engine = conversation.configuration.tts.engine;
      conversation.configuration.model = conversation.configuration.tts.engine;
    }

    if (!conversation.configuration.model)
      throw new Error(t("models.conversation.modelIsRequired"));
  }

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
}
