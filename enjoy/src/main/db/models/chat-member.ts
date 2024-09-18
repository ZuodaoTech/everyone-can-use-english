import {
  AfterUpdate,
  AfterDestroy,
  BeforeDestroy,
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
} from "sequelize-typescript";
import log from "@main/logger";
import settings from "@main/settings";
import { Chat, ChatAgent, ChatMessage } from "@main/db/models";

const logger = log.scope("db/models/chat-member");
@Table({
  modelName: "ChatMember",
  tableName: "chat_members",
  underscored: true,
  timestamps: true,
})
@Scopes(() => ({
  defaultScope: {
    include: [
      {
        association: "agent",
        model: ChatAgent,
        required: false,
      },
    ],
  },
}))
export class ChatMember extends Model<ChatMember> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  chatId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  userId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  userType: string;

  @Column(DataType.JSON)
  config: any;

  @BelongsTo(() => Chat, {
    foreignKey: "chatId",
  })
  chat: Chat;

  @BelongsTo(() => ChatAgent, {
    foreignKey: "userId",
  })
  agent: ChatAgent;

  @Column(DataType.VIRTUAL)
  get name(): string {
    if (this.userType === "User") {
      return this.user.name;
    } else if (this.userType === "Agent") {
      return this.agent.name;
    }
    return "";
  }

  @Column(DataType.VIRTUAL)
  get user(): {
    name: string;
    avatarUrl: string;
  } {
    if (this.userType === "User") {
      const user = settings.getSync("user") as {
        name: string;
        avatarUrl: string;
      };

      if (!user.avatarUrl) {
        user.avatarUrl = `https://api.dicebear.com/9.x/thumbs/svg?seed=${user.name}`;
      }

      return user;
    } else {
      return null;
    }
  }

  @AfterCreate
  @AfterUpdate
  @AfterDestroy
  static async updateChats(member: ChatMember) {
    const chat = await Chat.findByPk(member.chatId);
    if (!chat) return;
    await chat.update({ updatedAt: new Date() });
  }

  @BeforeDestroy
  static async destroyMessages(member: ChatMember) {
    ChatMessage.destroy({ where: { memberId: member.id } });
  }
}
