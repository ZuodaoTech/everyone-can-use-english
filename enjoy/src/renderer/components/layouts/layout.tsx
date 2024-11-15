import { Sidebar } from "../misc/sidebar";
import { Outlet, Link } from "react-router-dom";
import {
  AppSettingsProviderContext,
  CopilotProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { useContext } from "react";
import { Button } from "@renderer/components/ui/button";
import { DbState, CopilotSession, TitleBar } from "@renderer/components";
import { t } from "i18next";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@renderer/components/ui";

export const Layout = () => {
  const { initialized } = useContext(AppSettingsProviderContext);
  const db = useContext(DbProviderContext);
  const { active, setActive } = useContext(CopilotProviderContext);

  if (!initialized) {
    return (
      <div className="h-screen flex flex-col">
        <TitleBar />
        <div
          className="flex-1 flex justify-center items-center"
          date-testid="layout-onboarding"
        >
          <div className="text-center">
            <div className="text-lg mb-6">
              {t("welcomeTo")} <span className="font-semibold">Enjoy App</span>
            </div>

            <div className="">
              <Link data-testid="landing-button" to="/landing" replace>
                <Button size="lg">{t("startToUse")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (db.state === "connected") {
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
              <div className="flex-1 border-l overflow-x-hidden overflow-y-auto h-[calc(100vh-2rem)]">
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
                <div className="h-screen">
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
      <div className="h-screen w-screen flex flex-col">
        <TitleBar />
        <div
          className="flex-1 flex justify-center items-center"
          data-testid="layout-db-error"
        >
          <DbState />
        </div>
      </div>
    );
  }
};
