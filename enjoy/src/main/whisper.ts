import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import {
  WHISPER_MODELS_OPTIONS,
  PROCESS_TIMEOUT,
  AI_WORKER_ENDPOINT,
  WEB_API_URL,
} from "@/constants";
import { exec, spawn } from "child_process";
import fs from "fs-extra";
import log from "electron-log/main";
import { t } from "i18next";
import axios from "axios";
import { milisecondsToTimestamp } from "@/utils";
import { AzureSpeechSdk } from "@main/azure-speech-sdk";
import { Client } from "@/api";
import take from "lodash/take";
import sortedUniqBy from "lodash/sortedUniqBy";

const logger = log.scope("whisper");

const MAGIC_TOKENS = ["Mrs.", "Ms.", "Mr.", "Dr.", "Prof.", "St."];
const END_OF_WORD_REGEX = /[^\.!,\?][\.!\?]/g;
class Whipser {
  private binMain: string;
  public config: WhisperConfigType;

  constructor(config?: WhisperConfigType) {
    this.config = config || settings.whisperConfig();
    const customWhisperPath = path.join(
      settings.libraryPath(),
      "whisper",
      "main"
    );
    if (fs.existsSync(customWhisperPath)) {
      this.binMain = customWhisperPath;
    } else {
      this.binMain = path.join(__dirname, "lib", "whisper", "main");
    }
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

    const command = `"${this.binMain}" --help`;
    logger.debug(`Checking whisper command: ${command}`);
    return new Promise((resolve, reject) => {
      exec(
        command,
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
      logger.debug(`Checking whisper command: ${commands.join(" ")}`);
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

  /* Ensure the file is in wav format
   * and 16kHz sample rate
   */
  async transcribe(
    params: {
      file?: string;
      blob?: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    },
    options?: {
      force?: boolean;
      extra?: string[];
      onProgress?: (progress: number) => void;
    }
  ): Promise<Partial<WhisperOutputType>> {
    logger.debug("transcribing from local");

    const { blob } = params;
    let { file } = params;
    if (!file && !blob) {
      throw new Error("No file or blob provided");
    }

    if (!this.currentModel()) {
      throw new Error(t("pleaseDownloadWhisperModelFirst"));
    }

    if (blob) {
      const format = blob.type.split("/")[1];

      if (format !== "wav") {
        throw new Error("Only wav format is supported");
      }

      file = path.join(settings.cachePath(), `${Date.now()}.${format}`);
      await fs.outputFile(file, Buffer.from(blob.arrayBuffer));
    }

    const { force = false, extra = [], onProgress } = options || {};
    const filename = path.basename(file, path.extname(file));
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, filename + ".json");

    logger.info(`Trying to transcribe ${file} to ${outputFile}`);
    if (fs.pathExistsSync(outputFile) && !force) {
      logger.info(`File ${outputFile} already exists`);
      return fs.readJson(outputFile);
    }

    const commandArguments = [
      "--file",
      file,
      "--model",
      this.currentModel(),
      "--output-json",
      "--output-file",
      path.join(tmpDir, filename),
      "-pp",
      "--split-on-word",
      "--max-len",
      "1",
      ...extra,
    ];

    logger.info(
      `Running command: ${this.binMain} ${commandArguments.join(" ")}`
    );

    const command = spawn(this.binMain, commandArguments, {
      timeout: PROCESS_TIMEOUT,
    });

    return new Promise((resolve, reject) => {
      command.stdout.on("data", (data) => {
        logger.debug(`stdout: ${data}`);
      });

      command.stderr.on("data", (data) => {
        const output = data.toString();
        logger.error(`stderr: ${output}`);
        if (output.startsWith("whisper_print_progress_callback")) {
          const progress = parseInt(output.match(/\d+%/)?.[0] || "0");
          if (typeof progress === "number") onProgress(progress);
        }
      });

      command.on("exit", (code) => {
        logger.info(`transcribe process exited with code ${code}`);
      });

      command.on("error", (err) => {
        logger.error("transcribe error", err.message);
        reject(err);
      });

      command.on("close", () => {
        if (fs.pathExistsSync(outputFile)) {
          resolve(fs.readJson(outputFile));
        } else {
          reject(new Error("Transcription failed"));
        }
      });
    });
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
        .then(({ success, log }) => {
          if (success) {
            return Object.assign({}, this.config, { ready: true });
          } else {
            throw new Error(log);
          }
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
      } else if (["cloudflare", "azure", "openai"].includes(service)) {
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

    ipcMain.handle("whisper-transcribe", async (event, params, options) => {
      try {
        return await this.transcribe(params, {
          ...options,
          onProgress: (progress) => {
            event.sender.send("whisper-on-progress", progress);
          },
        });
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
