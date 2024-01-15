import {
  ThemeProvider,
  AISettingsProvider,
  AppSettingsProvider,
  DbProvider,
} from "@renderer/context";
import router from "./router";
import { RouterProvider } from "react-router-dom";
import { Toaster, toast } from "@renderer/components/ui";
import { Tooltip } from "react-tooltip";
import { useHotkeys } from "react-hotkeys-hook";

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

  const ControlOrCommand = navigator.platform.includes("Mac")
    ? "Meta"
    : "Control";

  useHotkeys(`${ControlOrCommand}+Comma`, () => {
    document.getElementById("preferences-button")?.click();
  });

  useHotkeys(`${ControlOrCommand}+Q`, () => {
    window.__ENJOY_APP__.app.quit();
  });

  useHotkeys(`${ControlOrCommand}+Shift+I`, () => {
    window.__ENJOY_APP__.app.openDevTools();
  });

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AppSettingsProvider>
        <AISettingsProvider>
          <DbProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="top-center" />
            <Tooltip id="global-tooltip" />
          </DbProvider>
        </AISettingsProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
