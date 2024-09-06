import { ipcMain, IpcMainEvent } from "electron";
import { CacheObject } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import db from "@main/db";
import settings from "@main/settings";

class CacheObjectsHandler {
  private async get(event: IpcMainEvent, key: string) {
    return CacheObject.get(key)
      .then((value) => {
        return value;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async set(
    event: IpcMainEvent,
    key: string,
    value: string | object,
    ttl?: number
  ) {
    return CacheObject.set(key, value, ttl)
      .then(() => {
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async delete(event: IpcMainEvent, key: string) {
    return CacheObject.destroy({ where: { key } })
      .then(() => {
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async clear(event: IpcMainEvent) {
    return CacheObject.destroy({ where: {} })
      .then(() => {
        db.connection.query("VACUUM");
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async writeFile(
    _event: IpcMainEvent,
    filename: string,
    data: ArrayBuffer
  ) {
    const output = path.join(settings.cachePath(), filename);
    fs.writeFileSync(output, Buffer.from(data));

    return `enjoy://library/cache/${filename}`;
  }

  register() {
    ipcMain.handle("cache-objects-get", this.get);
    ipcMain.handle("cache-objects-set", this.set);
    ipcMain.handle("cache-objects-delete", this.delete);
    ipcMain.handle("cache-objects-clear", this.clear);
    ipcMain.handle("cache-objects-write-file", this.writeFile);
  }

  unregister() {
    ipcMain.removeHandler("cache-objects-get");
    ipcMain.removeHandler("cache-objects-set");
    ipcMain.removeHandler("cache-objects-delete");
    ipcMain.removeHandler("cache-objects-clear");
    ipcMain.removeHandler("cache-objects-write-file");
  }
}

export const cacheObjectsHandler = new CacheObjectsHandler();
