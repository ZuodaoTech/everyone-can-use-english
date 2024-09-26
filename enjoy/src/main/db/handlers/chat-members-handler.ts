import { ipcMain, IpcMainEvent } from "electron";
import { ChatMember } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@main/downloader";
import log from "@main/logger";
import { t } from "i18next";

const logger = log.scope("db/handlers/chat-members-handler");

class ChatMembersHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatMember>>
  ) {
    const chatMembers = await ChatMember.findAll({
      ...options,
    });

    return chatMembers.map((member) => member.toJSON());
  }

  private async create(_event: IpcMainEvent, member: ChatMemberDtoType) {
    const chatMember = await ChatMember.create(member);
    await chatMember.reload();
    return chatMember.toJSON();
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    member: ChatMemberDtoType
  ) {
    const chatMember = await ChatMember.findOne({
      where: { id },
    });
    if (!chatMember) {
      throw new Error(t("models.chatMember.notFound"));
    }
    await chatMember.update(member);
    return chatMember.toJSON();
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const chatMember = await ChatMember.findOne({
      where: { id },
    });
    const chatMembers = await ChatMember.findAll({
      where: { chatId: chatMember.chatId },
    });
    if (
      chatMembers.filter((member) => member.userType === "ChatAgent").length <=
      1
    ) {
      throw new Error(t("models.chatMember.atLeastOneAgent"));
    }

    await chatMember.destroy();
    return chatMember.toJSON();
  }

  register() {
    ipcMain.handle("chat-members-find-all", this.findAll);
    ipcMain.handle("chat-members-create", this.create);
    ipcMain.handle("chat-members-update", this.update);
    ipcMain.handle("chat-members-destroy", this.destroy);
  }

  unregister() {
    ipcMain.removeHandler("chat-members-find-all");
    ipcMain.removeHandler("chat-members-create");
    ipcMain.removeHandler("chat-members-update");
    ipcMain.removeHandler("chat-members-destroy");
  }
}

export const chatMembersHandler = new ChatMembersHandler();
