import {
  ThemeProvider,
  AISettingsProvider,
  AppSettingsProvider,
  DbProvider,
} from "@renderer/context";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { Toaster, useToast } from "@renderer/components/ui";
import { t } from "i18next";
import { Tooltip } from "react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";

function App() {
  const { toast } = useToast();
  window.__ENJOY_APP__.onNotification((_event, notification) => {
    toast({
      title: t(notification.type),
      description: notification.message,
      variant: notification.type === "error" ? "destructive" : "default",
    });
  });

  useHotkeys(["Control+Comma", "Command+Comma"], () => {
    document.getElementById("preferences-button")?.click();
  });

  useHotkeys(["Control+Q", "Command+Q"], () => {
    window.__ENJOY_APP__.app.quit();
  });

  useHotkeys(["Control+Shift+I", "Command+Shift+I"], () => {
    window.__ENJOY_APP__.app.openDevTools();
  });

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AppSettingsProvider>
        <AISettingsProvider>
          <DbProvider>
            <RouterProvider router={router} />
            <Toaster />
            <Tooltip id="global-tooltip" />
          </DbProvider>
        </AISettingsProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
