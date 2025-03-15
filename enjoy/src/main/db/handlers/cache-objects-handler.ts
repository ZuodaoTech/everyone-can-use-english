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
    return this.handleRequest(event, async () => {
      const value = await CacheObject.get(key);
      return value;
    });
  }

  private async set(
    event: IpcMainEvent,
    key: string,
    value: string | object,
    ttl?: number
  ) {
    return this.handleRequest(event, async () => {
      await CacheObject.set(key, value, ttl);
      return true;
    });
  }

  private async delete(event: IpcMainEvent, key: string) {
    return this.handleRequest(event, async () => {
      await CacheObject.destroy({ where: { key } });
    });
  }

  private async clear(event: IpcMainEvent) {
    return this.handleRequest(event, async () => {
      await CacheObject.destroy({ where: {} });
      db.connection.query("VACUUM");
      return true;
    });
  }

  private async writeFile(
    _event: IpcMainEvent,
    filename: string,
    data: ArrayBuffer
  ) {
    return this.handleRequest(_event, async () => {
      const output = path.join(config.cachePath(), filename);
      fs.writeFileSync(output, Buffer.from(data));

      return `enjoy://library/cache/${filename}`;
    });
  }
}

export const cacheObjectsHandler = new CacheObjectsHandler();
