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
  BeforeSave,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Chat, ChatMember, ChatMessage, UserSetting } from "@main/db/models";
import {
  ChatAgentTypeEnum,
  ChatMessageRoleEnum,
  UserSettingKeyEnum,
} from "@/types/enums";
import { DEFAULT_GPT_CONFIG } from "@/constants";

const logger = log.scope("db/models/chat-agent");
@Table({
  modelName: "ChatAgent",
  tableName: "chat_agents",
  underscored: true,
  timestamps: true,
})
export class ChatAgent extends Model<ChatAgent> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  type: ChatAgentTypeEnum;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  avatarUrl: string;

  @Column(DataType.STRING)
  source: string;

  @Column(DataType.JSON)
  config: any;

  @HasMany(() => ChatMember, {
    foreignKey: "userId",
    constraints: false,
    onDelete: "CASCADE",
    hooks: true,
  })
  members: ChatMember[];

  @Column(DataType.VIRTUAL)
  get prompt(): string {
    return this.getDataValue("config")?.prompt;
  }

  @AfterCreate
  static notifyForCreate(chatAgent: ChatAgent) {
    this.notify(chatAgent, "create");
  }

  @AfterUpdate
  static notifyForUpdate(chatAgent: ChatAgent) {
    this.notify(chatAgent, "update");
  }

  @AfterDestroy
  static notifyForDestroy(chatAgent: ChatAgent) {
    this.notify(chatAgent, "destroy");
  }

  static notify(chatAgent: ChatAgent, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "ChatAgent",
      id: chatAgent.id,
      action: action,
      record: chatAgent.toJSON(),
    });
  }

  @BeforeSave
  static setupDefaultAvatar(chatAgent: ChatAgent) {
    if (!chatAgent.avatarUrl) {
      chatAgent.avatarUrl = `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(
        chatAgent.name
      )}`;
    }
  }

  @AfterDestroy
  static destroyMembers(chatAgent: ChatAgent) {
    ChatMember.destroy({ where: { userId: chatAgent.id } });
  }

  // Migrate old data structure before v0.6.0 to new data structure
  static async migrateConfigToChatMember() {
    logger.info("Migrating config to chat member");
    const chatAgents = await ChatAgent.findAll({
      include: [ChatMember],
    });
    for (const chatAgent of chatAgents) {
      if (!chatAgent.config.engine) return;

      const tx = await ChatAgent.sequelize.transaction();
      const learningLanguage = await UserSetting.get(
        UserSettingKeyEnum.LEARNING_LANGUAGE
      );
      logger.info("Migrating from chat agent", chatAgent.id);
      for (const member of chatAgent.members) {
        logger.info("Migrating to chat member", member.id);
        const chatMessages = await ChatMessage.findAll({
          where: {
            memberId: member.id,
          },
        });

        if (member.userType === "Agent") {
          member.userType = "ChatAgent";
          member.config = {
            ...member.config,
            gpt: {
              ...DEFAULT_GPT_CONFIG,
              engine: chatAgent.config.engine,
              model: chatAgent.config.model,
              temperature: chatAgent.config.temperature,
            },
            tts: {
              engine: chatAgent.config.ttsEngine,
              model: chatAgent.config.ttsModel,
              language: learningLanguage,
              voice: chatAgent.config.ttsVoice,
            },
          };
          for (const chatMessage of chatMessages) {
            await chatMessage.update(
              {
                role: ChatMessageRoleEnum.AGENT,
                agentId: chatAgent.id,
              },
              {
                transaction: tx,
                hooks: false,
              }
            );
          }

          await member.save({ transaction: tx, hooks: false });
        }
      }
      await chatAgent.update(
        {
          type: ChatAgentTypeEnum.GPT,
          avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${chatAgent.name}`,
          config: {
            prompt: chatAgent.config.prompt,
          },
        },
        {
          transaction: tx,
        }
      );
      await tx.commit();
    }

    const members = await ChatMember.findAll({
      where: {
        userType: "User",
      },
    });
    const tx = await ChatAgent.sequelize.transaction();
    for (const member of members) {
      const chatMessages = await ChatMessage.findAll({
        where: {
          memberId: member.id,
        },
      });
      for (const chatMessage of chatMessages) {
        await chatMessage.update(
          {
            role: ChatMessageRoleEnum.USER,
            agentId: null,
            memberId: null,
          },
          {
            transaction: tx,
            hooks: false,
          }
        );
      }
      await member.destroy({ transaction: tx, hooks: false });
    }
    await tx.commit();

    Chat.findAll().then((chats) => {
      for (const chat of chats) {
        chat.update({ updatedAt: new Date() });
      }
    });
  }
}
