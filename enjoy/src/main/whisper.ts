import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import { WHISPER_MODELS_OPTIONS, PROCESS_TIMEOUT } from "@/constants";
import { exec, spawn } from "child_process";
import fs from "fs-extra";
import log from "@main/logger";
import url from "url";
import { enjoyUrlToPath } from "./utils";
import { t } from "i18next";
import { UserSetting } from "@main/db/models";
import db from "@main/db";
import { UserSettingKeyEnum } from "@/types/enums";

const __filename = url.fileURLToPath(import.meta.url);
/*
 * whipser bin file will be in /app.asar.unpacked instead of /app.asar
 */
const __dirname = path
  .dirname(__filename)
  .replace("app.asar", "app.asar.unpacked");

const logger = log.scope("whisper");

class Whipser {
  private binMain: string;
  private bundledModelsDir: string;
  public config: WhisperConfigType;
  private abortController: AbortController;

  constructor() {
    const customWhisperPath = path.join(
      settings.libraryPath(),
      "whisper",
      "main"
    );
    this.bundledModelsDir = path.join(__dirname, "lib", "whisper", "models");
    if (fs.existsSync(customWhisperPath)) {
      this.binMain = customWhisperPath;
    } else {
      this.binMain = path.join(__dirname, "lib", "whisper", "main");
    }
    this.initialize();
  }

  async initialize() {
    const models = [];

    const bundledModels = fs.readdirSync(this.bundledModelsDir);
    for (const file of bundledModels) {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name == file);
      if (!model) continue;

      models.push({
        ...model,
        savePath: path.join(this.bundledModelsDir, file),
      });
    }

    const dir = path.join(settings.libraryPath(), "whisper", "models");
    fs.ensureDirSync(dir);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name == file);
      if (!model) continue;

      models.push({
        ...model,
        savePath: path.join(dir, file),
      });
    }

    if (db.connection) {
      const whisperConfig = (await UserSetting.get(
        UserSettingKeyEnum.WHISPER
      )) as string;
      this.config = {
        model: whisperConfig || models[0].name,
        availableModels: models,
        modelsPath: dir,
      };
    } else {
      this.config = {
        model: models[0].name,
        availableModels: models,
        modelsPath: dir,
      };
    }
  }

  currentModel() {
    if (!this.config.availableModels) return;

    let model: WhisperConfigType["availableModels"][0];
    if (this.config.model) {
      model = (this.config.availableModels || []).find(
        (m) => m.name === this.config.model
      );
    }
    if (!model) {
      model = this.config.availableModels[0];
      this.config = Object.assign({}, this.config, { model: model.name });
      UserSetting.set(UserSettingKeyEnum.WHISPER, model.name);
    }

    return model;
  }

  async check() {
    this.abortController?.abort();
    this.abortController = new AbortController();

    const model = this.currentModel();
    logger.debug(`Checking whisper model: ${model.savePath}`);

    const sampleFile = path.join(__dirname, "samples", "jfk.wav");
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, "jfk.json");
    fs.rmSync(outputFile, { force: true });
    return new Promise((resolve, _reject) => {
      const commands = [
        `"${this.binMain}"`,
        `--file "${sampleFile}"`,
        `--model "${model.savePath}"`,
        "--output-json",
        `--output-file "${path.join(tmpDir, "jfk")}"`,
      ];
      logger.debug(`Checking whisper command: ${commands.join(" ")}`);
      exec(
        commands.join(" "),
        {
          timeout: PROCESS_TIMEOUT,
          signal: this.abortController.signal,
        },
        (error, stdout, stderr) => {
          if (error) {
            logger.error("error", error);
          }

          if (stderr) {
            logger.info("stderr", stderr);
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
      language?: string;
      force?: boolean;
      extra?: string[];
      onProgress?: (progress: number) => void;
    }
  ): Promise<Partial<WhisperOutputType>> {
    logger.debug("transcribing from local");

    this.abortController?.abort();
    this.abortController = new AbortController();

    const { blob } = params;
    let { file } = params;

    if (file) {
      file = enjoyUrlToPath(file);
    } else if (blob) {
      const format = blob.type.split("/")[1];
      if (format !== "wav") {
        throw new Error("Only wav format is supported");
      }

      file = path.join(settings.cachePath(), `${Date.now()}.${format}`);
      await fs.outputFile(file, Buffer.from(blob.arrayBuffer));
    } else {
      throw new Error("No file or blob provided");
    }

    const { force = false, extra = [], language, onProgress } = options || {};

    const model = this.currentModel();
    if (language && !language.startsWith("en") && model.name.includes("en")) {
      throw new Error(`Model ${model.name} does not support ${language}`);
    }

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
      model.savePath,
      "--output-json",
      "--output-file",
      path.join(tmpDir, filename),
      "--print-progress",
      "--language",
      model.name.includes("en") ? "en" : language?.split("-")?.[0] || "auto",
      // `--split-on-word`,
      // `--max-len`,
      // "1",
      ...extra,
    ];

    logger.info(
      `Running command: ${this.binMain} ${commandArguments.join(" ")}`
    );

    const command = spawn(this.binMain, commandArguments, {
      timeout: PROCESS_TIMEOUT,
      signal: this.abortController.signal,
    });

    return new Promise((resolve, reject) => {
      command.stdout.on("data", (data) => {
        logger.debug(`stdout: ${data}`);
      });

      command.stderr.on("data", (data) => {
        const output = data.toString();
        logger.info(`stderr: ${output}`);
        if (output.startsWith("whisper_print_progress_callback")) {
          const progress = parseInt(output.match(/\d+%/)?.[0] || "0");
          if (typeof progress === "number" && onProgress) onProgress(progress);
        }
      });

      command.on("exit", (code) => {
        logger.info(`transcribe process exited with code ${code}`);
      });

      command.on("error", (err) => {
        logger.error("transcribe error", err.message);
        reject(err);
      });

      command.on("close", (code) => {
        if (code === 0 && fs.pathExistsSync(outputFile)) {
          resolve(fs.readJson(outputFile));
        } else {
          reject(new Error("Transcription failed"));
        }
      });
    });
  }

  abort() {
    this.abortController?.abort();
  }

  registerIpcHandlers() {
    ipcMain.handle("whisper-config", async () => {
      await this.initialize();
      return this.config;
    });

    ipcMain.handle("whisper-set-model", async (_event, model) => {
      const originalModel = this.config.model;
      this.config.model = model;

      return this.check()
        .then(({ success, log }) => {
          if (success) {
            return Object.assign({}, this.config, { ready: true });
          } else {
            throw new Error(log);
          }
        })
        .catch((err) => {
          this.config.model = originalModel;
          throw err;
        })
        .finally(() => {
          UserSetting.set(UserSettingKeyEnum.WHISPER, this.config.model);
        });
    });

    ipcMain.handle("whisper-check", async (_event) => {
      return await this.check();
    });

    ipcMain.handle("whisper-transcribe", async (event, params, options) => {
      return this.transcribe(params, {
        ...options,
        onProgress: (progress) => {
          event.sender.send("whisper-on-progress", progress);
        },
      })
        .then((result) => {
          return result;
        })
        .catch((err) => {
          logger.error(err);
          throw t("whisperTranscribeFailed", { error: err.message });
        });
    });

    ipcMain.handle("whisper-abort", async (_event) => {
      return await this.abort();
    });
  }
}

export default new Whipser();
