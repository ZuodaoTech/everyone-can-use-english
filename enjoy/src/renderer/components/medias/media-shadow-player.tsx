import { MediaShadowProviderContext } from "@renderer/context";
import {
  MediaLoadingModal,
  MediaRightPanel,
  MediaLeftPanel,
  MediaBottomPanel,
} from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";
import { useContext, useState } from "react";

export const MediaShadowPlayer = () => {
  return (
    <>
      <ResizablePanelGroup
        autoSaveId="media-shadow-player-layout"
        direction="vertical"
      >
        <ResizablePanel defaultSize={60} minSize={50}>
          <TopPanel />
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel minSize={20}>
          <MediaBottomPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
      <MediaLoadingModal />
    </>
  );
};

const TopPanel = () => {
  const { layout } = useContext(MediaShadowProviderContext);
  const [displayPanel, setDisplayPanel] = useState<"left" | "right" | null>(
    "right"
  );

  if (layout === "normal") {
    return (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel id="left-panel" order={0} defaultSize={40} minSize={20}>
          <MediaLeftPanel />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="right-panel" order={1} minSize={20}>
          <MediaRightPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <div className="h-full">
      <MediaLeftPanel
        className={displayPanel === "left" ? "flex-1" : "invisible fixed"}
        setDisplayPanel={setDisplayPanel}
      />
      <MediaRightPanel
        className={displayPanel === "right" ? "flex-1" : "invisible fixed"}
        setDisplayPanel={setDisplayPanel}
      />
    </div>
  );
};
