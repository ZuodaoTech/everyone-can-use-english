import { ipcMain } from "electron";
import Ffmpeg from "fluent-ffmpeg";
import settings from "@main/settings";
import log from "electron-log/main";
import path from "path";
import fs from "fs-extra";
import AdmZip from "adm-zip";
import downloader from "@main/downloader";
import storage from "@main/storage";

const logger = log.scope("ffmepg");
export default class FfmpegWrapper {
  public ffmpeg: Ffmpeg.FfmpegCommand;

  constructor() {
    const config = settings.ffmpegConfig();

    if (config.commandExists) {
      logger.info("Using system ffmpeg");
      this.ffmpeg = Ffmpeg();
    } else {
      logger.info("Using downloaded ffmpeg");
      const ff = Ffmpeg();
      ff.setFfmpegPath(config.ffmpegPath);
      ff.setFfprobePath(config.ffprobePath);
      this.ffmpeg = ff;
    }
  }

  generateMetadata(input: string): Promise<Ffmpeg.FfprobeData> {
    return new Promise((resolve, reject) => {
      this.ffmpeg
        .input(input)
        .on("start", (commandLine) => {
          logger.info("Spawned FFmpeg with command: " + commandLine);
        })
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        })
        .ffprobe((err, metadata) => {
          if (err) {
            logger.error(err);
            reject(err);
          }

          resolve(metadata);
        });
    });
  }

  generateCover(input: string, output: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ffmpeg
        .input(input)
        .thumbnail({
          count: 1,
          filename: path.basename(output),
          folder: path.dirname(output),
        })
        .on("start", (commandLine) => {
          logger.info("Spawned FFmpeg with command: " + commandLine);
          fs.ensureDirSync(path.dirname(output));
        })
        .on("end", () => {
          logger.info(`File ${output} created`);
          resolve(output);
        })
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        });
    });
  }

  ensureSampleRate(
    input: string,
    output: string,
    sampleRate = 16000
  ): Promise<string> {
    logger.info(`Trying to convert ${input} to 16-bit file ${output}`);
    if (fs.pathExistsSync(output)) {
      logger.warn(`File ${output} already exists, deleting.`);
      fs.removeSync(output);
    }

    return new Promise((resolve, reject) => {
      this.ffmpeg
        .input(input)
        .outputOptions("-ar", `${sampleRate}`)
        .on("error", (err) => {
          logger.error(err);
          reject(err);
        })
        .on("end", () => {
          logger.info(`File ${output} created`);
          resolve(output);
        })
        .save(output);
    });
  }

  convertToWav(
    input: string,
    output: string,
    options: string[] = []
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ffmpeg
        .input(input)
        .outputOptions(
          "-ar",
          "16000",
          "-ac",
          "1",
          "-c:a",
          "pcm_s16le",
          ...options
        )
        .on("start", (commandLine) => {
          logger.info("Spawned FFmpeg with command: " + commandLine);
          fs.ensureDirSync(path.dirname(output));
        })
        .on("end", (_stdout, stderr) => {
          if (stderr) {
            logger.error(stderr);
          }
          resolve(output);
        })
        .on("error", (err: Error) => {
          logger.error(err);
          reject(err);
        })
        .save(output);
    });
  }

  async prepareForWhisper(input: string, output: string): Promise<string> {
    const metadata = await this.generateMetadata(input);

    if (metadata.format.format_name === "wav") {
      if (metadata.streams[0].sample_rate === 16000) {
        logger.info(`File ${input} already in 16-bit WAVE format`);
        return input;
      } else {
        return this.ensureSampleRate(
          input,
          input.replace(path.extname(input), "_16bit.wav")
        );
      }
    }

    logger.info(
      `[WHISPER] Trying to convert ${input} to 16-bit WAVE file ${output}`
    );
    if (fs.pathExistsSync(output)) {
      logger.warn(`[WHISPER] File ${output} already exists, deleting.`);
      fs.removeSync(output);
    }

    return this.convertToWav(input, output);
  }
}

export class FfmpegDownloader {
  public async download(webContents?: Electron.WebContents) {
    if (process.platform === "win32") {
      return await this.downloadForWin32(webContents);
    } else if (process.platform === "darwin") {
      return await this.downloadForDarwin(webContents);
    } else {
      throw new Error(
        `You are using ${process.platform}, please install ffmpeg manually`
      );
    }
  }

  async downloadForDarwinArm64(webContents?: Electron.WebContents) {
    const DARWIN_FFMPEG_ARM64_URL = storage.getUrl(
      "ffmpeg-apple-arm64-build-6.0.zip"
    );

    fs.ensureDirSync(path.join(settings.libraryPath(), "ffmpeg"));

    const ffmpegZipPath = await downloader.download(DARWIN_FFMPEG_ARM64_URL, {
      webContents,
    });
    const ffmepgZip = new AdmZip(ffmpegZipPath);

    ffmepgZip.extractEntryTo(
      "ffmpeg/ffmpeg",
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );

    ffmepgZip.extractEntryTo(
      "ffmpeg/ffprobe",
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );

    fs.chmodSync(path.join(settings.libraryPath(), "ffmpeg", "ffmpeg"), 0o775);
    fs.chmodSync(path.join(settings.libraryPath(), "ffmpeg", "ffprobe"), 0o775);
  }

  async downloadForDarwin(webContents?: Electron.WebContents) {
    if (process.arch === "arm64") {
      return this.downloadForDarwinArm64(webContents);
    }

    const DARWIN_FFMPEG_URL = "https://evermeet.cx/ffmpeg/getrelease/zip";
    const DARWIN_FFPROBE_URL =
      "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip";

    fs.ensureDirSync(path.join(settings.libraryPath(), "ffmpeg"));

    const ffmpegZipPath = await downloader.download(DARWIN_FFMPEG_URL, {
      webContents,
    });
    const ffmepgZip = new AdmZip(ffmpegZipPath);
    ffmepgZip.extractEntryTo(
      "ffmpeg",
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );

    fs.chmodSync(path.join(settings.libraryPath(), "ffmpeg", "ffmpeg"), 0o775);

    const ffprobeZipPath = await downloader.download(DARWIN_FFPROBE_URL, {
      webContents,
    });
    const ffprobeZip = new AdmZip(ffprobeZipPath);
    ffprobeZip.extractEntryTo(
      "ffprobe",
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );
    fs.chmodSync(path.join(settings.libraryPath(), "ffmpeg", "ffprobe"), 0o775);

    return settings.ffmpegConfig();
  }

  async downloadForWin32(webContents?: Electron.WebContents) {
    const WINDOWS_DOWNLOAD_URL =
      "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";

    const zipPath = await downloader.download(WINDOWS_DOWNLOAD_URL, {
      webContents,
    });
    fs.ensureDirSync(path.join(settings.libraryPath(), "ffmpeg"));
    const zip = new AdmZip(zipPath);

    zip.extractEntryTo(
      `${path.basename(zipPath, ".zip")}/bin/ffmpeg.exe`,
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );

    zip.extractEntryTo(
      `${path.basename(zipPath, ".zip")}/bin/ffprobe.exe`,
      path.join(settings.libraryPath(), "ffmpeg"),
      false,
      true
    );

    return settings.ffmpegConfig();
  }

  unzip(zipPath: string) {
    if (!fs.existsSync(zipPath)) {
      throw new Error(`File ${zipPath} does not exist`);
    }

    const dir = path.dirname(zipPath);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(dir, true);

    const unzipPath = zipPath.replace(".zip", "");
    return unzipPath;
  }

  registerIpcHandlers() {
    ipcMain.handle("ffmpeg-download", async (event) => {
      try {
        return await this.download(event.sender);
      } catch (err) {
        logger.error(err);
        event.sender.send("on-notification", {
          type: "error",
          title: `FFmpeg download failed: ${err.message}`,
        });
      }
    });
  }
}
