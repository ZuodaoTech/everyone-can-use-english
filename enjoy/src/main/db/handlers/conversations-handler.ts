import { ipcMain, IpcMainEvent } from "electron";
import { Conversation, Message } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes } from "sequelize";
import log from "@main/logger";
import { t } from "i18next";

class ConversationsHandler {
  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Conversation>>
  ) {
    return Conversation.findAll({
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
    })
      .then((conversations) => {
        if (!conversations) {
          return [];
        }
        return conversations.map((conversation) => conversation.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async findOne(
    event: IpcMainEvent,
    where: WhereOptions<Attributes<Conversation>>
  ) {
    return Conversation.findOne({
      where: {
        ...where,
      },
    })
      .then((conversation) => {
        return conversation?.toJSON();
      })
      .catch((err) => {
        log.error(err);
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async create(event: IpcMainEvent, params: Conversation) {
    const { name, engine, configuration } = params;

    return Conversation.create({
      name,
      engine,
      configuration,
    })
      .then((conversation) => {
        return conversation.toJSON();
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Conversation>
  ) {
    const { name, configuration } = params;

    return Conversation.findOne({
      where: { id },
    })
      .then((conversation) => {
        if (!conversation) {
          throw new Error(t("models.conversation.notFound"));
        }
        conversation.update({ name, configuration });
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return Conversation.findOne({
      where: { id },
    }).then((conversation) => {
      if (!conversation) {
        event.sender.send("on-notification", {
          type: "error",
          message: t("models.conversation.notFound"),
        });
      }
      conversation.destroy();
    });
  }

  private async migrate(_event: IpcMainEvent, id: string) {
    const conversation = await Conversation.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new Error(t("models.conversation.notFound"));
    }
    await conversation.migrateToChat();
  }

  register() {
    ipcMain.handle("conversations-find-all", this.findAll);
    ipcMain.handle("conversations-find-one", this.findOne);
    ipcMain.handle("conversations-create", this.create);
    ipcMain.handle("conversations-update", this.update);
    ipcMain.handle("conversations-destroy", this.destroy);
    ipcMain.handle("conversations-migrate", this.migrate);
  }

  unregister() {
    ipcMain.removeHandler("conversations-find-all");
    ipcMain.removeHandler("conversations-find-one");
    ipcMain.removeHandler("conversations-create");
    ipcMain.removeHandler("conversations-update");
    ipcMain.removeHandler("conversations-destroy");
    ipcMain.removeHandler("conversations-migrate");
  }
}

export const conversationsHandler = new ConversationsHandler();
