import { app } from "electron";
import path from "path";
import { exec } from "child_process";
import fs from "fs-extra";
import os from "os";
import log from "@main/logger";
import snakeCase from "lodash/snakeCase";
import settings from "@main/settings";
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = log.scope("YOUTUBEDR");

type YoutubeInfoType = {
  Title: string;
  Id: string;
  Author: string;
  Duration: number;
  Description: string;
  Formats: {
    Itag: number;
    FPS: number;
    VideoQuality: string;
    AudioQuality: string;
    AudioChannels: number;
    Size: number;
    Bitrate: number;
    MimeType: string;
  }[];
};

const validQueryDomains = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "gaming.youtube.com",
]);

const validPathDomains =
  /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;

const ONE_MINUTE = 1000 * 60; // 1 minute

class Youtubedr {
  private binFile: string;

  constructor() {
    this.binFile = path.join(
      __dirname,
      "lib",
      "youtubedr",
      os.platform() === "win32" ? "youtubedr.exe" : "youtubedr"
    );
  }

  async autoDownload(url: string) {
    logger.debug("fetching video info", url);

    const info = await this.info(url);
    // Ensure the format is video and has audio
    const format = info.Formats.find(
      (format: any) =>
        Boolean(format.AudioChannels) && format.MimeType.startsWith("video")
    );

    if (!format) {
      logger.debug("formats", info);
      throw new Error("No suitable format found");
    }

    const filename = `${snakeCase(info.Title)}.mp4`;
    const directory = settings.cachePath();

    logger.debug("try to download", format);
    return this.download(url, {
      quality: format.Itag,
      filename,
      directory,
    });
  }

  async download(
    url: string,
    options: {
      quality?: string | number;
      filename?: string;
      directory?: string;
    } = {}
  ): Promise<string> {
    const {
      quality,
      filename = this.getYtVideoId(url) + ".mp4",
      directory = app.getPath("downloads"),
    } = options;

    const command = [
      this.binFile,
      "download",
      `"${url}"`,
      `--quality ${quality || "medium"}`,
      `--filename "${filename}"`,
      `--directory "${directory}"`,
    ].join(" ");

    logger.info(`Running command: ${command}`);
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          timeout: ONE_MINUTE * 15,
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("error", error);
          }

          if (stderr) {
            logger.error("stderr", stderr);
          }

          if (stdout) {
            logger.debug(stdout);
          }

          if (fs.existsSync(path.join(directory, filename))) {
            const stat = fs.statSync(path.join(directory, filename));
            if (stat.size === 0) {
              reject(new Error("Youtubedr download failed: empty file"));
            } else {
              resolve(path.join(directory, filename));
            }
          } else {
            reject(new Error("Youtubedr download failed: unknown error"));
          }
        }
      );
    });
  }

  async info(url: string): Promise<YoutubeInfoType> {
    const command = [this.binFile, "info", `"${url}"`, "--format json"].join(
      " "
    );
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          timeout: ONE_MINUTE,
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error(error);
            reject(error);
          }

          if (stderr) {
            logger.error(stderr);
            reject(new Error(stderr));
          }

          if (stdout) {
            logger.debug(stdout);
            try {
              const info = JSON.parse(stdout);
              resolve(info);
            } catch (err) {
              logger.error("json result failed to parse", err);
              reject(stdout);
            }
          }

          reject(new Error("Youtubedr info failed: unknown error"));
        }
      );
    });
  }

  // ref: https://github.com/fent/node-ytdl-core/blob/master/lib/url-utils.js
  validateYtVideoId = (id: string) => {
    return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
  };

  getYtVideoId = (url: string) => {
    const parsed = new URL(url);
    let id = parsed.searchParams.get("v");
    if (validPathDomains.test(url.trim()) && !id) {
      const paths = parsed.pathname.split("/");
      id = parsed.host === "youtu.be" ? paths[1] : paths[2];
    } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
      throw Error("Not a YouTube domain");
    }
    if (!id) {
      throw Error(`No video id found: "${url}"`);
    }
    id = id.substring(0, 11);
    if (!this.validateYtVideoId(id)) {
      throw Error(`Invalid video id: "${id}"`);
    }

    return id;
  };

  validateYtURL = (url: string) => {
    try {
      this.getYtVideoId(url);
      return true;
    } catch (error) {
      logger.warn(error);
      return false;
    }
  };
}

export default new Youtubedr();
