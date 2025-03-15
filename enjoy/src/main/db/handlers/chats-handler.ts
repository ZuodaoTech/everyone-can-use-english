import { ipcMain, IpcMainEvent } from "electron";
import { Chat, ChatAgent, ChatMember, UserSetting } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import { t } from "i18next";
import db from "@main/db";
import { UserSettingKeyEnum } from "@/shared/types/enums";
import { BaseHandler } from "./base-handler";

class ChatsHandler extends BaseHandler {
  protected prefix = "chats";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
  };

  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Chat>> & {
      query?: string;
      chatAgentId?: string;
    }
  ) {
    const { query, where = {}, chatAgentId } = options || {};
    delete options.query;
    delete options.where;
    delete options.chatAgentId;

    if (query) {
      (where as any).name = {
        [Op.like]: `%${query}%`,
      };
    }

    let chatIds;
    if (chatAgentId) {
      const chatMembers = await ChatMember.findAll({
        where: {
          userId: chatAgentId,
          userType: "ChatAgent",
        },
      });
      chatIds = chatMembers.map((member) => member.chatId);

      (where as any)["id"] = {
        [Op.in]: chatIds,
      };
    }

    const chats = await Chat.findAll({
      order: [["updatedAt", "DESC"]],
      where,
      ...options,
    });

    if (!chats) {
      return [];
    }
    return chats.map((chat) => chat.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Chat>> & {
      not: WhereOptions<Attributes<Chat>>;
    }
  ) {
    const { not } = options;
    if (not) {
      options.where = {
        ...options.where,
        [Op.not]: not,
      };
      delete options.not;
    }
    const chat = await Chat.findOne({
      order: [["updatedAt", "DESC"]],
      ...options,
    });
    if (!chat) {
      return null;
    }
    return chat.toJSON();
  }

  private async create(_event: IpcMainEvent, data: ChatDtoType) {
    const { members, ...chatData } = data;
    if (!members || members.length === 0) {
      throw new Error(t("models.chat.atLeastOneAgent"));
    }

    const chatAgents = await ChatAgent.findAll({
      where: {
        id: {
          [Op.in]: members.map((m) => m.userId),
        },
      },
    });

    if (chatAgents.length !== members.length) {
      throw new Error(t("models.chat.invalidMembers"));
    }

    let type: "CONVERSATION" | "GROUP" | "TTS";
    if (chatAgents.length === 1 && chatAgents[0].type === "TTS") {
      type = "TTS";
    } else if (chatAgents.length === 1 && chatAgents[0].type === "GPT") {
      type = "CONVERSATION";
    } else if (
      chatAgents.length > 1 &&
      chatAgents.every((agent) => agent.type === "GPT")
    ) {
      type = "GROUP";
    } else {
      throw new Error(t("models.chat.invalidMembers"));
    }

    const transaction = await db.connection.transaction();
    try {
      if (!chatData.config?.sttEngine) {
        chatData.config.sttEngine = (await UserSetting.get(
          UserSettingKeyEnum.STT_ENGINE
        )) as string;
      }
      const chat = await Chat.create(
        {
          type,
          ...chatData,
        },
        {
          transaction,
        }
      );
      for (const member of members) {
        await ChatMember.create(
          {
            chatId: chat.id,
            ...member,
          },
          {
            include: [Chat],
            transaction,
          }
        );
      }
      await transaction.commit();
      await chat.reload();
      return chat.toJSON();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async update(_event: IpcMainEvent, id: string, data: ChatDtoType) {
    const chat = await Chat.findOne({
      where: { id },
    });
    if (!chat) {
      throw new Error(t("models.chats.notFound"));
    }

    try {
      await chat.update({
        name: data.name,
        config: data.config,
      });
      await chat.reload({
        include: [
          {
            association: Chat.associations.members,
            include: [
              {
                association: ChatMember.associations.agent,
              },
            ],
          },
        ],
      });

      return chat.toJSON();
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const chat = await Chat.findOne({
      where: { id },
    });
    if (!chat) {
      throw new Error(t("models.chats.notFound"));
    }

    await chat.destroy();

    return chat.toJSON();
  }
}

export const chatsHandler = new ChatsHandler();
