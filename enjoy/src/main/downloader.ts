import { ipcMain, app } from "electron";
import path from "path";
import fs from "fs";
import mainWin from "@main/window";
import log from "@main/logger";

const logger = log.scope("downloader");
class Downloader {
  public tasks: Electron.DownloadItem[];

  constructor() {
    this.tasks = [];
  }

  download(
    url: string,
    options?: {
      webContents?: Electron.WebContents;
      savePath?: string;
    }
  ): Promise<string | undefined> {
    const { webContents = mainWin.win.webContents, savePath } = options || {};
    return new Promise((resolve, _reject) => {
      webContents.downloadURL(url);
      webContents.session.on("will-download", (_event, item, _webContents) => {
        if (savePath) {
          try {
            if (fs.statSync(savePath).isDirectory()) {
              item.setSavePath(path.join(savePath, item.getFilename()));
            } else {
              item.setSavePath(savePath);
            }
          } catch {
            item.setSavePath(savePath);
          }
        } else {
          item.setSavePath(
            path.join(app.getPath("downloads"), item.getFilename())
          );
        }

        this.tasks.push(item);

        item.on("updated", (_, state) => {
          webContents.send("download-on-state", {
            name: item.getFilename(),
            state,
            received: item.getReceivedBytes(),
            total: item.getTotalBytes(),
          });

          if (state === "interrupted") {
            resolve(undefined);
          }
        });

        item.on("done", (_, state) => {
          webContents.send("download-on-state", {
            name: item.getFilename(),
            state,
            received: item.getReceivedBytes(),
            total: item.getTotalBytes(),
          });

          if (state === "completed") {
            resolve(item.getSavePath());
          } else {
            if (fs.lstatSync(item.getSavePath()).isFile()) {
              fs.rmSync(item.getSavePath(), {
                force: true,
              });
            }
            resolve(undefined);
          }
        });
      });
    });
  }

  cancel(filename: string) {
    logger.debug("dashboard", this.dashboard());
    this.tasks
      .filter(
        (t) => t.getFilename() === filename && t.getState() === "progressing"
      )
      .forEach((t) => {
        t.cancel();
      });
  }

  cancelAll() {
    for (const task of this.tasks) {
      task.cancel();
    }
  }

  clear() {
    this.cancelAll();
    this.tasks.splice(0, this.tasks.length);
  }

  dashboard() {
    return this.tasks.map((t) => ({
      name: t.getFilename(),
      state: t.getState(),
      received: t.getReceivedBytes(),
      total: t.getTotalBytes(),
    }));
  }

  registerIpcHandlers() {
    ipcMain.handle("download-start", (event, url, savePath) => {
      return this.download(url, {
        webContents: event.sender,
        savePath,
      });
    });
    ipcMain.handle("download-cancel", (_event, filename) => {
      logger.debug("download-cancel", filename);
      this.cancel(filename);
    });
    ipcMain.handle("download-cancel-all", () => {
      this.cancelAll();
    });
    ipcMain.handle("download-dashboard", () => {
      return this.dashboard();
    });
  }
}

export default new Downloader();
