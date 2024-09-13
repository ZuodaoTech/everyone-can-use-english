import log from "@main/logger";
import path from "path";
import fs from "fs-extra";
import { ipcMain } from "electron";
import { LRUCache } from "lru-cache";
import { Mdict as MdictReader } from "@divisey/js-mdict";
import { hashFile } from "@/main/utils";
import settings from "./settings";

const logger = log.scope("mdict");

export class MDictHandler {
  private cache = new LRUCache({ max: 20 });
  private mdx: MdictReader;
  private mdds: Record<string, MdictReader>;
  private currentDictHash: string;

  addition =
    '<link href="/assets/styles/mdict-theme.css" rel="stylesheet" type="text/css" />';

  get dictsPath() {
    const _path = path.join(settings.libraryPath(), "dictionaries");
    fs.ensureDirSync(_path);

    return _path;
  }

  async import(pathes: string[]) {
    logger.info("Importing mdict: ", pathes);
    const mdxs = pathes.filter((_path) => _path.match(/\.mdx$/));
    const mdds = pathes.filter((_path) => _path.match(/\.mdd$/));

    if (mdxs.length > 1) {
      throw new Error("Multi mdx file found, only one is allowed");
    }

    if (mdxs.length < 1) {
      throw new Error("No mdx file found");
    }

    const mdx = mdxs[0];
    const hash = await hashFile(mdx, { algo: "md5" });

    for (let _path of pathes) {
      await fs.copy(
        _path,
        path.join(this.dictsPath, hash, path.basename(_path))
      );
    }

    return {
      title: path.basename(mdx, ".mdx"),
      mdx,
      mdds,
      hash,
    };
  }

  async remove(mdict: MDict) {
    await fs.remove(path.join(this.dictsPath, mdict.hash));
  }

  lookup(word: string, mdict: MDict): string {
    if (mdict.hash !== this.currentDictHash) {
      this.mdx = new MdictReader(mdict.mdx);
    }

    let result = this.mdx.lookup(word)?.definition ?? null;

    if (result?.startsWith("@@@LINK=")) {
      return this.lookup(result.substring(8), mdict);
    }

    return result ? `${this.addition}${result}` : null;
  }

  getResource(key: string, mdict: MDict) {
    const cacheKey = `${mdict.hash}-${key}`;
    const cachedValue = this.cache.get(cacheKey);

    if (cachedValue) {
      return cachedValue;
    }

    if (mdict.hash !== this.currentDictHash) {
      this.mdds = {};
    }

    if (key.match(/\.(css|js)$/)) {
      const _path = path.join(this.dictsPath, mdict.hash, key);

      if (fs.existsSync(_path)) {
        const data = fs.readFileSync(_path, { encoding: "base64" });

        this.cache.set(cacheKey, data);
        return data;
      }
    }

    try {
      for (let _path of mdict.mdds) {
        if (!this.mdds[_path]) {
          this.mdds[_path] = new MdictReader(_path);
        }

        const parsedKey =
          "\\" + key.replace(/(^[/\\])|([/]$)/, "").replace(/\//g, "\\");
        const data = this.mdds[_path].locate(parsedKey);

        if (data) {
          this.cache.set(cacheKey, data.definition);
          return data.definition;
        } else {
          return "";
        }
      }
    } catch (err) {
      logger.error(`Failed to read resource ${key}`, err);
      return "";
    }
  }

  registerIpcHandlers() {
    ipcMain.handle("mdict-import", async (_event, pathes: string[]) =>
      this.import(pathes)
    );

    ipcMain.handle("mdict-remove", async (_event, mdict: MDict) =>
      this.remove(mdict)
    );

    ipcMain.handle("mdict-lookup", async (_event, word: string, mdict: MDict) =>
      this.lookup(word, mdict)
    );

    ipcMain.handle(
      "mdict-read-file",
      async (_event, word: string, mdict: MDict) =>
        this.getResource(word, mdict)
    );
  }
}

export default new MDictHandler();
