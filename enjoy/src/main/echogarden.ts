import { ipcMain } from "electron";
import * as Echogarden from "echogarden/dist/api/API.js";
import { AlignmentOptions } from "echogarden/dist/api/API";
import { AudioSourceParam } from "echogarden/dist/audio/AudioUtilities";
import {
  encodeWaveBuffer,
  decodeWaveBuffer,
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
import { enjoyUrlToPath, hashFile, pathToEnjoyUrl } from "./utils";
import { extractFrequencies } from "@/utils";
import waveform from "./waveform";

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
  public encodeWaveBuffer: typeof encodeWaveBuffer;
  public decodeWaveBuffer: typeof decodeWaveBuffer;
  public ensureRawAudio: typeof ensureRawAudio;
  public getRawAudioDuration: typeof getRawAudioDuration;
  public trimAudioStart: typeof trimAudioStart;
  public trimAudioEnd: typeof trimAudioEnd;

  constructor() {
    this.align = Echogarden.align;
    this.denoise = Echogarden.denoise;
    this.encodeWaveBuffer = encodeWaveBuffer;
    this.decodeWaveBuffer = decodeWaveBuffer;
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
    const fileHash = await hashFile(filePath, { algo: 'md5' });

    const rawAudio = await this.ensureRawAudio(filePath, sampleRate);

    const peaks = rawAudio.audioChannels[0];
    const frequencies = extractFrequencies({ peaks, sampleRate });
    const duration = this.getRawAudioDuration(rawAudio);

    waveform.save(fileHash, { peaks: Array.from(peaks), duration, frequencies, sampleRate});

    const audioBuffer = this.encodeWaveBuffer(rawAudio);

    const outputFilePath = path.join(settings.cachePath(), `${Date.now()}.wav`);
    fs.writeFileSync(outputFilePath, audioBuffer);

    return pathToEnjoyUrl(outputFilePath);
  }

  /**
   * Decodes the audio file at the enjoy:// protocol URL into a waveform data object.
   * @param url 
   * @param sampleRate 
   * @returns WaveFormDataType
   */
  async decode(url: string, sampleRate = 16000): Promise<WaveFormDataType> {
    const filePath = enjoyUrlToPath(url);
    const fileHash = await hashFile(filePath, { algo: 'md5' });

    const rawAudio = await this.ensureRawAudio(filePath, sampleRate);
    const peaks = rawAudio.audioChannels[0];
    const frequencies = extractFrequencies({ peaks, sampleRate });
    const duration = this.getRawAudioDuration(rawAudio);

    const data = { peaks: Array.from(peaks), duration, frequencies, sampleRate};
    waveform.save(fileHash, data);

    return data;
  }

  registerIpcHandlers() {
    ipcMain.handle(
      "echogarden-align",
      async (
        event,
        input: AudioSourceParam,
        transcript: string,
        options: AlignmentOptions
      ) => {
        try {
          return await this.align(input, transcript, options);
        } catch (err) {
          logger.error(err);
          event.sender.send("on-notification", {
            type: "error",
            message: err.message,
          });
        }
      }
    );

    ipcMain.handle("echogarden-transcode", async (event, url: string, sampleRate?: number) => {
      try {
        return await this.transcode(url, sampleRate);
      } catch (err) {
        logger.error(err);
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      }
    });

    ipcMain.handle("echogarden-decode", async (event, url: string, sampleRate?: number) => {
      try {
        return await this.decode(url, sampleRate);
      } catch (err) {
        logger.error(err);
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      }
    });

    ipcMain.handle("echogarden-check", async (_event) => {
      return this.check();
    });
  }
}

export default new EchogardenWrapper();
