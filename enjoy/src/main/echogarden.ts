import { ipcMain } from "electron";
import * as Echogarden from "echogarden/dist/api/API.js";
import { AlignmentOptions, RecognitionOptions } from "echogarden/dist/api/API";
import {
  encodeRawAudioToWave,
  decodeWaveToRawAudio,
  ensureRawAudio,
  getRawAudioDuration,
  trimAudioStart,
  trimAudioEnd,
  AudioSourceParam,
} from "echogarden/dist/audio/AudioUtilities.js";
import { wordTimelineToSegmentSentenceTimeline } from "echogarden/dist/utilities/Timeline.js";
import {
  type Timeline,
  type TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { ensureAndGetPackagesDir } from "echogarden/dist/utilities/PackageManager.js";
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
Echogarden.setGlobalOption(
  "packageBaseURL",
  "https://hf-mirror.com/echogarden/echogarden-packages/resolve/main/"
);

/*
 * sample files will be in /app.asar.unpacked instead of /app.asar
 */
const __dirname = import.meta.dirname.replace("app.asar", "app.asar.unpacked");

const logger = log.scope("echogarden");
class EchogardenWrapper {
  public recognize: typeof Echogarden.recognize;
  public align: typeof Echogarden.align;
  public alignSegments: typeof Echogarden.alignSegments;
  public denoise: typeof Echogarden.denoise;
  public encodeRawAudioToWave: typeof encodeRawAudioToWave;
  public decodeWaveToRawAudio: typeof decodeWaveToRawAudio;
  public ensureRawAudio: typeof ensureRawAudio;
  public getRawAudioDuration: typeof getRawAudioDuration;
  public trimAudioStart: typeof trimAudioStart;
  public trimAudioEnd: typeof trimAudioEnd;
  public wordTimelineToSegmentSentenceTimeline: typeof wordTimelineToSegmentSentenceTimeline;

  constructor() {
    this.recognize = (sampleFile: string, options: RecognitionOptions) => {
      if (!options) {
        throw new Error("No config options provided");
      }
      return new Promise((resolve, reject) => {
        const handler = (reason: any) => {
          // Remove the handler after it's triggered
          process.removeListener("unhandledRejection", handler);
          reject(reason);
        };

        // Add temporary unhandledRejection listener
        process.on("unhandledRejection", handler);

        // Set the whisper executable path for macOS
        if (process.platform === "darwin") {
          options.whisperCpp = options.whisperCpp || {};
          options.whisperCpp.executablePath = path.join(
            __dirname,
            "lib",
            "whisper",
            "main"
          );
        }

        // Call the original recognize function
        Echogarden.recognize(sampleFile, options)
          .then((result) => {
            // Remove the handler if successful
            process.removeListener("unhandledRejection", handler);
            resolve(result);
          })
          .catch(reject);
      });
    };
    this.align = (input, transcript, options) => {
      if (!options) {
        throw new Error("No config options provided");
      }
      return new Promise((resolve, reject) => {
        const handler = (reason: any) => {
          // Remove the handler after it's triggered
          process.removeListener("unhandledRejection", handler);
          reject(reason);
        };

        // Add temporary unhandledRejection listener
        process.on("unhandledRejection", handler);

        Echogarden.align(input, transcript, options)
          .then((result) => {
            // Remove the handler if successful
            process.removeListener("unhandledRejection", handler);
            resolve(result);
          })
          .catch(reject);
      });
    };
    this.alignSegments = (input, timeline, options) => {
      if (!options) {
        throw new Error("No config options provided");
      }
      return new Promise((resolve, reject) => {
        const handler = (reason: any) => {
          // Remove the handler after it's triggered
          process.removeListener("unhandledRejection", handler);
          reject(reason);
        };

        // Add temporary unhandledRejection listener
        process.on("unhandledRejection", handler);

        Echogarden.alignSegments(input, timeline, options)
          .then((result) => {
            // Remove the handler if successful
            process.removeListener("unhandledRejection", handler);
            resolve(result);
          })
          .catch(reject);
      });
    };
    this.denoise = Echogarden.denoise;
    this.encodeRawAudioToWave = encodeRawAudioToWave;
    this.decodeWaveToRawAudio = decodeWaveToRawAudio;
    this.ensureRawAudio = ensureRawAudio;
    this.getRawAudioDuration = getRawAudioDuration;
    this.trimAudioStart = trimAudioStart;
    this.trimAudioEnd = trimAudioEnd;
    this.wordTimelineToSegmentSentenceTimeline =
      wordTimelineToSegmentSentenceTimeline;
  }

  async check(options: RecognitionOptions) {
    options = options || {
      engine: "whisper",
      whisper: {
        model: "tiny.en",
      },
      whisperCpp: {
        model: "tiny.en",
      },
    };
    const sampleFile = path.join(__dirname, "samples", "jfk.wav");

    try {
      logger.info("echogarden-check:", options);
      const result = await this.recognize(sampleFile, options);
      logger.info("transcript:", result?.transcript);
      fs.writeJsonSync(
        path.join(settings.cachePath(), "echogarden-check.json"),
        result,
        { spaces: 2 }
      );

      const timeline = await this.align(sampleFile, result.transcript, {
        language: "en",
      });
      logger.info("timeline:", !!timeline);

      return { success: true, log: "" };
    } catch (e) {
      logger.error(e);
      return { success: false, log: e.message };
    }
  }

  async checkAlign(options: AlignmentOptions) {
    options = options || {
      language: "en",
    };
    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    const transcript =
      "And so my fellow Americans ask not what your country can do for you ask what you can do for your country.";
    try {
      const timeline = await this.align(sampleFile, transcript, options);
      logger.info("timeline:", !!timeline);
      return { success: true, log: "" };
    } catch (e) {
      logger.error(e);
      return { success: false, log: e.message };
    }
  }

  /**
   * Transcodes the audio file at the enjoy:// protocol URL into a WAV format.
   * @param url - The URL of the audio file to transcode.
   * @returns A promise that resolves to the enjoy:// protocal URL of the transcoded WAV file.
   */
  async transcode(
    url: string,
    sampleRate: number | null = 16000
  ): Promise<string> {
    sampleRate = sampleRate || 16000;
    logger.info("echogarden-transcode:", url, sampleRate);
    const filePath = enjoyUrlToPath(url);
    const rawAudio = await this.ensureRawAudio(filePath, sampleRate);
    const audioBuffer = this.encodeRawAudioToWave(rawAudio);

    const outputFilePath = path.join(settings.cachePath(), `${Date.now()}.wav`);
    fs.writeFileSync(outputFilePath, audioBuffer);

    return pathToEnjoyUrl(outputFilePath);
  }

  registerIpcHandlers() {
    ipcMain.handle(
      "echogarden-recognize",
      async (_event, url: string, options: RecognitionOptions) => {
        logger.info("echogarden-recognize:", options);
        try {
          const input = enjoyUrlToPath(url);
          return await this.recognize(input, options);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle(
      "echogarden-align",
      async (
        _event,
        input: AudioSourceParam,
        transcript: string,
        options: AlignmentOptions
      ) => {
        logger.info("echogarden-align:", options);
        try {
          return await this.align(input, transcript, options);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle(
      "echogarden-align-segments",
      async (
        _event,
        input: AudioSourceParam,
        timeline: Timeline,
        options: AlignmentOptions
      ) => {
        logger.info("echogarden-align-segments:", options);
        if (typeof input === "string") {
          input = enjoyUrlToPath(input);
        }
        try {
          const rawAudio = await this.ensureRawAudio(input, 16000);
          return await this.alignSegments(rawAudio, timeline, options);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle(
      "echogarden-word-to-sentence-timeline",
      async (
        _event,
        wordTimeline: Timeline,
        transcript: string,
        language: string
      ) => {
        logger.info("echogarden-word-to-sentence-timeline:", language);

        const { segmentTimeline } =
          await this.wordTimelineToSegmentSentenceTimeline(
            wordTimeline,
            transcript,
            language.split("-")[0]
          );
        const timeline: Timeline = [];
        segmentTimeline.forEach((t: TimelineEntry) => {
          if (t.type === "sentence") {
            timeline.push(t);
          } else {
            t.timeline.forEach((st) => {
              timeline.push(st);
            });
          }
        });

        return timeline;
      }
    );

    ipcMain.handle(
      "echogarden-transcode",
      async (_event, url: string, sampleRate?: number) => {
        logger.info("echogarden-transcode:", url, sampleRate);
        try {
          return await this.transcode(url, sampleRate);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle("echogarden-check", async (_event, options: any) => {
      logger.info("echogarden-check:", options);
      return this.check(options);
    });

    ipcMain.handle("echogarden-check-align", async (_event, options: any) => {
      logger.info("echogarden-check-align:", options);
      return this.checkAlign(options);
    });

    ipcMain.handle("echogarden-get-packages-dir", async (_event) => {
      return ensureAndGetPackagesDir();
    });
  }
}

export default new EchogardenWrapper();
