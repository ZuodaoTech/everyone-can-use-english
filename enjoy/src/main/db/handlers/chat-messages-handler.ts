import { ipcMain, IpcMainEvent } from "electron";
import { ChatMessage, Recording } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import log from "@main/logger";
import { enjoyUrlToPath } from "@/main/utils";
import fs from "fs-extra";
import { ChatMessageStateEnum } from "@/types/enums";

const logger = log.scope("db/handlers/chats-handler");

class ChatMessagesHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatMessage>> & { query?: string }
  ) {
    const { query, where = {} } = options || {};
    delete options.query;
    delete options.where;

    if (query) {
      (where as any).content = {
        [Op.like]: `%${query}%`,
      };
    }
    const chatMessages = await ChatMessage.findAll({
      where,
      ...options,
    });

    if (!chatMessages) {
      return [];
    }
    return chatMessages.map((chatMessage) => chatMessage.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<ChatMessage>>
  ) {
    const chatMessage = await ChatMessage.findOne({ where });
    if (!chatMessage) {
      return null;
    }
    return chatMessage.toJSON();
  }

  private async create(
    _event: IpcMainEvent,
    data: Partial<Attributes<ChatMessage>> & {
      recordingUrl?: string;
    }
  ) {
    const { recordingUrl } = data;
    delete data.recordingUrl;

    const transaction = await ChatMessage.sequelize.transaction();
    try {
      const message = await ChatMessage.create(data);

      if (recordingUrl) {
        // create new recording
        const filePath = enjoyUrlToPath(recordingUrl);
        const blob = fs.readFileSync(filePath);
        const recording = await Recording.createFromBlob(
          {
            type: "audio/wav",
            arrayBuffer: blob,
          },
          {
            targetType: "ChatMessage",
            targetId: message.id,
          },
          transaction
        );
        message.recording = recording;
      }

      await transaction.commit();

      return (await message.reload()).toJSON();
    } catch (error) {
      await transaction.rollback();
      logger.error(error);
      throw error;
    }
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    data: {
      state?: ChatMessageStateEnum;
      content?: string;
      recordingUrl?: string;
    }
  ) {
    const { recordingUrl } = data;
    delete data.recordingUrl;

    const message = await ChatMessage.findByPk(id);
    if (!message) return;

    const transaction = await ChatMessage.sequelize.transaction();

    try {
      if (recordingUrl) {
        // destroy existing recording
        await message.recording?.destroy({ transaction });

        // create new recording
        const filePath = enjoyUrlToPath(recordingUrl);
        const blob = fs.readFileSync(filePath);
        await Recording.createFromBlob(
          {
            type: "audio/wav",
            arrayBuffer: blob,
          },
          {
            targetType: "ChatMessage",
            targetId: id,
            referenceText: data.content,
          },
          transaction
        );
      } else if (message.recording) {
        await message.recording.update(
          {
            referenceText: data.content,
          },
          { transaction }
        );
      }

      // update content
      await message.update({ ...data }, { transaction });

      await transaction.commit();

      return (await message.reload()).toJSON();
    } catch (error) {
      await transaction.rollback();
      logger.error(error);
      throw error;
    }
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const message = await ChatMessage.findByPk(id);
    if (!message) return;

    await message.destroy();

    return message.toJSON();
  }

  register() {
    ipcMain.handle("chat-messages-find-all", this.findAll);
    ipcMain.handle("chat-messages-find-one", this.findOne);
    ipcMain.handle("chat-messages-create", this.create);
    ipcMain.handle("chat-messages-update", this.update);
    ipcMain.handle("chat-messages-destroy", this.destroy);
  }

  unregister() {
    ipcMain.removeHandler("chat-messages-find-all");
    ipcMain.removeHandler("chat-messages-find-one");
    ipcMain.removeHandler("chat-messages-create");
    ipcMain.removeHandler("chat-messages-update");
    ipcMain.removeHandler("chat-messages-destroy");
  }
}

export const chatMessagesHandler = new ChatMessagesHandler();
