import {
  ThemeProvider,
  AISettingsProvider,
  AppSettingsProvider,
  DbProvider,
  HotKeysSettingsProvider,
  DictProvider,
  CopilotProvider,
} from "@renderer/context";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { Toaster, toast } from "@renderer/components/ui";
import { Tooltip } from "react-tooltip";
import { LookupWidget, TranslateWidget } from "./components";
import Bugsnag from "@bugsnag/electron";
import BugsnagPluginReact from "@bugsnag/plugin-react";
import { BUGSNAG_API_KEY } from "@/constants";

function App() {
  window.__ENJOY_APP__.app.isPackaged().then((isPackaged) => {
    if (isPackaged) {
      Bugsnag.start({
        apiKey: BUGSNAG_API_KEY,
        plugins: [new BugsnagPluginReact()],
      });
    }
  });

  window.__ENJOY_APP__.onNotification((_event, notification) => {
    switch (notification.type) {
      case "success":
        toast.success(notification.message);
        break;
      case "error":
        toast.error(notification.message);
        break;
      case "info":
        toast.info(notification.message);
        break;
      case "warning":
        toast.warning(notification.message);
        break;
      default:
        toast.message(notification.message);
        break;
    }
  });

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <DbProvider>
        <AppSettingsProvider>
          <HotKeysSettingsProvider>
            <AISettingsProvider>
              <DictProvider>
                <CopilotProvider>
                  <RouterProvider router={router} />
                </CopilotProvider>
                <Toaster richColors closeButton position="top-center" />
                <Tooltip id="global-tooltip" />
                <TranslateWidget />
                <LookupWidget />
              </DictProvider>
            </AISettingsProvider>
          </HotKeysSettingsProvider>
        </AppSettingsProvider>
      </DbProvider>
    </ThemeProvider>
  );
}

export default App;
