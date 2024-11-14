import {
  app,
  BrowserWindow,
  WebContentsView,
  Menu,
  ipcMain,
  shell,
  dialog,
  systemPreferences,
} from "electron";
import path from "path";
import db from "@main/db";
import settings from "@main/settings";
import downloader from "@main/downloader";
import fs from "fs-extra";
import log from "@main/logger";
import { REPO_URL, WS_URL } from "@/constants";
import { AudibleProvider, TedProvider, YoutubeProvider } from "@main/providers";
import Ffmpeg from "@main/ffmpeg";
import { Waveform } from "./waveform";
import url from "url";
import echogarden from "./echogarden";
import camdict from "./camdict";
import dict from "./dict";
import mdict from "./mdict";
import decompresser from "./decompresser";
import { UserSetting } from "@main/db/models";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = log.scope("window");

const audibleProvider = new AudibleProvider();
const tedProvider = new TedProvider();
const youtubeProvider = new YoutubeProvider();
const ffmpeg = new Ffmpeg();
const waveform = new Waveform();

const main = {
  win: null as BrowserWindow | null,
  init: () => {},
};

main.init = async () => {
  if (main.win) {
    main.win.show();
    return;
  }

  // Prepare local database
  db.registerIpcHandlers();

  camdict.registerIpcHandlers();
  dict.registerIpcHandlers();
  mdict.registerIpcHandlers();

  // Prepare Settings
  settings.registerIpcHandlers();

  // echogarden
  echogarden.registerIpcHandlers();

  // Waveform
  waveform.registerIpcHandlers();

  // Downloader
  downloader.registerIpcHandlers();

  decompresser.registerIpcHandlers();

  // ffmpeg
  ffmpeg.registerIpcHandlers();

  // AudibleProvider
  audibleProvider.registerIpcHandlers();

  // TedProvider
  tedProvider.registerIpcHandlers();

  // YoutubeProvider
  youtubeProvider.registerIpcHandlers();

  // proxy
  ipcMain.handle("system-proxy-get", (_event) => {
    let proxy = settings.getSync("proxy");
    if (!proxy) {
      proxy = {
        enabled: false,
        url: "",
      };
      settings.setSync("proxy", proxy);
    }

    return proxy;
  });

  ipcMain.handle("system-proxy-set", (_event, config) => {
    if (!config) {
      throw new Error("Invalid proxy config");
    }

    if (config && !config.url) {
      config.enabled = false;
    }

    return settings.setSync("proxy", config);
  });

  ipcMain.handle("system-proxy-refresh", (_event) => {
    let config = settings.getSync("proxy") as ProxyConfigType;
    if (!config) {
      config = {
        enabled: false,
        url: "",
      };
      settings.setSync("proxy", config);
    }

    if (config.enabled && config.url) {
      const uri = new URL(config.url);
      const proxyRules = `http=${uri.host};https=${uri.host}`;

      mainWindow.webContents.session.setProxy({
        proxyRules,
      });
      mainWindow.webContents.session.closeAllConnections();
    } else {
      mainWindow.webContents.session.setProxy({
        mode: "system",
      });
      mainWindow.webContents.session.closeAllConnections();
    }
  });

  // BrowserView
  ipcMain.handle(
    "view-load",
    (
      event,
      url,
      bounds: { x: number; y: number; width: number; height: number },
      options?: {
        navigatable?: boolean;
      }
    ) => {
      const {
        x = 0,
        y = 0,
        width = mainWindow.getBounds().width,
        height = mainWindow.getBounds().height,
      } = bounds;
      const { navigatable = false } = options || {};

      logger.debug("view-load", url);
      const view = new WebContentsView();
      mainWindow.contentView.addChildView(view);

      view.setBounds({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });

      view.webContents.on("did-navigate", (_event, url) => {
        event.sender.send("view-on-state", {
          state: "did-navigate",
          url,
        });
      });
      view.webContents.on(
        "did-fail-load",
        (_event, _errorCode, errrorDescription, validatedURL) => {
          event.sender.send("view-on-state", {
            state: "did-fail-load",
            error: errrorDescription,
            url: validatedURL,
          });
          (view.webContents as any).destroy();
          mainWindow.contentView.removeChildView(view);
        }
      );
      view.webContents.on("did-finish-load", () => {
        view.webContents
          .executeJavaScript(`document.documentElement.innerHTML`)
          .then((html) => {
            event.sender.send("view-on-state", {
              state: "did-finish-load",
              html,
            });
          });
      });

      view.webContents.on("will-redirect", (detail) => {
        event.sender.send("view-on-state", {
          state: "will-redirect",
          url: detail.url,
        });

        logger.debug("will-redirect", detail.url);
      });

      view.webContents.on("will-navigate", (detail) => {
        event.sender.send("view-on-state", {
          state: "will-navigate",
          url: detail.url,
        });

        logger.debug("will-navigate", detail.url);
        if (!navigatable) {
          logger.debug("prevent navigation", detail.url);
          detail.preventDefault();
        }
      });
      view.webContents.loadURL(url);
    }
  );

  ipcMain.handle("view-remove", () => {
    logger.debug("view-remove");
    mainWindow.contentView.children.forEach((view) => {
      mainWindow.contentView.removeChildView(view);
    });
  });

  ipcMain.handle("view-hide", () => {
    logger.debug("view-hide");
    const view = mainWindow.contentView.children[0];
    if (!view) return;

    view.setVisible(false);
  });

  ipcMain.handle(
    "view-show",
    (
      _event,
      bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    ) => {
      const view = mainWindow.contentView.children[0];
      if (!view) return;

      logger.debug("view-show", bounds);
      view.setVisible(true);
    }
  );

  ipcMain.handle("view-scrape", (event, url) => {
    logger.debug("view-scrape", url);
    const view = new WebContentsView();
    view.setVisible(false);
    mainWindow.contentView.addChildView(view);

    // Add timeout handler
    const timeout = setTimeout(() => {
      logger.debug("view-scrape timeout", url);
      event.sender.send("view-on-state", {
        state: "did-fail-load",
        error: "Request timed out",
        url: url,
      });
      (view.webContents as any)?.destroy();
      mainWindow.contentView.removeChildView(view);
    }, 30000); // 30 second timeout

    view.webContents.on("did-start-loading", () => {
      logger.debug("view-scrape did-start-loading", url);
    });

    view.webContents.on("did-stop-loading", () => {
      logger.debug("view-scrape did-stop-loading", url);
    });

    view.webContents.on("dom-ready", () => {
      logger.debug("view-scrape dom-ready", url);
    });

    view.webContents.on("did-navigate", (_event, url) => {
      clearTimeout(timeout);
      event.sender.send("view-on-state", {
        state: "did-navigate",
        url,
      });
    });
    view.webContents.on(
      "did-fail-load",
      (_event, _errorCode, errrorDescription, validatedURL) => {
        clearTimeout(timeout);
        event.sender.send("view-on-state", {
          state: "did-fail-load",
          error: errrorDescription,
          url: validatedURL,
        });
        (view.webContents as any).destroy();
        mainWindow.contentView.removeChildView(view);
      }
    );
    view.webContents.on("did-finish-load", () => {
      clearTimeout(timeout);
      logger.debug("view-scrape did-finish-load", url);
      view.webContents
        .executeJavaScript(`document.documentElement.innerHTML`)
        .then((html) => {
          event.sender.send("view-on-state", {
            state: "did-finish-load",
            html,
            url,
          });
          (view.webContents as any).destroy();
          mainWindow.contentView.removeChildView(view);
        });
    });

    view.webContents.loadURL(url).catch((err) => {
      logger.error("view-scrape loadURL error", err);
      (view.webContents as any).destroy();
      mainWindow.contentView.removeChildView(view);
      event.sender.send("view-on-state", {
        state: "did-fail-load",
        error: err.message,
        url: url,
      });
    });
  });

  // App options
  ipcMain.handle("app-platform-info", () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.getSystemVersion(),
    };
  });

  ipcMain.handle("app-reset", async () => {
    const userDataPath = settings.userDataPath();

    await db.disconnect();

    fs.removeSync(userDataPath);
    fs.removeSync(settings.file());

    app.relaunch();
    app.exit();
  });

  ipcMain.handle("app-reset-settings", () => {
    UserSetting.clear();
  });

  ipcMain.handle("app-relaunch", () => {
    app.relaunch();
    app.exit();
  });

  ipcMain.handle("app-reload", () => {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }
  });

  ipcMain.handle("app-is-packaged", () => {
    return app.isPackaged;
  });

  ipcMain.handle("app-api-url", () => {
    return settings.apiUrl();
  });

  ipcMain.handle("app-ws-url", () => {
    const wsUrl = settings.getSync("wsUrl");
    return process.env.WS_URL || wsUrl || WS_URL;
  });

  ipcMain.handle("app-quit", () => {
    app.quit();
  });

  ipcMain.handle("app-open-dev-tools", () => {
    mainWindow.webContents.openDevTools();
  });

  ipcMain.handle("app-create-issue", (_event, title, log) => {
    const body = `**Version**

${app.getVersion()}

**Platform**

${process.platform} ${process.arch} ${process.getSystemVersion()}

**Log**
\`\`\`
${log}
\`\`\`
  `;

    const params = {
      title,
      body,
    };

    shell.openExternal(
      `${REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`
    );
  });

  ipcMain.handle(
    "system-preferences-media-access",
    async (_event, mediaType: "microphone" | "camera") => {
      if (process.platform === "linux") return true;
      if (process.platform === "win32")
        return systemPreferences.getMediaAccessStatus(mediaType) === "granted";

      if (process.platform === "darwin") {
        const status = systemPreferences.getMediaAccessStatus(mediaType);
        logger.debug("system-preferences-media-access", status);
        if (status !== "granted") {
          const result = await systemPreferences.askForMediaAccess(mediaType);
          return result;
        } else {
          return true;
        }
      }
    }
  );

  ipcMain.handle("app-disk-usage", () => {
    const paths: { [key: string]: string } = {
      library: settings.libraryPath(),
      database: settings.dbPath(),
      settings: settings.file(),
      audios: path.join(settings.userDataPath(), "audios"),
      videos: path.join(settings.userDataPath(), "videos"),
      segments: path.join(settings.userDataPath(), "segments"),
      speeches: path.join(settings.userDataPath(), "speeches"),
      recordings: path.join(settings.userDataPath(), "recordings"),
      waveforms: path.join(settings.libraryPath(), "waveforms"),
      logs: path.join(settings.libraryPath(), "logs"),
      cache: settings.cachePath(),
    };

    const sizeSync = (p: string): number => {
      const stat = fs.statSync(p);
      if (stat.isFile()) return stat.size;
      else if (stat.isDirectory())
        return fs
          .readdirSync(p)
          .reduce((a, e) => a + sizeSync(path.join(p, e)), 0);
      else return 0; // can't take size of a stream/symlink/socket/
    };

    return Object.keys(paths).map((key) => {
      const p = paths[key];
      const size = sizeSync(p);

      return {
        name: key,
        path: p,
        size,
      };
    });
  });

  // Shell
  ipcMain.handle("shell-open-external", (_event, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle("shell-open-path", (_event, path) => {
    shell.openPath(path);
  });

  // Dialog
  ipcMain.handle("dialog-show-open-dialog", (event, options) => {
    return dialog.showOpenDialogSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-save-dialog", (event, options) => {
    return dialog.showSaveDialogSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-message-box", (event, options) => {
    return dialog.showMessageBoxSync(
      BrowserWindow.fromWebContents(event.sender),
      options
    );
  });

  ipcMain.handle("dialog-show-error-box", (_event, title, content) => {
    return dialog.showErrorBox(title, content);
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    icon:
      process.platform === "win32" ? "./assets/icon.ico" : "./assets/icon.png",
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      spellcheck: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("resize", () => {
    mainWindow.webContents.send("window-on-resize", mainWindow.getBounds());
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "allow" };
  });

  // Capture stderr & stdout and send them to renderer
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, encoding?, callback?) => {
    // Remove ANSI color codes
    const output = chunk
      .toString()
      .replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, "");
    mainWindow.webContents.send("app-on-cmd-output", output);

    return originalStderrWrite(chunk, encoding, callback);
  };
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, encoding?, callback?) => {
    // Remove ANSI color codes
    const output = chunk
      .toString()
      .replace(/\x1B\[([0-9]{1,3}(;[0-9]{1,2};?)?)?[mGK]/g, "");
    mainWindow.webContents.send("app-on-cmd-output", output);

    return originalStdoutWrite(chunk, encoding, callback);
  };

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);

    // Open the DevTools.
    setTimeout(() => {
      mainWindow.webContents.openDevTools();
    }, 100);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
    // mainWindow.webContents.openDevTools();
  }

  Menu.setApplicationMenu(null);

  main.win = mainWindow;
};

export default main;
