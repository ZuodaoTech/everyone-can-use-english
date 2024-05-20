import { ipcMain } from "electron";
import * as Echogarden from "echogarden/dist/api/API.js";
import { AlignmentOptions } from "echogarden/dist/api/API";
import { AudioSourceParam } from "echogarden/dist/audio/AudioUtilities";
import {
  encodeRawAudioToWave,
  decodeWaveToRawAudio,
  ensureRawAudio,
  getRawAudioDuration,
  trimAudioStart,
  trimAudioEnd,
} from "echogarden/dist/audio/AudioUtilities.js";
import path from "path";
import log from "@main/logger";
import url from "url";
import settings from "@main/settings";
import fs from "fs-extra";
import ffmpegPath from "ffmpeg-static";
import { enjoyUrlToPath, pathToEnjoyUrl } from "./utils";

Echogarden.setGlobalOption(
  "ffmpegPath",
  ffmpegPath.replace("app.asar", "app.asar.unpacked")
);

const __filename = url.fileURLToPath(import.meta.url);
/*
 * sample files will be in /app.asar.unpacked instead of /app.asar
 */
const __dirname = path
  .dirname(__filename)
  .replace("app.asar", "app.asar.unpacked");

const logger = log.scope("echogarden");
class EchogardenWrapper {
  public align: typeof Echogarden.align;
  public denoise: typeof Echogarden.denoise;
  public encodeRawAudioToWave: typeof encodeRawAudioToWave;
  public decodeWaveToRawAudio: typeof decodeWaveToRawAudio;
  public ensureRawAudio: typeof ensureRawAudio;
  public getRawAudioDuration: typeof getRawAudioDuration;
  public trimAudioStart: typeof trimAudioStart;
  public trimAudioEnd: typeof trimAudioEnd;

  constructor() {
    this.align = Echogarden.align;
    this.denoise = Echogarden.denoise;
    this.encodeRawAudioToWave = encodeRawAudioToWave;
    this.decodeWaveToRawAudio = decodeWaveToRawAudio;
    this.ensureRawAudio = ensureRawAudio;
    this.getRawAudioDuration = getRawAudioDuration;
    this.trimAudioStart = trimAudioStart;
    this.trimAudioEnd = trimAudioEnd;
  }

  async check() {
    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    try {
      const result = await this.align(
        sampleFile,
        "And so my fellow Americans ask not what your country can do for you",
        {}
      );
      logger.info(result);
      fs.writeJsonSync(
        path.join(settings.cachePath(), "echogarden-check.json"),
        result,
        { spaces: 2 }
      );

      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }

  /**
   * Transcodes the audio file at the enjoy:// protocol URL into a WAV format.
   * @param url - The URL of the audio file to transcode.
   * @returns A promise that resolves to the enjoy:// protocal URL of the transcoded WAV file.
   */
  async transcode(url: string, sampleRate = 16000): Promise<string> {
    const filePath = enjoyUrlToPath(url);
    const rawAudio = await this.ensureRawAudio(filePath, sampleRate);
    const audioBuffer = this.encodeRawAudioToWave(rawAudio);

    const outputFilePath = path.join(settings.cachePath(), `${Date.now()}.wav`);
    fs.writeFileSync(outputFilePath, audioBuffer);

    return pathToEnjoyUrl(outputFilePath);
  }

  registerIpcHandlers() {
    ipcMain.handle(
      "echogarden-align",
      async (
        _event,
        input: AudioSourceParam,
        transcript: string,
        options: AlignmentOptions
      ) => {
        logger.debug("echogarden-align:", transcript, options);
        try {
          return await this.align(input, transcript, options);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle(
      "echogarden-transcode",
      async (_event, url: string, sampleRate?: number) => {
        try {
          return await this.transcode(url, sampleRate);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle("echogarden-check", async (_event) => {
      return this.check();
    });
  }
}

export default new EchogardenWrapper();
