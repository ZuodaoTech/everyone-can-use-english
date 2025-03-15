import { ipcMain, IpcMainEvent } from "electron";
import { CacheObject } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import db from "@main/db";
import { config } from "@main/config";
import { BaseHandler } from "./base-handler";

class CacheObjectsHandler extends BaseHandler {
  protected prefix = "cache-objects";
  protected handlers = {
    get: this.get.bind(this),
    set: this.set.bind(this),
    delete: this.delete.bind(this),
    clear: this.clear.bind(this),
    "write-file": this.writeFile.bind(this),
  };

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
    const output = path.join(config.cachePath(), filename);
    fs.writeFileSync(output, Buffer.from(data));

    return `enjoy://library/cache/${filename}`;
  }
}

export const cacheObjectsHandler = new CacheObjectsHandler();
