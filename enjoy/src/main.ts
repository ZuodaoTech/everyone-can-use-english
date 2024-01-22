import { app, BrowserWindow, globalShortcut, protocol, net } from "electron";
import path from "path";
import settings from "@main/settings";
import "@main/i18n";
import mainWindow from "@main/window";
import crypto from "crypto";
import log from "electron-log/main";

log.transports.file.level = "info";
log.transports.file.resolvePathFn = () =>
  path.join(settings.libraryPath(), "logs", "main.log");
log.errorHandler.startCatching();

// Fix "getRandomValues() not supported"
global.crypto = crypto;

app.commandLine.appendSwitch('enable-features','SharedArrayBuffer')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "enjoy",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
      corsEnabled: true,
    },
  },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  protocol.handle("enjoy", (request) => {
    let url = request.url.replace("enjoy://", "");
    if (url.startsWith("library")) {
      url = url.replace("library/", "");
      url = path.join(settings.userDataPath(), url);
    }

    return net.fetch(`file:///${url}`);
  });

  mainWindow.init();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow.init();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
