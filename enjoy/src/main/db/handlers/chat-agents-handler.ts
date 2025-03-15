import { IpcMainEvent } from "electron";
import { Chat, ChatAgent, ChatMember } from "@main/db/models";
import { FindOptions, Attributes, Op } from "sequelize";
import { t } from "i18next";
import { BaseHandler } from "./base-handler";
import { withTransaction } from "../transaction";

class ChatAgentsHandler extends BaseHandler {
  protected prefix = "chat-agents";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
  };

  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatAgent>> & { query?: string }
  ) {
    return this.handleRequest(_event, async () => {
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
    });
  }

  private async findOne(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatAgent>>
  ) {
    return this.handleRequest(_event, async () => {
      const agent = await ChatAgent.findOne(options);
      return agent?.toJSON();
    });
  }

  private async create(
    _event: IpcMainEvent,
    data: { name: string; description: string; language: string; config: any }
  ) {
    return this.handleRequest(_event, async () => {
      const agent = await ChatAgent.create(data);
      return agent.toJSON();
    });
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
    return this.handleRequest(_event, async () => {
      const agent = await ChatAgent.findByPk(id);
      if (!agent) {
        throw new Error(t("models.chatAgent.notFound"));
      }
      await agent.update(data);
      return agent.toJSON();
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const agent = await ChatAgent.findByPk(id);
      if (!agent) {
        throw new Error(t("models.chatAgent.notFound"));
      }

      return withTransaction(async (transaction) => {
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
      });
    });
  }
}

export const chatAgentsHandler = new ChatAgentsHandler();
