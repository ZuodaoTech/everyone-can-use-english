import { app, BrowserWindow, protocol, net } from "electron";
import path from "path";
import fs from "fs-extra";
import settings from "@main/settings";
import "@main/i18n";
import log from "@main/logger";
import mainWindow from "@main/window";
import ElectronSquirrelStartup from "electron-squirrel-startup";
import contextMenu from "electron-context-menu";
import { t } from "i18next";
import * as Sentry from "@sentry/electron/main";
import { SENTRY_DSN } from "@/constants";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

const logger = log.scope("main");

Sentry.init({
  dsn: SENTRY_DSN,
});

app.commandLine.appendSwitch("enable-features", "SharedArrayBuffer");

// config auto updater
if (!process.env.CI) {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.StaticStorage,
      baseUrl: `https://dl.enjoy.bot/app/${process.platform}/${process.arch}`,
    },
    updateInterval: "1 hour",
    logger: logger,
    notifyUser: true,
  });
}

// Add context menu
contextMenu({
  showSearchWithGoogle: false,
  showInspectElement: false,
  showLookUpSelection: false,
  showLearnSpelling: false,
  showSelectAll: false,
  labels: {
    copy: t("copy"),
    cut: t("cut"),
    paste: t("paste"),
    selectAll: t("selectAll"),
  },
  shouldShowMenu: (_event, params) => {
    return params.isEditable || !!params.selectionText;
  },
  prepend: (
    _defaultActions,
    parameters,
    browserWindow: BrowserWindow,
    _event
  ) => [
    {
      label: t("lookup"),
      visible:
        parameters.selectionText.trim().length > 0 &&
        !parameters.selectionText.trim().includes(" "),
      click: () => {
        const { x, y, selectionText } = parameters;
        browserWindow.webContents.send("on-lookup", selectionText, { x, y });
      },
    },
    {
      label: t("aiTranslate"),
      visible: parameters.selectionText.trim().length > 0,
      click: () => {
        const { x, y, selectionText } = parameters;
        browserWindow.webContents.send("on-translate", selectionText, { x, y });
      },
    },
  ],
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (ElectronSquirrelStartup) {
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
    if (url.match(/library\/(audios|videos|recordings|speeches|segments)/g)) {
      url = url.replace("library/", "");
      url = path.join(settings.userDataPath(), url);
    } else if (url.startsWith("library")) {
      url = url.replace("library/", "");
      url = path.join(settings.libraryPath(), url);
    }

    return net.fetch(`file:///${url}`);
  });

  mainWindow.init();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow.init();
  }
});

// Clean up cache folder before quit
app.on("before-quit", () => {
  try {
    fs.emptyDirSync(settings.cachePath());
  } catch (err) {}
});
