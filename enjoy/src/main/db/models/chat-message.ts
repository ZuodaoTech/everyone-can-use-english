import {
  AfterUpdate,
  AfterDestroy,
  BelongsTo,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AfterCreate,
  AllowNull,
  Scopes,
  HasOne,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Chat, ChatMember, Recording, Speech } from "@main/db/models";

const logger = log.scope("db/models/chat-message");
@Table({
  modelName: "ChatMessage",
  tableName: "chat_messages",
  underscored: true,
  timestamps: true,
})
@Scopes(() => ({
  defaultScope: {
    include: [
      {
        association: ChatMessage.associations.member,
        model: ChatMember,
        include: [
          {
            association: ChatMember.associations.agent,
          },
        ],
      },
      {
        association: ChatMessage.associations.recording,
        model: Recording,
        include: [
          {
            association: Recording.associations.pronunciationAssessment,
          },
        ],
      },
      {
        association: ChatMessage.associations.speech,
        model: Speech,
      },
    ],
    order: [["createdAt", "ASC"]],
  },
}))
export class ChatMessage extends Model<ChatMessage> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  chatId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  memberId: string;

  @Column(DataType.TEXT)
  content: string;

  @AllowNull(false)
  @Default("pending")
  @Column(DataType.STRING)
  state: string;

  @BelongsTo(() => Chat, {
    foreignKey: "chatId",
    constraints: false,
  })
  session: Chat;

  @BelongsTo(() => ChatMember, {
    foreignKey: "memberId",
    constraints: false,
  })
  member: ChatMember;

  @HasOne(() => Recording, {
    foreignKey: "targetId",
    constraints: false,
    scope: {
      target_type: "ChatMessage",
    },
  })
  recording: Recording;

  @HasOne(() => Speech, {
    foreignKey: "sourceId",
    constraints: false,
    scope: {
      source_type: "ChatMessage",
    },
  })
  speech: Speech;

  @AfterCreate
  static async notifyForCreate(chatMessage: ChatMessage) {
    ChatMessage.notify(chatMessage, "create");
  }

  @AfterUpdate
  static async notifyForUpdate(chatMessage: ChatMessage) {
    ChatMessage.notify(chatMessage, "update");
  }

  @AfterDestroy
  static async notifyForDestroy(chatMessage: ChatMessage) {
    ChatMessage.notify(chatMessage, "destroy");
  }

  static async notify(
    chatMessage: ChatMessage,
    action: "create" | "update" | "destroy"
  ) {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "ChatMessage",
      id: chatMessage.id,
      action: action,
      record: chatMessage.toJSON(),
    });
  }

  @AfterDestroy
  static async destroyRecordings(chatMessage: ChatMessage) {
    Recording.destroy({ where: { targetId: chatMessage.id } });
    Speech.destroy({ where: { sourceId: chatMessage.id } });
  }
}
