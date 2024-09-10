import { useState } from "react";
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
import { useDebounce } from "@uidotdev/usehooks";

export const MediaShadowPlayer = () => {
  const [layout, setLayout] = useState<number[]>();
  const debouncedLayout = useDebounce(layout, 100);

  return (
    <>
      <ResizablePanelGroup direction="vertical" onLayout={setLayout}>
        <ResizablePanel defaultSize={60} minSize={50}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={20}>
              <MediaLeftPanel />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={20}>
              <MediaRightPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle />

        <ResizablePanel minSize={20}>
          <MediaBottomPanel layout={debouncedLayout} />
        </ResizablePanel>
      </ResizablePanelGroup>
      <MediaLoadingModal />
    </>
  );
};
