import { ipcMain, IpcMainEvent } from "electron";
import { ChatMessage, Recording } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import { enjoyUrlToPath } from "@/main/utils";
import fs from "fs-extra";
import { ChatMessageStateEnum } from "@/shared/types/enums";
import { BaseHandler } from "./base-handler";
import { withTransaction } from "@main/db/transaction";

class ChatMessagesHandler extends BaseHandler {
  protected prefix = "chat-messages";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
  };

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

    return withTransaction(async (transaction) => {
      const message = await ChatMessage.create(data, { transaction });

      if (recordingUrl) {
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
            targetId: message.id,
          },
          transaction
        );
      }

      return (await message.reload()).toJSON();
    });
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

    return withTransaction(async (transaction) => {
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

      return (await message.reload()).toJSON();
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const message = await ChatMessage.findByPk(id);
    if (!message) return;

    await message.destroy();

    return message.toJSON();
  }
}

export const chatMessagesHandler = new ChatMessagesHandler();
