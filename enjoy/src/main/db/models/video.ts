import {
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
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
import {
  Audio,
  Recording,
  Speech,
  Transcription,
  UserSetting,
} from "@main/db/models";
import settings from "@main/settings";
import {
  AudioFormats,
  MIME_TYPES,
  VideoFormats,
  WEB_API_URL,
} from "@/constants";
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

const logger = log.scope("db/models/video");

@Table({
  modelName: "Video",
  tableName: "videos",
  underscored: true,
  timestamps: true,
})
export class Video extends Model<Video> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  language: string;

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
    scope: { target_type: "Video" },
  })
  recordings: Recording[];

  @HasOne(() => Transcription, {
    foreignKey: "targetId",
    constraints: false,
    scope: { target_type: "Video" },
  })
  transcription: Transcription;

  @BelongsTo(() => Speech, {
    foreignKey: "md5",
    constraints: false,
  })
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
    return this.transcription?.state === "finished";
  }

  @Column(DataType.VIRTUAL)
  get src(): string {
    if (this.compressedFilePath) {
      return `enjoy://${path.posix.join(
        "library",
        "videos",
        this.getDataValue("md5") + ".compressed.mp4"
      )}`;
    } else if (this.originalFilePath) {
      return `enjoy://${path.posix.join(
        "library",
        "videos",
        this.getDataValue("md5") + this.extname
      )}`;
    } else {
      return null;
    }
  }

  @Column(DataType.VIRTUAL)
  get duration(): number {
    return this.getDataValue("metadata").duration;
  }

  @Column(DataType.VIRTUAL)
  get mediaType(): string {
    return "Video";
  }

  @Column(DataType.VIRTUAL)
  get filename(): string {
    return this.getDataValue("md5") + this.extname;
  }

  get mimeType(): string {
    return MIME_TYPES[this.extname.toLowerCase()] || "video/mp4";
  }

  get extname(): string {
    return (
      this.getDataValue("metadata").extname ||
      path.extname(this.getDataValue("source")) ||
      ""
    );
  }

  get filePath(): string {
    return this.compressedFilePath || this.originalFilePath;
  }

  get originalFilePath(): string {
    const file = path.join(
      settings.userDataPath(),
      "videos",
      this.getDataValue("md5") + this.extname
    );

    if (fs.existsSync(file)) {
      return file;
    } else {
      return null;
    }
  }

  get compressedFilePath(): string {
    const file = path.join(
      settings.userDataPath(),
      "videos",
      `${this.getDataValue("md5")}.compressed.mp4`
    );

    if (fs.existsSync(file)) {
      return file;
    } else {
      return null;
    }
  }

  // generate cover and upload
  async generateCover() {
    if (this.coverUrl) return;

    const ffmpeg = new Ffmpeg();
    const coverFile = await ffmpeg.generateCover(
      this.filePath,
      path.join(settings.cachePath(), `${Date.now()}.png`)
    );
    const hash = await hashFile(coverFile, { algo: "md5" });
    const finalFile = path.join(settings.cachePath(), `${hash}.png`);
    fs.renameSync(coverFile, finalFile);

    storage.put(hash, finalFile, "image/png").then((result) => {
      logger.debug("cover upload result:", result.data);
      if (result.data.success) {
        this.update({ coverUrl: storage.getUrl(hash) });
      }
    });
  }

  async upload(force: boolean = false) {
    if (this.isUploaded && !force) return;

    return storage
      .put(this.md5, this.filePath, this.mimeType)
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
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger,
    });

    return webApi.syncVideo(this.toJSON()).then(() => {
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

  @AfterCreate
  static autoSync(video: Video) {
    video.sync().catch((err) => {
      logger.error("sync video error", video.id, err);
    });
    video.generateCover().catch((err) => {
      logger.error("generate cover error", video.id, err);
    });
  }

  @AfterCreate
  static notifyForCreate(video: Video) {
    this.notify(video, "create");
  }

  @AfterUpdate
  static notifyForUpdate(video: Video) {
    this.notify(video, "update");
    video.sync().catch((err) => {
      logger.error("sync video error", video.id, err);
    });
  }

  @AfterDestroy
  static notifyForDestroy(video: Video) {
    this.notify(video, "destroy");
  }

  @AfterDestroy
  static async cleanupFile(video: Video) {
    if (video.filePath) {
      fs.remove(video.filePath);
    }
    Recording.destroy({
      where: {
        targetId: video.id,
        targetType: "Video",
      },
    });

    const webApi = new Client({
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger: log.scope("video/cleanupFile"),
    });

    webApi.deleteVideo(video.id).catch((err) => {
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
      compressing?: boolean;
    }
  ): Promise<Audio | Video> {
    const { compressing = true } = params || {};

    // Check if file exists
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(t("models.video.fileNotFound", { file: filePath }));
    }

    // Check if file format is supported
    const extname = path.extname(filePath).toLocaleLowerCase();
    if (AudioFormats.includes(extname.split(".").pop() as string)) {
      return Audio.buildFromLocalFile(filePath, params);
    } else if (!VideoFormats.includes(extname.split(".").pop() as string)) {
      throw new Error(t("models.video.fileNotSupported", { file: filePath }));
    }

    const md5 = await hashFile(filePath, { algo: "md5" });

    // check if file already exists
    const existing = await Video.findOne({
      where: {
        md5,
      },
    });
    if (!!existing) {
      logger.warn("Video already exists:", existing.id, existing.name);
      existing.changed("updatedAt", true);
      existing.update({ updatedAt: new Date() });
      return existing;
    }

    // Generate ID
    const userId = settings.getSync("user.id");
    const id = uuidv5(`${userId}/${md5}`, uuidv5.URL);
    logger.debug("Generated ID:", id);

    const destDir = path.join(settings.userDataPath(), "videos");
    const destFile = path.join(
      destDir,
      compressing ? `${md5}.compressed.mp4` : `${md5}${extname}`
    );

    let metadata = {
      extname,
    };

    // Copy file to library
    try {
      // Create directory if not exists
      fs.ensureDirSync(destDir);

      // fetch metadata
      const ffmpeg = new FfmpegWrapper();
      const fileMetadata = await ffmpeg.generateMetadata(filePath);
      metadata = Object.assign(metadata, {
        ...fileMetadata,
        duration: fileMetadata.format.duration,
      });

      if (compressing) {
        // Compress file to destFile
        await ffmpeg.compressVideo(filePath, destFile);
      } else {
        // Copy file
        fs.copyFileSync(filePath, destFile);
      }

      // Check if file copied
      fs.accessSync(destFile, fs.constants.R_OK);
    } catch (error) {
      throw new Error(t("models.video.failedToCopyFile", { file: filePath }));
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
      metadata,
    });

    return record.save().catch((err) => {
      logger.error(err);
      // Remove copied file
      fs.removeSync(destFile);
      throw err;
    });
  }

  static notify(video: Video, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Video",
      id: video.id,
      action: action,
      record: video.toJSON(),
    });
  }
}
