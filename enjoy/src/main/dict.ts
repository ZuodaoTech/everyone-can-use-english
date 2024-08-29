import path from "path";
import fs from "fs-extra";
import { ipcMain } from "electron";
import { LRUCache } from "lru-cache";
import log from "@main/logger";
import { DICTS } from "@/constants/dicts";
import sqlite3, { Database } from "sqlite3";
import settings from "./settings";
import downloader from "./downloader";
import decompresser from "./decompresser";
import { hashFile } from "@/main/utils";

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

  async isDictFileValid(dict: Dict) {
    const filePath = path.join(this.dictsPath, dict.fileName);

    if (!fs.existsSync(filePath)) return false;

    const hash = await hashFile(filePath, { algo: "md5" });

    return hash === dict.hash;
  }

  async download(dict: Dict) {
    const filePath = path.join(this.dictsPath, dict.fileName);
    const dictPath = path.join(this.dictsPath, dict.name);

    if (fs.existsSync(dictPath)) {
      throw new Error("Dictionary already exists");
    }

    const isDictFileValid = await this.isDictFileValid(dict);

    if (isDictFileValid) {
      this.decompress(dict);
    } else {
      if (fs.existsSync(filePath)) {
        await fs.remove(filePath);
      }

      downloader.download(dict.downloadUrl, {
        savePath: this.dictsPath,
      });
    }
  }

  async decompress(dict: Dict) {
    const filePath = path.join(this.dictsPath, dict.fileName);
    const dictPath = path.join(this.dictsPath, dict.name);
    const isDictFileValid = await this.isDictFileValid(dict);

    if (isDictFileValid) {
      await decompresser.depress({
        filePath,
        hash: dict.hash,
        destPath: dictPath,
        id: `dict-${dict.fileName}`,
      });
    }

    downloader.remove(dict.fileName);
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

  async getDicts() {
    const dicts = DICTS.map((dict: Dict) => {
      let state: DictState = "uninstall";
      let downloadState;
      let decompressProgress;

      const files = fs.readdirSync(this.dictsPath);
      const isInstalled = files.find((file) => file === dict.name);

      const decompressTask = decompresser.tasks.find(
        (task) => task.id === `dict-${dict.fileName}`
      );

      const downloadTask = downloader.tasks.find(
        (task) => task.getFilename() === dict.fileName
      );

      if (decompressTask) {
        state = "decompressing";
        decompressProgress = decompressTask.progress;
      } else if (isInstalled) {
        state = "installed";
      } else if (downloadTask) {
        state = "downloading";
        downloadState = {
          name: downloadTask.getFilename(),
          state: downloadTask.getState(),
          isPaused: downloadTask.isPaused(),
          canResume: downloadTask.canResume(),
          total: downloadTask.getTotalBytes(),
          received: downloadTask.getReceivedBytes(),
        };
      }

      return { ...dict, state, downloadState, decompressProgress };
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
    ipcMain.handle("dict-download", async (_event, dict: Dict) =>
      this.download(dict)
    );

    ipcMain.handle("dict-decompress", async (_event, dict: Dict) =>
      this.decompress(dict)
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
