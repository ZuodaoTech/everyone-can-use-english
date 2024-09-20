import { Chat, ChatAgents, ChatList } from "@renderer/components";
import { ChatProvider } from "@renderer/context";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";

export default function Chats() {
  return (
    <ChatProvider>
      <ResizablePanelGroup direction="horizontal" className="h-screen">
        <ResizablePanel
          collapsible={true}
          defaultSize={20}
          minSize={15}
          maxSize={50}
        >
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={30}>
              <ChatAgents />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={30}>
              <ChatList />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize={50}>
          <Chat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ChatProvider>
  );
}
