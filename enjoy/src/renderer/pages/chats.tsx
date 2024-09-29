import { Chat, ChatAgents, ChatList } from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";
import { useState } from "react";

export default function Chats() {
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [currentChatAgent, setCurrentChatAgent] =
    useState<ChatAgentType | null>(null);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      <ResizablePanel
        className="bg-muted/30"
        collapsible={true}
        defaultSize={20}
        minSize={15}
        maxSize={50}
      >
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={50} minSize={30}>
            <ChatAgents
              currentChatAgent={currentChatAgent}
              setCurrentChatAgent={setCurrentChatAgent}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={30}>
            <ChatList
              chatAgent={currentChatAgent}
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel minSize={50}>
        <Chat chat={currentChat} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
