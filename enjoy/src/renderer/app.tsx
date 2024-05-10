import {
  ThemeProvider,
  AISettingsProvider,
  AppSettingsProvider,
  DbProvider,
  HotKeysSettingsProvider,
} from "@renderer/context";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { Toaster, toast } from "@renderer/components/ui";
import { Tooltip } from "react-tooltip";
import { LookupWidget, TranslateWidget } from "./components";

function App() {
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
      <AppSettingsProvider>
        <HotKeysSettingsProvider>
          <AISettingsProvider>
            <DbProvider>
              <RouterProvider router={router} />
              <Toaster richColors position="top-center" />
              <Tooltip id="global-tooltip" />
              <TranslateWidget />
              <LookupWidget />
            </DbProvider>
          </AISettingsProvider>
        </HotKeysSettingsProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
