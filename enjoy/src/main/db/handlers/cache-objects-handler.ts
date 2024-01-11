import { ipcMain, IpcMainEvent } from "electron";
import { CacheObject } from "@main/db/models";
import db from "@main/db";

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

  register() {
    ipcMain.handle("cache-objects-get", this.get);
    ipcMain.handle("cache-objects-set", this.set);
    ipcMain.handle("cache-objects-delete", this.delete);
    ipcMain.handle("cache-objects-clear", this.clear);
  }
}

export const cacheObjectsHandler = new CacheObjectsHandler();
