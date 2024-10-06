import { ipcMain, IpcMainEvent } from "electron";
import { Chat, ChatAgent, ChatMember } from "@main/db/models";
import { FindOptions, Attributes, Op } from "sequelize";
import log from "@main/logger";
import { t } from "i18next";

const logger = log.scope("db/handlers/chat-agents-handler");

class ChatAgentsHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatAgent>> & { query?: string }
  ) {
    const { query, where = {} } = options || {};
    delete options.query;
    delete options.where;

    if (query) {
      (where as any).name = {
        [Op.like]: `%${query}%`,
      };
    }
    const agents = await ChatAgent.findAll({
      order: [["updatedAt", "DESC"]],
      where,
      ...options,
    });

    if (!agents) {
      return [];
    }
    return agents.map((agent) => agent.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatAgent>>
  ) {
    const agent = await ChatAgent.findOne(options);
    return agent?.toJSON();
  }

  private async create(
    _event: IpcMainEvent,
    data: { name: string; description: string; language: string; config: any }
  ) {
    const agent = await ChatAgent.create(data);
    return agent.toJSON();
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    data: {
      name: string;
      description: string;
      language: string;
      config: any;
    }
  ) {
    const agent = await ChatAgent.findByPk(id);
    if (!agent) {
      throw new Error(t("models.chatAgent.notFound"));
    }
    await agent.update(data);
    return agent.toJSON();
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const agent = await ChatAgent.findByPk(id);
    if (!agent) {
      throw new Error(t("models.chatAgent.notFound"));
    }

    const transaction = await ChatAgent.sequelize.transaction();
    try {
      const chatMembers = await ChatMember.findAll({
        where: {
          userId: id,
        },
      });

      const chats = await Chat.findAll({
        where: {
          id: {
            [Op.in]: chatMembers.map((member) => member.chatId),
          },
        },
      });

      for (const chat of chats) {
        if (
          chat.members.filter((member) => member.userId !== id).length === 0
        ) {
          await chat.destroy({ transaction });
        }
      }
      await agent.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  register() {
    ipcMain.handle("chat-agents-find-all", this.findAll);
    ipcMain.handle("chat-agents-find-one", this.findOne);
    ipcMain.handle("chat-agents-create", this.create);
    ipcMain.handle("chat-agents-update", this.update);
    ipcMain.handle("chat-agents-destroy", this.destroy);
  }

  unregister() {
    ipcMain.removeHandler("chat-agents-find-all");
    ipcMain.removeHandler("chat-agents-find-one");
    ipcMain.removeHandler("chat-agents-create");
    ipcMain.removeHandler("chat-agents-update");
    ipcMain.removeHandler("chat-agents-destroy");
  }
}

export const chatAgentsHandler = new ChatAgentsHandler();
