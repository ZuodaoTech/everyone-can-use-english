import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import { WHISPER_MODELS_OPTIONS, PROCESS_TIMEOUT } from "@/constants";
import { readdir } from "fs/promises";
import downloader from "@main/downloader";
import Ffmpeg from "@main/ffmpeg";
import { exec } from "child_process";
import fs from "fs-extra";
import log from "electron-log/main";

const logger = log.scope("whisper");
const MAGIC_TOKENS = ["Mrs.", "Ms.", "Mr.", "Dr.", "Prof.", "St."];
const END_OF_WORD_REGEX = /[^\.!,\?][\.!\?]/g;
class Whipser {
  private binMain = path.join(__dirname, "lib", "whisper", "main");

  constructor() {}

  async transcribeBlob(
    blob: { type: string; arrayBuffer: ArrayBuffer },
    prompt?: string
  ) {
    const filename = `${Date.now()}.wav`;
    const format = blob.type.split("/")[1];
    const tempfile = path.join(settings.cachePath(), `${Date.now()}.${format}`);
    await fs.outputFile(tempfile, Buffer.from(blob.arrayBuffer));
    const wavFile = path.join(settings.cachePath(), filename);

    const ffmpeg = new Ffmpeg();
    await ffmpeg.convertToWav(tempfile, wavFile);
    const extra = [];
    if (prompt) {
      extra.push(`--prompt "${prompt.replace(/"/g, '\\"')}"`);
    }
    const { transcription } = await this.transcribe(wavFile, {
      force: true,
      extra,
    });
    const content = transcription
      .map((t: TranscriptionSegmentType) => t.text)
      .join(" ")
      .trim();

    return {
      file: wavFile,
      content,
    };
  }

  async transcribe(
    file: string,
    options: {
      force?: boolean;
      extra?: string[];
    } = {}
  ) {
    const { force = false, extra = [] } = options;
    const filename = path.basename(file, path.extname(file));
    const tmpDir = settings.cachePath();
    const outputFile = path.join(tmpDir, filename + ".json");

    logger.info(`Trying to transcribe ${file} to ${outputFile}`);
    if (fs.pathExistsSync(outputFile) && !force) {
      logger.info(`File ${outputFile} already exists`);
      return fs.readJson(outputFile);
    }

    const ffmpeg = new Ffmpeg();
    const waveFile = await ffmpeg.prepareForWhisper(
      file,
      path.join(tmpDir, filename + ".wav")
    );

    const command = [
      `"${this.binMain}"`,
      `--file "${waveFile}"`,
      `--model "${settings.whisperModelPath()}"`,
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

  groupTranscription(transcription: TranscriptionSegmentType[]) {
    const generateGroup = (group?: TranscriptionSegmentType[]) => {
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
    let group: TranscriptionSegmentType[] = [];

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
    ipcMain.handle("whisper-available-models", async (event) => {
      const models: string[] = [];

      try {
        const files = await readdir(settings.whisperModelsPath());
        for (const file of files) {
          if (WHISPER_MODELS_OPTIONS.find((m) => m.name == file)) {
            models.push(file);
          }
        }
      } catch (err) {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      }

      return models;
    });

    ipcMain.handle("whisper-download-model", (event, name) => {
      const model = WHISPER_MODELS_OPTIONS.find((m) => m.name === name);
      if (!model) {
        event.sender.send("on-notification", {
          type: "error",
          message: `Model ${name} not supported`,
        });
        return;
      }

      downloader.download(model.url, {
        webContents: event.sender,
        savePath: path.join(settings.whisperModelsPath(), model.name),
      });
    });

    ipcMain.handle("whisper-transcribe", async (event, blob, prompt) => {
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
