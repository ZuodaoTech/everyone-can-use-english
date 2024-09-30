import { ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";
import { ChatSessionProvider } from "@renderer/context";
import { useState } from "react";
import {
  ChatHeader,
  ChatInput,
  ChatMessages,
  ChatSettings,
} from "@renderer/components";
import { Tooltip } from "react-tooltip";

export const Chat = (props: { chat: ChatType }) => {
  const { chat } = props;

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-muted-foreground">{t("noChatSelected")}</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen relative">
      <ChatHeader chat={chat} />
      <ChatSessionProvider chat={chat}>
        <div className="w-full max-w-screen-md mx-auto">
          <ChatMessages />
          <div className="h-16" />
          <div className="absolute w-full max-w-screen-md bottom-0 min-h-16 pb-3 flex items-center">
            <ChatInput chat={chat} />
          </div>
        </div>
        <Tooltip id="chat-tooltip" />
      </ChatSessionProvider>
    </ScrollArea>
  );
};
