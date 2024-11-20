import { ChatSession, ChatAgents, ChatList } from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";
import { useState, useContext, useEffect } from "react";
import { CopilotProviderContext } from "@renderer/context";
import { useChat, useChatAgent } from "@renderer/hooks";

export default function Chats() {
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [currentChatAgent, setCurrentChatAgent] =
    useState<ChatAgentType | null>(null);
  const { currentChat: copilotCurrentChat, setOccupiedChat } = useContext(
    CopilotProviderContext
  );
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

  const { chats } = useChat(currentChatAgent?.id);
  const { chatAgents, fetchChatAgents } = useChatAgent();

  // Do not open the same chat in copilot and main window
  const handleSelectChat = (chat: ChatType) => {
    if (chat && copilotCurrentChat?.id === chat.id) return;
    setCurrentChat(chat);
  };

  // set occupied chat when current chat changes
  useEffect(() => {
    if (currentChat) {
      setOccupiedChat(currentChat);
    }

    return () => {
      setOccupiedChat(null);
    };
  }, [currentChat]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-content">
      {!sidePanelCollapsed && (
        <>
          <ResizablePanel
            order={1}
            id="chat-side-panel"
            className="bg-muted/30"
            collapsible={true}
            defaultSize={20}
            minSize={15}
            maxSize={50}
            onCollapse={() => setSidePanelCollapsed(true)}
          >
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50} minSize={30}>
                <ChatAgents
                  chatAgents={chatAgents}
                  fetchChatAgents={fetchChatAgents}
                  currentChatAgent={currentChatAgent}
                  setCurrentChatAgent={setCurrentChatAgent}
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel minSize={30}>
                <ChatList
                  chats={chats}
                  chatAgent={currentChatAgent}
                  currentChat={currentChat}
                  setCurrentChat={handleSelectChat}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel id="chat-session-panel" order={2} minSize={50}>
        <ChatSession
          chatId={currentChat?.id}
          sidePanelCollapsed={sidePanelCollapsed}
          toggleSidePanel={() => setSidePanelCollapsed(!sidePanelCollapsed)}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
