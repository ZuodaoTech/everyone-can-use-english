import {
  AfterUpdate,
  AfterDestroy,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AfterCreate,
  AllowNull,
  HasMany,
  Scopes,
  BeforeSave,
} from "sequelize-typescript";
import log from "@main/logger";
import { ChatAgent, ChatMember, ChatMessage } from "@main/db/models";
import mainWindow from "@main/window";
import { t } from "i18next";
import { ChatAgentTypeEnum, ChatTypeEnum } from "@/types/enums";

const logger = log.scope("db/models/chat");
@Table({
  modelName: "Chat",
  tableName: "chats",
  underscored: true,
  timestamps: true,
})
@Scopes(() => ({
  defaultScope: {
    include: [
      {
        association: "members",
        model: ChatMember,
        include: [
          {
            association: "agent",
            model: ChatAgent,
            required: false,
          },
        ],
        required: false,
      },
    ],
  },
}))
export class Chat extends Model<Chat> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  type: ChatTypeEnum;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.TEXT)
  digest: string;

  @Column(DataType.JSON)
  config: any;

  @HasMany(() => ChatMessage, {
    foreignKey: "chatId",
    constraints: false,
    onDelete: "CASCADE",
    hooks: true,
  })
  messages: ChatMessage[];

  @HasMany(() => ChatMember, {
    foreignKey: "chatId",
    constraints: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    hooks: true,
  })
  members: ChatMember[];

  @Column(DataType.VIRTUAL)
  get membersCount(): number {
    return this.members?.length;
  }

  @Column(DataType.VIRTUAL)
  get sttEngine(): string {
    return this.config?.sttEngine;
  }

  @AfterCreate
  static async notifyForCreate(chat: Chat) {
    Chat.notify(chat, "create");
  }

  @AfterUpdate
  static async notifyForUpdate(chat: Chat) {
    Chat.notify(chat, "update");
  }

  @AfterDestroy
  static async notifyForDestroy(chat: Chat) {
    Chat.notify(chat, "destroy");
  }

  static async notify(chat: Chat, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    let chatData = { id: chat?.id };
    if (action !== "destroy") {
      chat = await Chat.findByPk(chat?.id);
      chatData = chat?.toJSON() || chatData;
    }

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Chat",
      id: chatData.id,
      action,
      record: chatData,
    });
  }

  @BeforeSave
  static async setupChatType(chat: Chat) {
    if (chat.isNewRecord && chat.type) {
      return;
    }

    const members = await ChatMember.findAll({
      where: { chatId: chat.id },
    });

    if (members.length < 1) {
      throw new Error(t("models.chat.atLeastOneAgent"));
    } else if (members.length > 1) {
      // For group chat, all members must be GPT agent
      if (members.some((m) => m.agent?.type !== ChatAgentTypeEnum.GPT)) {
        throw new Error(t("models.chat.onlyGPTAgentCanBeAddedToThisChat"));
      }
      chat.type = ChatTypeEnum.GROUP;
    } else {
      const agent = members[0].agent;
      if (!agent) {
        logger.error("Chat.setupChatType: agent not found", chat.id);
        throw new Error(t("models.chat.atLeastOneAgent"));
      }

      switch (agent.type) {
        case ChatAgentTypeEnum.GPT:
          chat.type = ChatTypeEnum.CONVERSATION;
          break;
        case ChatAgentTypeEnum.TTS:
          chat.type = ChatTypeEnum.TTS;
          break;
        default:
          logger.error("Chat.setupChatType: invalid agent type", chat.id);
          throw new Error(t("models.chat.invalidAgentType"));
      }
    }
  }

  @AfterDestroy
  static async destroyMembers(chat: Chat) {
    ChatMember.destroy({ where: { chatId: chat.id } });
  }
}
