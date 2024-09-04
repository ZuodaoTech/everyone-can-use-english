import path from "path";
import fs from "fs-extra";
import { ipcMain } from "electron";
import { LRUCache } from "lru-cache";
import log from "@main/logger";
import { DICTS } from "@/constants/dicts";
import sqlite3, { Database } from "sqlite3";
import settings from "./settings";
import { hashFile } from "@/main/utils";
import decompresser from "./decompresser";

const logger = log.scope("dict");
const sqlite = sqlite3.verbose();

export class DictHandler {
  private cache = new LRUCache({ max: 20 });
  private db: Database;
  private currentDict: string;

  get dictsPath() {
    const _path = path.join(settings.libraryPath(), "dictionaries");
    fs.ensureDirSync(_path);

    return _path;
  }

  async import(_path: string) {
    const hash = await hashFile(_path, { algo: "md5" });
    const dict = DICTS.find((dict) => dict.hash === hash);

    if (!dict) {
      throw new Error("SQLite file not match with any perset dictionary");
    }

    if (this.isInstalled(dict)) {
      throw new Error("Current dict is already installed");
    }

    decompresser.depress({
      id: `dict-${dict.name}`,
      type: "dict",
      title: dict.title,
      filePath: _path,
      destPath: path.join(this.dictsPath, dict.name),
    });
  }

  async remove(dict: Dict) {
    await fs.remove(path.join(this.dictsPath, dict.name));
  }

  async lookup(word: string, dict: Dict) {
    if (this.currentDict !== dict.name) {
      this.db = new sqlite.Database(
        path.join(this.dictsPath, dict.name, `${dict.name}.sqlite`)
      );

      this.currentDict = dict.name;
    }

    const result = await this.query(word);

    return result ? `${dict.addition}${result}` : null;
  }

  query(word: string) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT definition FROM definitions WHERE id=(SELECT definition_id FROM words WHERE word="${word}")`,
        (err, row: any) => {
          if (err) reject(err);
          resolve(row?.definition ?? "");
        }
      );
    });
  }

  isInstalled(dict: Dict) {
    const files = fs.readdirSync(this.dictsPath);
    return files.find((file) => file === dict.name);
  }

  async getDicts() {
    const dicts = DICTS.map((dict: Dict) => {
      return {
        ...dict,
        state: this.isInstalled(dict) ? "installed" : "uninstall",
      };
    });

    return dicts;
  }

  getResource(key: string, dict: Dict) {
    const filePath = path.join(this.dictsPath, dict.name, key);
    const cachedValue = this.cache.get(filePath);
    if (cachedValue) return cachedValue;

    try {
      const data = fs.readFileSync(filePath, { encoding: "base64" });
      this.cache.set(filePath, data);

      return data;
    } catch (err) {
      logger.error(`Failed to read file ${filePath}`, err);
      return "";
    }
  }

  registerIpcHandlers() {
    ipcMain.handle("dict-import", async (_event, dir: string) =>
      this.import(dir)
    );

    ipcMain.handle("dict-remove", async (_event, dict: Dict) =>
      this.remove(dict)
    );

    ipcMain.handle("dict-list", async (_event) => this.getDicts());

    ipcMain.handle("dict-read-file", async (_event, path: string, dict: Dict) =>
      this.getResource(path, dict)
    );

    ipcMain.handle("dict-lookup", async (_event, word: string, dict: Dict) =>
      this.lookup(word, dict)
    );
  }
}

export default new DictHandler();
