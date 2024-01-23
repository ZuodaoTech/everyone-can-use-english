import {
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
  AfterFind,
  BelongsTo,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  Unique,
} from "sequelize-typescript";
import { Audio, Video } from "@main/db/models";
import whisper from "@main/whisper";
import mainWindow from "@main/window";
import log from "electron-log/main";
import { Client } from "@/api";
import { WEB_API_URL, PROCESS_TIMEOUT } from "@/constants";
import settings from "@main/settings";
import Ffmpeg from "@main/ffmpeg";
import path from "path";
import fs from "fs-extra";

const logger = log.scope("db/models/transcription");
const webApi = new Client({
  baseUrl: process.env.WEB_API_URL || WEB_API_URL,
  accessToken: settings.getSync("user.accessToken") as string,
  logger: log.scope("api/client"),
});

@Table({
  modelName: "Transcription",
  tableName: "transcriptions",
  underscored: true,
  timestamps: true,
})
export class Transcription extends Model<Transcription> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.UUID)
  targetId: string;

  @Column(DataType.STRING)
  targetType: string;

  @Unique
  @Column(DataType.STRING)
  targetMd5: string;

  @Default("pending")
  @Column(DataType.ENUM("pending", "processing", "finished"))
  state: "pending" | "processing" | "finished";

  @Column(DataType.STRING)
  engine: string;

  @Column(DataType.STRING)
  model: string;

  @Column(DataType.JSON)
  result: any;

  @Column(DataType.DATE)
  syncedAt: Date;

  @BelongsTo(() => Audio, { foreignKey: "targetId", constraints: false })
  audio: Audio;

  @BelongsTo(() => Video, { foreignKey: "targetId", constraints: false })
  video: Video;

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  async sync() {
    if (this.getDataValue("state") !== "finished") return;

    return webApi.syncTranscription(this.toJSON()).then(() => {
      this.update({ syncedAt: new Date() });
    });
  }

  // STT using whisper
  async process(
    options: {
      force?: boolean;
      wavFileBlob?: { type: string; arrayBuffer: ArrayBuffer };
    } = {}
  ) {
    if (this.getDataValue("state") === "processing") return;

    const { force = false, wavFileBlob } = options;

    logger.info(`[${this.getDataValue("id")}]`, "Start to transcribe.");

    let filePath = "";
    if (this.targetType === "Audio") {
      filePath = (await Audio.findByPk(this.targetId)).filePath;
    } else if (this.targetType === "Video") {
      filePath = (await Video.findByPk(this.targetId)).filePath;
    }

    if (!filePath) {
      logger.error(`[${this.getDataValue("id")}]`, "No file path.");
      throw new Error("No file path.");
    }

    let wavFile: string = filePath;

    const tmpDir = settings.cachePath();
    const outputFile = path.join(
      tmpDir,
      path.basename(filePath, path.extname(filePath)) + ".wav"
    );

    if (wavFileBlob) {
      const format = wavFileBlob.type.split("/")[1];

      if (format !== "wav") {
        throw new Error("Only wav format is supported");
      }

      await fs.outputFile(outputFile, Buffer.from(wavFileBlob.arrayBuffer));
      wavFile = outputFile;
    } else if (settings.ffmpegConfig().ready) {
      const ffmpeg = new Ffmpeg();
      try {
        wavFile = await ffmpeg.prepareForWhisper(
          filePath,
          path.join(
            tmpDir,
            path.basename(filePath, path.extname(filePath)) + ".wav"
          )
        );
      } catch (err) {
        logger.error("ffmpeg error", err);
      }
    }

    try {
      await this.update({
        state: "processing",
      });
      const { model, transcription } = await whisper.transcribe(wavFile, {
        force,
        extra: [
          "--split-on-word",
          "--max-len 1",
          `--prompt "Hello! Welcome to listen to this audio."`,
        ],
      });
      const result = whisper.groupTranscription(transcription);
      this.update({
        engine: "whisper",
        model: model?.type,
        result,
        state: "finished",
      }).then(() => this.sync());

      logger.info(`[${this.getDataValue("id")}]`, "Transcription finished.");
    } catch (err) {
      logger.error(
        `[${this.getDataValue("id")}]`,
        "Transcription not finished.",
        err
      );
      this.update({
        state: "pending",
      });

      throw err;
    }
  }

  @AfterCreate
  static startTranscribeAsync(transcription: Transcription) {
    setTimeout(() => {
      transcription.process();
    }, 0);
  }

  @AfterUpdate
  static notifyForUpdate(transcription: Transcription) {
    this.notify(transcription, "update");
  }

  @AfterDestroy
  static notifyForDestroy(transcription: Transcription) {
    this.notify(transcription, "destroy");
  }

  @AfterFind
  static expireProcessingState(transcription: Transcription) {
    if (transcription?.state !== "processing") return;

    if (transcription.updatedAt.getTime() + PROCESS_TIMEOUT < Date.now()) {
      if (transcription.result) {
        transcription.update({
          state: "finished",
        });
      } else {
        transcription.update({
          state: "pending",
        });
      }
    }
  }

  static notify(
    transcription: Transcription,
    action: "create" | "update" | "destroy"
  ) {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Transcription",
      id: transcription.id,
      action: action,
      record: transcription.toJSON(),
    });
  }
}
