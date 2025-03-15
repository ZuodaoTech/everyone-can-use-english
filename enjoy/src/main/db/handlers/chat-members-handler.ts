import { IpcMainEvent } from "electron";
import { Chat, ChatAgent, ChatMember } from "@main/db/models";
import { FindOptions, Attributes } from "sequelize";
import { t } from "i18next";
import { BaseHandler } from "./base-handler";

class ChatMembersHandler extends BaseHandler {
  protected prefix = "chat-members";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
  };

  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<ChatMember>>
  ) {
    return this.handleRequest(event, async () => {
      const chatMembers = await ChatMember.findAll({
        ...options,
      });

      return chatMembers.map((member) => member.toJSON());
    });
  }

  private async findOne(
    event: IpcMainEvent,
    options: FindOptions<Attributes<ChatMember>>
  ) {
    return this.handleRequest(event, async () => {
      const chatMember = await ChatMember.findOne({
        ...options,
      });
      return chatMember?.toJSON();
    });
  }

  private async create(_event: IpcMainEvent, member: ChatMemberDtoType) {
    return this.handleRequest(_event, async () => {
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
        throw new Error(
          t("models.chatMembers.onlyGPTAgentCanBeAddedToThisChat")
        );
      }

      const chatMember = await ChatMember.create(member);
      await chatMember.reload();
      return chatMember.toJSON();
    });
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    member: ChatMemberDtoType
  ) {
    return this.handleRequest(_event, async () => {
      const chatMember = await ChatMember.findOne({
        where: { id },
      });
      if (!chatMember) {
        throw new Error(t("models.chatMember.notFound"));
      }
      await chatMember.update(member);
      return chatMember.toJSON();
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const chatMember = await ChatMember.findOne({
        where: { id },
      });
      const chatMembers = await ChatMember.findAll({
        where: { chatId: chatMember.chatId },
      });
      if (
        chatMembers.filter((member) => member.userType === "ChatAgent")
          .length <= 1
      ) {
        throw new Error(t("models.chatMember.atLeastOneAgent"));
      }

      await chatMember.destroy();
      return chatMember.toJSON();
    });
  }
}

export const chatMembersHandler = new ChatMembersHandler();
