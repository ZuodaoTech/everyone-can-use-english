import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import {
  WHISPER_MODELS_OPTIONS,
  PROCESS_TIMEOUT,
  AI_WORKER_ENDPOINT,
} from "@/constants";
import { exec } from "child_process";
import fs from "fs-extra";
import log from "electron-log/main";
import { t } from "i18next";
import axios from "axios";
import { milisecondsToTimestamp } from "@/utils";
import { AzureSpeechSdk } from "@main/azure-speech-sdk";
import { Client } from "@/api";
import { WEB_API_URL } from "@/constants";
import { sortedUniqBy, take } from "lodash";

const logger = log.scope("whisper");

const webApi = new Client({
  baseUrl: process.env.WEB_API_URL || WEB_API_URL,
  accessToken: settings.getSync("user.accessToken") as string,
  logger: log.scope("api/client"),
});

const MAGIC_TOKENS = ["Mrs.", "Ms.", "Mr.", "Dr.", "Prof.", "St."];
const END_OF_WORD_REGEX = /[^\.!,\?][\.!\?]/g;
class Whipser {
  private binMain = path.join(__dirname, "lib", "whisper", "main");
  public config: WhisperConfigType;

  constructor(config?: WhisperConfigType) {
    this.config = config || settings.whisperConfig();
  }

  currentModel() {
    if (!this.config.availableModels) return;
    if (!this.config.model) {
      const model = this.config.availableModels[0];
      settings.setSync("whisper.model", this.config.availableModels[0].name);
      return model.savePath;
    }

    return (this.config.availableModels || []).find(
      (m) => m.name === this.config.model
    )?.savePath;
  }

  async initialize() {
    const dir = path.join(settings.libraryPath(), "whisper", "models");
    fs.ensureDirSync(dir);
    const files = fs.readdirSync(dir);
    const models = [];
    for (const file of files) {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name == file);
      if (!model) continue;

      models.push({
        ...model,
        savePath: path.join(dir, file),
      });
    }
    settings.setSync("whisper.availableModels", models);
    settings.setSync("whisper.modelsPath", dir);
    this.config = settings.whisperConfig();

    return new Promise((resolve, reject) => {
      exec(
        `"${this.binMain}" --help`,
        {
          timeout: PROCESS_TIMEOUT,
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("error", error);
          }

          if (stderr) {
            logger.debug("stderr", stderr);
          }

          if (stdout) {
            logger.debug("stdout", stdout);
          }

          const std = (stdout || stderr).toString()?.trim();
          if (std.startsWith("usage:")) {
            resolve(true);
          } else {
            reject(
              error || new Error("Whisper check failed: unknown error").message
            );
          }
        }
      );
    });
  }

  async check() {
    await this.initialize();

    if (!this.currentModel()) {
      throw new Error("No model selected");
    }

    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, "jfk.json");
    fs.rmSync(outputFile, { force: true });
    return new Promise((resolve, _reject) => {
      const commands = [
        `"${this.binMain}"`,
        `--file "${sampleFile}"`,
        `--model "${this.currentModel()}"`,
        "--output-json",
        `--output-file "${path.join(tmpDir, "jfk")}"`,
      ];
      logger.debug(`Running command: ${commands.join(" ")}`);
      exec(
        commands.join(" "),
        {
          timeout: PROCESS_TIMEOUT,
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

          resolve({
            success: fs.existsSync(outputFile),
            log: `${error?.message || ""}\n${stderr}\n${stdout}`,
          });
        }
      );
    });
  }

  async transcribeBlob(
    blob: { type: string; arrayBuffer: ArrayBuffer },
    options?: {
      prompt?: string;
      group?: boolean;
    }
  ): Promise<
    TranscriptionResultSegmentType[] | TranscriptionResultSegmentGroupType[]
  > {
    const { prompt, group = false } = options || {};

    const format = blob.type.split("/")[1];

    if (format !== "wav") {
      throw new Error("Only wav format is supported");
    }

    const tempfile = path.join(settings.cachePath(), `${Date.now()}.${format}`);
    await fs.outputFile(tempfile, Buffer.from(blob.arrayBuffer));

    const extra = [];
    if (prompt) {
      extra.push(`--prompt "${prompt.replace(/"/g, '\\"')}"`);
    }
    const { transcription } = await this.transcribe(tempfile, {
      force: true,
      extra,
    });

    if (group) {
      return this.groupTranscription(transcription);
    } else {
      return transcription;
    }
  }

  async transcribe(
    file: string,
    options?: {
      force?: boolean;
      extra?: string[];
    }
  ): Promise<Partial<WhisperOutputType>> {
    if (this.config.service === "local") {
      return this.transcribeFromLocal(file, options);
    } else if (this.config.service === "azure") {
      return this.transcribeFromAzure(file);
    } else if (this.config.service === "cloudflare") {
      return this.transcribeFromCloudflare(file);
    } else {
      throw new Error("Unknown service");
    }
  }

  async transcribeFromAzure(file: string): Promise<Partial<WhisperOutputType>> {
    const { token, region } = await webApi.generateSpeechToken();
    const sdk = new AzureSpeechSdk(token, region);

    const results = await sdk.transcribe({
      filePath: file,
    });

    const transcription: TranscriptionResultSegmentType[] = [];
    results.forEach((result) => {
      logger.debug(result);
      const best = take(sortedUniqBy(result.NBest, "Confidence"), 1)[0];
      const words = best.Display.trim().split(" ");

      best.Words.map((word, index) => {
        let text = word.Word;
        if (words.length === best.Words.length) {
          text = words[index];
        }

        if (
          index === best.Words.length - 1 &&
          !text.trim().match(END_OF_WORD_REGEX)
        ) {
          text = text + ".";
        }

        transcription.push({
          offsets: {
            from: word.Offset / 1e4,
            to: (word.Offset + word.Duration) / 1e4,
          },
          timestamps: {
            from: milisecondsToTimestamp(word.Offset / 1e4),
            to: milisecondsToTimestamp((word.Offset + word.Duration) * 1e4),
          },
          text,
        });
      });
    });

    return {
      engine: "azure",
      model: {
        type: "Azure AI Speech",
      },
      transcription,
    };
  }

  async transcribeFromCloudflare(
    file: string
  ): Promise<Partial<WhisperOutputType>> {
    logger.debug("transcribing from CloudFlare");

    const data = fs.readFileSync(file);
    const res: CfWhipserOutputType = (
      await axios.postForm(`${AI_WORKER_ENDPOINT}/audio/transcriptions`, data)
    ).data;
    logger.debug("transcription from Web,", res);

    const transcription: TranscriptionResultSegmentType[] = res.words.map(
      (word) => {
        return {
          offsets: {
            from: word.start * 1000,
            to: word.end * 1000,
          },
          timestamps: {
            from: milisecondsToTimestamp(word.start * 1000),
            to: milisecondsToTimestamp(word.end * 1000),
          },
          text: word.word,
        };
      }
    );
    logger.debug("converted transcription,", transcription);

    return {
      engine: "cloudflare",
      model: {
        type: "@cf/openai/whisper",
      },
      transcription,
    };
  }

  /* Ensure the file is in wav format
   * and 16kHz sample rate
   */
  async transcribeFromLocal(
    file: string,
    options?: {
      force?: boolean;
      extra?: string[];
    }
  ): Promise<Partial<WhisperOutputType>> {
    logger.debug("transcribing from local");
    const { force = false, extra = [] } = options || {};
    const filename = path.basename(file, path.extname(file));
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, filename + ".json");

    logger.info(`Trying to transcribe ${file} to ${outputFile}`);
    if (fs.pathExistsSync(outputFile) && !force) {
      logger.info(`File ${outputFile} already exists`);
      return fs.readJson(outputFile);
    }

    if (!this.currentModel()) {
      throw new Error(t("pleaseDownloadWhisperModelFirst"));
    }

    const command = [
      `"${this.binMain}"`,
      `--file "${file}"`,
      `--model "${this.currentModel()}"`,
      "--output-json",
      `--output-file "${path.join(tmpDir, filename)}"`,
      ...extra,
    ].join(" ");

    logger.info(`Running command: ${command}`);
    return new Promise((resolve, reject) => {
      exec(
        command,
        {
          timeout: PROCESS_TIMEOUT,
        },
        (error, stdout, stderr) => {
          if (fs.pathExistsSync(outputFile)) {
            resolve(fs.readJson(outputFile));
          }

          if (error) {
            logger.error("error", error);
          }

          if (stderr) {
            logger.error("stderr", stderr);
          }

          if (stdout) {
            logger.debug(stdout);
          }

          reject(
            error ||
              new Error(stderr || "Whisper transcribe failed: unknown error")
          );
        }
      );
    });
  }

  groupTranscription(
    transcription: TranscriptionResultSegmentType[]
  ): TranscriptionResultSegmentGroupType[] {
    const generateGroup = (group?: TranscriptionResultSegmentType[]) => {
      if (!group || group.length === 0) return;

      const firstWord = group[0];
      const lastWord = group[group.length - 1];

      return {
        offsets: {
          from: firstWord.offsets.from,
          to: lastWord.offsets.to,
        },
        text: group.map((w) => w.text.trim()).join(" "),
        timestamps: {
          from: firstWord.timestamps.from,
          to: lastWord.timestamps.to,
        },
        segments: group,
      };
    };

    const groups: TranscriptionResultSegmentGroupType[] = [];
    let group: TranscriptionResultSegmentType[] = [];

    transcription.forEach((segment) => {
      const text = segment.text.trim();
      if (!text) return;

      group.push(segment);

      if (
        !MAGIC_TOKENS.includes(text) &&
        segment.text.trim().match(END_OF_WORD_REGEX)
      ) {
        // Group a complete sentence;
        groups.push(generateGroup(group));

        // init a new group
        group = [];
      }
    });

    // Group the last group
    const lastSentence = generateGroup(group);
    if (lastSentence) groups.push(lastSentence);

    return groups;
  }

  registerIpcHandlers() {
    ipcMain.handle("whisper-config", async () => {
      try {
        await this.initialize();
        return Object.assign({}, this.config, { ready: true });
      } catch (_err) {
        return Object.assign({}, this.config, { ready: false });
      }
    });

    ipcMain.handle("whisper-set-model", async (event, model) => {
      const originalModel = settings.getSync("whisper.model");
      settings.setSync("whisper.model", model);
      this.config = settings.whisperConfig();

      return this.check()
        .then(() => {
          return Object.assign({}, this.config, { ready: true });
        })
        .catch((err) => {
          settings.setSync("whisper.model", originalModel);
          event.sender.send("on-notification", {
            type: "error",
            message: err.message,
          });
        });
    });

    ipcMain.handle("whisper-set-service", async (event, service) => {
      if (service === "local") {
        try {
          await this.initialize();
          settings.setSync("whisper.service", service);
          this.config.service = service;
          return this.config;
        } catch (err) {
          event.sender.send("on-notification", {
            type: "error",
            message: err.message,
          });
        }
      } else if (["cloudflare", "azure"].includes(service)) {
        settings.setSync("whisper.service", service);
        this.config.service = service;
        return this.config;
      } else {
        event.sender.send("on-notification", {
          type: "error",
          message: "Unknown service",
        });
      }
    });

    ipcMain.handle("whisper-check", async (_event) => {
      return await this.check();
    });

    ipcMain.handle("whisper-transcribe-blob", async (event, blob, prompt) => {
      try {
        return await this.transcribeBlob(blob, prompt);
      } catch (err) {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      }
    });
  }
}

export default new Whipser();
