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
  BeforeSave,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import log from "@main/logger";
import {
  Chat,
  ChatAgent,
  ChatMember,
  Recording,
  Speech,
} from "@main/db/models";
import {
  ChatMessageCategoryEnum,
  ChatMessageRoleEnum,
  ChatMessageStateEnum,
} from "@/types/enums";

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
      },
      {
        association: ChatMessage.associations.agent,
        model: ChatAgent,
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

  @AllowNull(true)
  @Column(DataType.STRING)
  role: ChatMessageRoleEnum;

  @Default("DEFAULT")
  @Column(DataType.STRING)
  category: ChatMessageCategoryEnum;

  @Column(DataType.UUID)
  memberId: string | null;

  @Column(DataType.UUID)
  agentId: string | null;

  @Default([])
  @Column(DataType.JSON)
  mentions: string[];

  @Column(DataType.TEXT)
  content: string;

  @AllowNull(false)
  @Default("pending")
  @Column(DataType.STRING)
  state: ChatMessageStateEnum;

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

  @BelongsTo(() => ChatAgent, {
    foreignKey: "agentId",
    constraints: false,
  })
  agent: ChatAgent;

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

  @BeforeSave
  static async setupRole(chatMessage: ChatMessage) {
    if (chatMessage.role) return;

    if (chatMessage.memberId) {
      chatMessage.role = ChatMessageRoleEnum.AGENT;
    } else {
      chatMessage.role = ChatMessageRoleEnum.USER;
    }
  }

  @BeforeSave
  static async setupAgentId(chatMessage: ChatMessage) {
    if (chatMessage.agentId) return;
    if (!chatMessage.memberId) return;

    const member = await ChatMember.findByPk(chatMessage.memberId);
    if (!member) return;

    chatMessage.agentId = member.userId;
  }

  @AfterCreate
  static async updateChat(chatMessage: ChatMessage) {
    const chat = await Chat.findByPk(chatMessage.chatId);
    if (chat) {
      chat.changed("updatedAt", true);
      chat.update({ updatedAt: new Date() }, { hooks: false });
    }

    const member = await ChatMember.findByPk(chatMessage.memberId, {
      include: [
        {
          association: ChatMember.associations.agent,
        },
      ],
    });
    if (member?.agent) {
      member.agent.changed("updatedAt", true);
      member.agent.update({ updatedAt: new Date() }, { hooks: false });
    }
  }

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

    if (action !== "destroy") {
      chatMessage = await ChatMessage.findByPk(chatMessage.id);
    }

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
