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
  BeforeDestroy,
  BeforeUpdate,
} from "sequelize-typescript";
import log from "@main/logger";
import { ChatAgent, ChatMember, ChatMessage } from "@main/db/models";
import mainWindow from "@main/window";

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
  type: "conversation" | "group";

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

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

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Chat",
      id: chat.id,
      action: action,
      record: chat.toJSON(),
    });
  }

  @BeforeUpdate
  static async setupChatType(chat: Chat) {
    const members = await ChatMember.findAll({ where: { chatId: chat.id } });
    if (members.length < 2) {
      throw new Error("Chat must have at least two members");
    } else if (members.length > 2) {
      chat.type = "group";
    } else {
      chat.type = "conversation";
    }
  }

  @BeforeDestroy
  static async destroyMembers(chat: Chat) {
    ChatMember.destroy({ where: { chatId: chat.id } });
  }
}
