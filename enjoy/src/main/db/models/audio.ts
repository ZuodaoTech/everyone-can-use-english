import {
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
  BeforeCreate,
  BelongsTo,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  HasMany,
  HasOne,
  DataType,
  Unique,
} from "sequelize-typescript";
import { Recording, Speech, Transcription, Video } from "@main/db/models";
import settings from "@main/settings";
import { AudioFormats, VideoFormats, WEB_API_URL } from "@/constants";
import { hashFile } from "@main/utils";
import path from "path";
import fs from "fs-extra";
import { t } from "i18next";
import mainWindow from "@main/window";
import log from "@main/logger";
import storage from "@main/storage";
import Ffmpeg from "@main/ffmpeg";
import { Client } from "@/api";
import startCase from "lodash/startCase";
import { v5 as uuidv5 } from "uuid";
import FfmpegWrapper from "@main/ffmpeg";

const SIZE_LIMIT = 1024 * 1024 * 50; // 50MB

const logger = log.scope("db/models/audio");

@Table({
  modelName: "Audio",
  tableName: "audios",
  underscored: true,
  timestamps: true,
})
export class Audio extends Model<Audio> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  source: string;

  @Unique
  @Column(DataType.STRING)
  md5: string;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.JSON)
  metadata: any;

  @Column(DataType.STRING)
  coverUrl: string;

  @HasMany(() => Recording, {
    foreignKey: "targetId",
    constraints: false,
    scope: { target_type: "Audio" },
  })
  recordings: Recording[];

  @HasOne(() => Transcription, {
    foreignKey: "targetId",
    constraints: false,
    scope: { target_type: "Audio" },
  })
  transcription: Transcription;

  @BelongsTo(() => Speech, "md5")
  speech: Speech;

  @Default(0)
  @Column(DataType.INTEGER)
  recordingsCount: number;

  @Default(0)
  @Column(DataType.INTEGER)
  recordingsDuration: number;

  @Column(DataType.DATE)
  syncedAt: Date;

  @Column(DataType.DATE)
  uploadedAt: Date;

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  @Column(DataType.VIRTUAL)
  get isUploaded(): boolean {
    return Boolean(this.uploadedAt);
  }

  @Column(DataType.VIRTUAL)
  get transcribing(): boolean {
    return this.transcription?.state === "processing";
  }

  @Column(DataType.VIRTUAL)
  get transcribed(): boolean {
    return Boolean(this.transcription?.result);
  }

  @Column(DataType.VIRTUAL)
  get src(): string {
    return `enjoy://${path.posix.join(
      "library",
      "audios",
      this.getDataValue("md5") + this.extname
    )}`;
  }

  @Column(DataType.VIRTUAL)
  get duration(): number {
    return this.getDataValue("metadata").duration;
  }

  @Column(DataType.VIRTUAL)
  get mediaType(): string {
    return "Audio";
  }

  @Column(DataType.VIRTUAL)
  get filename(): string {
    return this.getDataValue("md5") + this.extname;
  }

  get extname(): string {
    return (
      this.getDataValue("metadata").extname ||
      path.extname(this.getDataValue("source")) ||
      ""
    );
  }

  get filePath(): string {
    return path.join(
      settings.userDataPath(),
      "audios",
      this.getDataValue("md5") + this.extname
    );
  }

  async upload(force: boolean = false) {
    if (this.isUploaded && !force) return;

    return storage
      .put(this.md5, this.filePath)
      .then((result) => {
        logger.debug("upload result:", result.data);
        if (result.data.success) {
          this.update({ uploadedAt: new Date() });
        } else {
          throw new Error(result.data);
        }
      })
      .catch((err) => {
        logger.error("upload failed:", err.message);
        throw err;
      });
  }

  async sync() {
    if (this.isSynced) return;

    const webApi = new Client({
      baseUrl: process.env.WEB_API_URL || WEB_API_URL,
      accessToken: settings.getSync("user.accessToken") as string,
      logger: log.scope("audio/sync"),
    });

    return webApi.syncAudio(this.toJSON()).then(() => {
      const now = new Date();
      this.update({ syncedAt: now, updatedAt: now });
    });
  }

  async crop(params: { startTime: number; endTime: number }) {
    const { startTime, endTime } = params;

    const ffmpeg = new FfmpegWrapper();
    const output = path.join(
      settings.cachePath(),
      `${this.name}(${startTime.toFixed(2)}s-${endTime.toFixed(2)}).mp3`
    );
    await ffmpeg.crop(this.filePath, {
      startTime,
      endTime,
      output,
    });

    return output;
  }

  @BeforeCreate
  static async setupDefaultAttributes(audio: Audio) {
    try {
      const ffmpeg = new Ffmpeg();
      const fileMetadata = await ffmpeg.generateMetadata(audio.filePath);
      audio.metadata = Object.assign(audio.metadata || {}, {
        ...fileMetadata,
        duration: fileMetadata.format.duration,
      });
    } catch (err) {
      logger.error("failed to generate metadata", err.message);
    }
  }

  @AfterCreate
  static autoSync(audio: Audio) {
    // auto sync should not block the main thread
    audio.sync().catch(() => {});
  }

  @AfterCreate
  static notifyForCreate(audio: Audio) {
    this.notify(audio, "create");
  }

  @AfterUpdate
  static notifyForUpdate(audio: Audio) {
    this.notify(audio, "update");
    audio.sync().catch(() => {});
  }

  @AfterDestroy
  static notifyForDestroy(audio: Audio) {
    this.notify(audio, "destroy");
  }

  @AfterDestroy
  static cleanupFile(audio: Audio) {
    fs.remove(audio.filePath);
    Recording.destroy({
      where: {
        targetId: audio.id,
        targetType: "Audio",
      },
    });
    Transcription.destroy({
      where: {
        targetId: audio.id,
        targetType: "Audio",
      },
    });

    const webApi = new Client({
      baseUrl: process.env.WEB_API_URL || WEB_API_URL,
      accessToken: settings.getSync("user.accessToken") as string,
      logger: log.scope("audio/cleanupFile"),
    });

    webApi.deleteAudio(audio.id).catch((err) => {
      logger.error("deleteAudio failed:", err.message);
    });
  }

  static async buildFromLocalFile(
    filePath: string,
    params?: {
      name?: string;
      description?: string;
      source?: string;
      coverUrl?: string;
    }
  ): Promise<Audio | Video> {
    // Check if file exists
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(t("models.audio.fileNotFound", { file: filePath }));
    }

    // Check if file format is supported
    const extname = path.extname(filePath).toLocaleLowerCase();
    if (VideoFormats.includes(extname.split(".").pop() as string)) {
      return Video.buildFromLocalFile(filePath, params);
    } else if (!AudioFormats.includes(extname.split(".").pop() as string)) {
      throw new Error(t("models.audio.fileNotSupported", { file: filePath }));
    }

    const stats = fs.statSync(filePath);
    if (stats.size > SIZE_LIMIT) {
      throw new Error(t("models.audio.fileTooLarge", { file: filePath }));
    }

    const md5 = await hashFile(filePath, { algo: "md5" });

    // check if file already exists
    const existing = await Audio.findOne({
      where: {
        md5,
      },
    });
    if (existing) {
      throw new Error(t("audioAlreadyAddedToLibrary", { file: filePath }));
    }

    // Generate ID
    const userId = settings.getSync("user.id");
    const id = uuidv5(`${userId}/${md5}`, uuidv5.URL);
    logger.debug("Generated ID:", id);

    const destDir = path.join(settings.userDataPath(), "audios");
    const destFile = path.join(destDir, `${md5}${extname}`);

    // Copy file to library
    try {
      // Create directory if not exists
      fs.ensureDirSync(destDir);

      // Copy file
      fs.copySync(filePath, destFile);

      // Check if file copied
      fs.accessSync(destFile, fs.constants.R_OK);
    } catch (error) {
      throw new Error(t("models.audio.failedToCopyFile", { file: filePath }));
    }

    const {
      name = startCase(path.basename(filePath, extname)),
      description,
      source,
      coverUrl,
    } = params || {};
    const record = this.build({
      id,
      source,
      md5,
      name,
      description,
      coverUrl,
      metadata: {
        extname,
      },
    });

    return record.save().catch((err) => {
      logger.error(err);
      // Remove copied file
      fs.removeSync(destFile);
      throw err;
    });
  }

  static notify(audio: Audio, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Audio",
      id: audio.id,
      action: action,
      record: audio.toJSON(),
    });
  }
}
