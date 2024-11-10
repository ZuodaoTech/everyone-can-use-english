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
import path from "path";
import log from "@main/logger";
import url from "url";
import settings from "@main/settings";
import fs from "fs-extra";
import ffmpegPath from "ffmpeg-static";
import { enjoyUrlToPath, pathToEnjoyUrl } from "./utils";
import { UserSetting } from "./db/models";
import { UserSettingKeyEnum } from "@/types/enums";
import { WHISPER_MODELS } from "@/constants";
import { WhisperOptions } from "echogarden/dist/recognition/WhisperSTT.js";

Echogarden.setGlobalOption(
  "ffmpegPath",
  ffmpegPath.replace("app.asar", "app.asar.unpacked")
);
Echogarden.setGlobalOption(
  "packageBaseURL",
  "https://hf-mirror.com/echogarden/echogarden-packages/resolve/main/"
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
    this.recognize = Echogarden.recognize;
    this.align = Echogarden.align;
    this.alignSegments = Echogarden.alignSegments;
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

  async check(
    options: RecognitionOptions = {
      engine: "whisper",
      whisper: {
        model: "tiny.en",
        language: "en",
      } as WhisperOptions,
    }
  ) {
    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    try {
      const config = await UserSetting.get(UserSettingKeyEnum.ECHOGARDEN);
      if (WHISPER_MODELS.includes(config?.whisper?.model)) {
        options.whisper.model = config.whisper.model;
      }
    } catch (e) {
      logger.error(e);
    }

    try {
      logger.info("check:", options);
      const result = await this.recognize(sampleFile, options);
      logger.info(result?.transcript);
      fs.writeJsonSync(
        path.join(settings.cachePath(), "echogarden-check.json"),
        result,
        { spaces: 2 }
      );

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
      "echogarden-recognize",
      async (_event, url: string, options: RecognitionOptions) => {
        logger.debug("echogarden-recognize:", options);
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
      "echogarden-align-segments",
      async (
        _event,
        input: AudioSourceParam,
        timeline: Timeline,
        options: AlignmentOptions
      ) => {
        logger.debug("echogarden-align-segments:", timeline, options);
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
        logger.debug("echogarden-word-to-sentence-timeline:", transcript);

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
        try {
          return await this.transcode(url, sampleRate);
        } catch (err) {
          logger.error(err);
          throw err;
        }
      }
    );

    ipcMain.handle("echogarden-check", async (_event, options: any) => {
      return this.check(options);
    });
  }
}

export default new EchogardenWrapper();
