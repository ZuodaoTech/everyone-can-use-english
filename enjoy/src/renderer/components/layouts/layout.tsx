import { Outlet } from "react-router-dom";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import { CopilotSession, TitleBar, Sidebar } from "@renderer/components";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";

export const Layout = () => {
  const { initialized } = useContext(AppSettingsProviderContext);
  const { active, setActive } = useContext(CopilotProviderContext);

  if (initialized) {
    return (
      <div className="h-screen flex flex-col">
        <TitleBar />
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 h-full w-full"
          data-testid="layout-home"
        >
          <ResizablePanel id="main-panel" order={1} minSize={50}>
            <div className="flex flex-start">
              <Sidebar />
              <div
                id="main-panel-content"
                className="flex-1 border-l overflow-x-hidden overflow-y-auto h-content relative"
              >
                <Outlet />
              </div>
            </div>
          </ResizablePanel>
          {active && (
            <>
              <ResizableHandle />
              <ResizablePanel
                id="copilot-panel"
                order={2}
                collapsible={true}
                defaultSize={30}
                maxSize={50}
                minSize={15}
                onCollapse={() => setActive(false)}
              >
                <div className="h-content">
                  <CopilotSession />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    );
  } else {
    return (
      <div className="h-screen flex flex-col w-full">
        <TitleBar />
        <div className="flex-1 h-content overflow-y-auto">
          <Outlet />
        </div>
      </div>
    );
  }
};
