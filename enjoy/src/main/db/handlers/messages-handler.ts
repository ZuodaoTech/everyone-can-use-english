import { ipcMain, IpcMainEvent } from "electron";
import { Message, Speech, Conversation } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes } from "sequelize";
import log from "@/main/services/logger";
import { t } from "i18next";
import db from "@main/db";
import { BaseHandler } from "./base-handler";

class MessagesHandler extends BaseHandler {
  protected prefix = "messages";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
    createSpeech: this.createSpeech.bind(this),
  };

  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Message>>
  ) {
    return this.handleRequest(_event, async () => {
      return Message.findAll({
        include: [
          {
            association: "speeches",
            model: Speech,
            where: { sourceType: "Message" },
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
        ...options,
      });
    });
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Message>>
  ) {
    return this.handleRequest(_event, async () => {
      return Message.findOne({
        include: [
          Conversation,
          {
            association: "speeches",
            model: Speech,
            where: { sourceType: "Message" },
            required: false,
          },
        ],
        where: {
          ...where,
        },
      });
    });
  }

  private async create(event: IpcMainEvent, params: Message) {
    const { conversationId, role, content } = params;

    return this.handleRequest(event, async () => {
      return Message.create({ conversationId, role, content });
    });
  }

  private async createInBatch(event: IpcMainEvent, messages: Message[]) {
    return this.handleRequest(event, async () => {
      const transaction = await db.connection.transaction();
      for (const message of messages) {
        await Message.create(message, {
          include: [Conversation],
          transaction,
        });
      }

      await transaction.commit();
    });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Message>
  ) {
    const { content } = params;

    return this.handleRequest(event, async () => {
      const message = await Message.findOne({
        where: { id },
      });
      if (!message) {
        throw new Error(t("models.message.notFound"));
      }
      message.update({ content });
    });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const message = await Message.findOne({
        where: { id },
      });
      if (!message) {
        throw new Error(t("models.message.notFound"));
      }
      message.destroy();
    });
  }

  private async createSpeech(
    event: IpcMainEvent,
    id: string,
    configuration?: { [key: string]: any }
  ) {
    return this.handleRequest(event, async () => {
      const message = await Message.findOne({
        where: { id },
      });
      if (!message) {
        throw new Error(t("models.message.notFound"));
      }

      return message.createSpeech(configuration);
    });
  }
}

export const messagesHandler = new MessagesHandler();
