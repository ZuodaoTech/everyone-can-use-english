import { ipcMain, IpcMainEvent } from "electron";
import { Conversation, Message } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes } from "sequelize";
import { t } from "i18next";
import { BaseHandler } from "./base-handler";

class ConversationsHandler extends BaseHandler {
  protected prefix = "conversations";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
    migrate: this.migrate.bind(this),
  };

  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Conversation>>
  ) {
    return this.handleRequest(_event, async () => {
      const conversations = await Conversation.findAll({
        include: {
          association: "messages",
          model: Message,
          where: {
            role: "user",
          },
          limit: 1,
        },
        order: [["createdAt", "DESC"]],
        ...options,
      });

      return conversations.map((conversation) => conversation.toJSON());
    });
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Conversation>>
  ) {
    return this.handleRequest(_event, async () => {
      const conversation = await Conversation.findOne({
        where: {
          ...where,
        },
      });

      return conversation ? conversation.toJSON() : null;
    });
  }

  private async create(_event: IpcMainEvent, params: Conversation) {
    const { name, engine, configuration } = params;

    return this.handleRequest(_event, async () => {
      const conversation = await Conversation.create({
        name,
        engine,
        configuration,
      });

      return conversation.toJSON();
    });
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Conversation>
  ) {
    const { name, configuration } = params;

    return this.handleRequest(_event, async () => {
      const conversation = await Conversation.findOne({
        where: { id },
      });
      if (!conversation) {
        throw new Error(t("models.conversation.notFound"));
      }
      await conversation.update({ name, configuration });

      return conversation.toJSON();
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const conversation = await Conversation.findOne({
        where: { id },
      });
      if (!conversation) {
        throw new Error(t("models.conversation.notFound"));
      }
      await conversation.destroy();

      return true;
    });
  }

  private async migrate(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const conversation = await Conversation.findOne({
        where: { id },
      });
      if (!conversation) {
        throw new Error(t("models.conversation.notFound"));
      }
      await conversation.migrateToChat();
    });
  }
}

export const conversationsHandler = new ConversationsHandler();
