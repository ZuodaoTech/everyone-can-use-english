import {
  AfterUpdate,
  AfterDestroy,
  BelongsTo,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  Unique,
  AfterCreate,
  AllowNull,
  AfterFind,
} from "sequelize-typescript";
import { Audio, Transcription, UserSetting, Video } from "@main/db/models";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Client } from "@/api";
import settings from "@main/settings";
import storage from "@/main/storage";
import path from "path";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import FfmpegWrapper from "@/main/ffmpeg";
import { hashFile } from "@/main/utils";
import fs from "fs-extra";
import { v5 as uuidv5 } from "uuid";
import { MIME_TYPES } from "@/constants";

const logger = log.scope("db/models/segment");
const OUTPUT_FORMAT = "mp3";
@Table({
  modelName: "Segment",
  tableName: "segments",
  underscored: true,
  timestamps: true,
})
export class Segment extends Model<Segment> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.UUID)
  targetId: string;

  @Column(DataType.STRING)
  targetType: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  segmentIndex: number;

  @Unique
  @Column(DataType.STRING)
  md5: string;

  @Column(DataType.JSON)
  caption: TimelineEntry;

  @Column(DataType.NUMBER)
  startTime: number;

  @Column(DataType.NUMBER)
  endTime: number;

  @Column(DataType.DATE)
  syncedAt: Date;

  @Column(DataType.DATE)
  uploadedAt: Date;

  @Column(DataType.VIRTUAL)
  target: Audio | Video;

  @BelongsTo(() => Audio, { foreignKey: "targetId", constraints: false })
  audio: Audio;

  @BelongsTo(() => Video, { foreignKey: "targetId", constraints: false })
  video: Video;

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  @Column(DataType.VIRTUAL)
  get isUploaded(): boolean {
    return Boolean(this.uploadedAt) && this.uploadedAt >= this.updatedAt;
  }

  @Column(DataType.VIRTUAL)
  get src(): string {
    return `enjoy://${path.posix.join(
      "library",
      "segments",
      this.getDataValue("md5") + "." + OUTPUT_FORMAT
    )}`;
  }

  get filePath(): string {
    return path.join(
      settings.userDataPath(),
      "segments",
      this.getDataValue("md5") + "." + OUTPUT_FORMAT
    );
  }

  get extname(): string {
    return path.extname(this.filePath);
  }

  get mimeType(): string {
    return MIME_TYPES[this.extname.toLowerCase()] || "audio/mpeg";
  }

  async sync() {
    if (this.isSynced) return;

    const webApi = new Client({
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger,
    });
    return webApi.syncSegment(this.toJSON()).then(() => {
      const now = new Date();
      this.update({ syncedAt: now, updatedAt: now });
    });
  }

  async upload() {
    if (this.isUploaded) return;

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

  static async generate(params: {
    targetId: string;
    targetType: string;
    segmentIndex: number;
  }) {
    let target: Video | Audio;
    if (params.targetType === "Video") {
      target = await Video.findByPk(params.targetId);
    } else if (params.targetType === "Audio") {
      target = await Audio.findByPk(params.targetId);
    } else {
      throw new Error("Invalid targetType");
    }

    const { targetId, targetType, segmentIndex } = params;
    const transcription = await Transcription.findOne({
      where: { targetId, targetType },
    });

    if (!transcription) {
      throw new Error("Transcription not found");
    }

    const caption = transcription.result.timeline[segmentIndex];
    if (!caption) {
      throw new Error("Caption not found");
    }

    const ffmpeg = new FfmpegWrapper();
    const output = path.join(
      settings.cachePath(),
      `${target.md5}-${segmentIndex}.${OUTPUT_FORMAT}`
    );
    await ffmpeg.crop(target.filePath, {
      startTime: caption.startTime,
      endTime: caption.endTime,
      output,
    });

    const md5 = await hashFile(output, { algo: "md5" });
    const userId = settings.getSync("user.id");
    const id = uuidv5(`${userId}/${md5}`, uuidv5.URL);
    const dir = path.join(settings.userDataPath(), "segments");
    fs.ensureDirSync(dir);
    fs.moveSync(output, path.join(dir, `${md5}.${OUTPUT_FORMAT}`), {
      overwrite: true,
    });

    return Segment.create({
      id,
      targetId,
      targetType,
      segmentIndex,
      md5,
      caption,
      startTime: caption.startTime,
      endTime: caption.endTime,
    });
  }

  @AfterFind
  static async syncAfterFind(segments: Segment[]) {
    if (!segments.length) return;

    const unsyncedSegments = segments.filter((segment) => !segment.isSynced);
    if (!unsyncedSegments.length) return;

    unsyncedSegments.forEach((segment) => {
      segment.sync().catch((err) => {
        logger.error("sync segment error", segment.id, err);
      });
    });

    if (!Array.isArray(segments)) segments = [segments];

    for (const instance of segments) {
      if (instance.targetType === "Audio" && instance.audio) {
        instance.target = instance.audio.toJSON();
      }
      if (instance.targetType === "Video" && instance.video) {
        instance.target = instance.video.toJSON();
      }
      // To prevent mistakes:
      delete instance.audio;
      delete instance.dataValues.audio;
      delete instance.video;
      delete instance.dataValues.video;
    }
  }

  @AfterCreate
  static syncAndUploadAfterCreate(segment: Segment) {
    segment.sync().catch((err) => {
      logger.error("sync segment error", segment.id, err);
    });
    segment.upload().catch((err) => {
      logger.error("upload segment error", segment.id, err);
    });
  }

  @AfterUpdate
  static notifyForUpdate(segment: Segment) {
    this.notify(segment, "update");
  }

  @AfterUpdate
  static syncAfterUpdate(segment: Segment) {
    segment.sync().catch((err) => {
      logger.error("sync segment error", segment.id, err);
    });
  }

  @AfterDestroy
  static notifyForDestroy(segment: Segment) {
    this.notify(segment, "destroy");
  }

  static notify(segment: Segment, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Segment",
      id: segment.id,
      action: action,
      record: segment.toJSON(),
    });
  }
}
