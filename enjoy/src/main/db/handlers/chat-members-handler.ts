import { ipcMain, IpcMainEvent } from "electron";
import { Chat, ChatAgent, ChatMember } from "@main/db/models";
import { FindOptions, Attributes } from "sequelize";
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

  private async findOne(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<ChatMember>>
  ) {
    const chatMember = await ChatMember.findOne({
      ...options,
    });
    return chatMember?.toJSON();
  }

  private async create(_event: IpcMainEvent, member: ChatMemberDtoType) {
    const chat = await Chat.findOne({
      where: { id: member.chatId },
    });

    if (!chat) {
      throw new Error(t("models.chats.notFound"));
    }

    if (["TTS", "STT"].includes(chat.type)) {
      throw new Error(t("models.chatMembers.cannotAddMemberToThisChat"));
    }

    const chatAgent = await ChatAgent.findOne({
      where: { id: member.userId },
    });

    if (!chatAgent) {
      throw new Error(t("models.chatAgents.notFound"));
    }

    if (chatAgent.type !== "GPT") {
      throw new Error(t("models.chatMembers.onlyGPTAgentCanBeAddedToThisChat"));
    }

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
    ipcMain.handle("chat-members-find-one", this.findOne);
    ipcMain.handle("chat-members-create", this.create);
    ipcMain.handle("chat-members-update", this.update);
    ipcMain.handle("chat-members-destroy", this.destroy);
  }

  unregister() {
    ipcMain.removeHandler("chat-members-find-all");
    ipcMain.removeHandler("chat-members-find-one");
    ipcMain.removeHandler("chat-members-create");
    ipcMain.removeHandler("chat-members-update");
    ipcMain.removeHandler("chat-members-destroy");
  }
}

export const chatMembersHandler = new ChatMembersHandler();
