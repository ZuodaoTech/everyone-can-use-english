import {
  app,
  BrowserWindow,
  protocol,
  net,
  globalShortcut,
  desktopCapturer,
  screen,
} from "electron";
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
import sharp from "sharp";

const logger = log.scope("main");

if (app.isPackaged) {
  Sentry.init({
    dsn: SENTRY_DSN,
  });
}

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
  if (!app.isPackaged) {
    import("electron-devtools-installer")
      .then((mymodule: any) => {
        const installExtension = mymodule.default.default; // Default export
        installExtension(mymodule.default.REACT_DEVELOPER_TOOLS, {
          loadExtensionOptions: {
            allowFileAccess: true,
          },
        }); // replace param with the ext ID of your choice
      })
      .catch((err) => console.log("An error occurred: ", err));
  }

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

  globalShortcut.register("CommandOrControl+X", async () => {
    console.log("CommandOrControl+X is pressed");

    // get the mouse cursor position
    const { x, y } = screen.getCursorScreenPoint();
    console.log("mouse", x, y);

    // get the display where the mouse is
    const display = screen.getDisplayNearestPoint({ x, y });
    const displaySize = display.workAreaSize;
    console.log("display", displaySize.width, displaySize.height);

    // calculate the capture area
    let captureWidth = 1200;
    let captureHeight = 500;
    let left = Math.max(x - captureWidth / 2, 0);
    let top = Math.max(y - captureHeight / 2, 0);

    // Make sure the capture area is within the display
    left = Math.min(left, displaySize.width - captureWidth);
    top = Math.min(top, displaySize.height - captureHeight);
    console.log("left", left, "top", top);

    // capture screen and save to file
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      // should be the same as the size of the display
      thumbnailSize: displaySize,
    });
    const image = sources[0];
    const size = image.thumbnail.getSize();

    const highlightSize = 20; // 高亮区域的大小
    const highlightColor = { r: 255, g: 255, b: 0, alpha: 0.5 }; // 荧光黄色，半透明
    const highlightBuffer = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 4,
        background: { r: 255, g: 255, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
    fs.writeFileSync(
      path.join(settings.cachePath(), "mark.png"),
      highlightBuffer
    );

    console.log("image", image.thumbnail.getSize());

    // save image to file
    const buffer = await sharp(await image.thumbnail.toPNG())
      .grayscale()
      .composite([
        { input: highlightBuffer, blend: "over", top: y - 20, left: x - 10 },
      ])
      .toBuffer();
    const cropedBuffer = await sharp(buffer)
      .extract({
        left: left,
        top: top,
        width: captureWidth,
        height: captureHeight,
      })
      .resize(600, 250)
      .toBuffer();

    fs.writeFileSync(
      path.join(settings.cachePath(), "screenshot-for-lookup.png"),
      cropedBuffer
    );
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
