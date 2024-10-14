import { ipcMain, app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import mainWin from "@main/window";
import log from "@main/logger";
import settings from "@main/settings";

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

      const cachePath = settings.cachePath();
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
          item.setSavePath(path.join(cachePath, item.getFilename()));
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

  prinfAsPDF(content: string, savePath: string) {
    let pdfWin: BrowserWindow | null = null;

    return new Promise((resolve, reject) => {
      pdfWin = new BrowserWindow({
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false,
        },
        show: false,
        width: 800,
        height: 600,
        fullscreenable: false,
        minimizable: false,
      });

      pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURI(content)}`);

      pdfWin.webContents.on("did-finish-load", () => {
        pdfWin.webContents
          .printToPDF({ printBackground: true })
          .then((data) => {
            fs.writeFile(savePath, data, (error) => {
              if (error) throw error;

              resolve(savePath);

              pdfWin.close();
              pdfWin = null;
            });
          })
          .catch((error) => {
            reject(error);
          });
      });
    });
  }

  pause(filename: string) {
    this.tasks
      .filter(
        (t) => t.getFilename() === filename && t.getState() === "progressing"
      )
      .forEach((t) => {
        t.pause();
      });
  }

  resume(filename: string) {
    this.tasks
      .filter(
        (t) =>
          t.getFilename() === filename &&
          ["progressing", "interrupted"].includes(t.getState())
      )
      .forEach((t) => {
        t.resume();
      });
  }

  cancel(filename: string) {
    this.tasks
      .filter(
        (t) => t.getFilename() === filename && t.getState() === "progressing"
      )
      .forEach((t) => {
        t.cancel();
      });
  }

  remove(filename: string) {
    this.cancel(filename);
    this.tasks = this.tasks.filter((t) => t.getFilename() !== filename);
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
      this.cancel(filename);
    });
    ipcMain.handle("download-pause", (_event, filename) => {
      this.pause(filename);
    });
    ipcMain.handle("download-resume", (_event, filename) => {
      this.resume(filename);
    });
    ipcMain.handle("download-remove", (_event, filename) => {
      this.remove(filename);
    });
    ipcMain.handle("download-cancel-all", () => {
      this.cancelAll();
    });
    ipcMain.handle("download-dashboard", () => {
      return this.dashboard();
    });
    ipcMain.handle("print-as-pdf", (_event, content, savePath) => {
      return this.prinfAsPDF(content, savePath);
    });
  }
}

export default new Downloader();
