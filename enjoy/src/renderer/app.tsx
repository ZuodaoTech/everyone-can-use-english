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
import { Client } from "@/api";
import { WEB_API_URL } from "@/constants";

function App() {
  window.__ENJOY_APP__.app.isPackaged().then(async (isPackaged) => {
    if (!isPackaged) return;
    const client = new Client({
      baseUrl: WEB_API_URL,
    });
    try {
      const config = await client.config("bugsnag_api_key");
      if (!config?.bugsnagApiKey) return;

      Bugsnag.start({
        apiKey: config.bugsnagApiKey,
        plugins: [new BugsnagPluginReact()],
      });
    } catch (err) {
      console.error(err);
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
