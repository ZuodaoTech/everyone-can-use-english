import {
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
  AfterCreate,
} from "sequelize-typescript";
import { Audio, Transcription, Video } from "@main/db/models";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Client } from "@/api";
import { WEB_API_URL } from "@/constants";
import settings from "@main/settings";
import storage from "@/main/storage";
import path from "path";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import FfmpegWrapper from "@/main/ffmpeg";
import { hashFile } from "@/main/utils";
import fs from "fs-extra";

const logger = log.scope("db/models/segment");
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

  @Unique
  @Column(DataType.STRING)
  md5: string;

  @Column(DataType.JSON)
  caption: TimelineEntry;

  @Column(DataType.DATE)
  syncedAt: Date;

  @Column(DataType.DATE)
  uploadedAt: Date;

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

  get filePath(): string {
    return path.join(
      settings.userDataPath(),
      "segments",
      this.getDataValue("md5") + ".mp3"
    );
  }

  async sync() {
    if (this.isSynced) return;

    const webApi = new Client({
      baseUrl: process.env.WEB_API_URL || WEB_API_URL,
      accessToken: settings.getSync("user.accessToken") as string,
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

  static async generate(params: {
    targetId: string;
    targetType: string;
    segmentIndex: number;
  }) {
    let target: Video | Audio;
    if (params.targetType === "video") {
      target = await Video.findByPk(params.targetId);
    } else if (params.targetType === "audio") {
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
      `${target.md5}-${segmentIndex}.mp3`
    );
    await ffmpeg.crop(target.filePath, {
      startTime: caption.startTime,
      endTime: caption.endTime,
      output: path.join(
        settings.cachePath(),
        `${target.md5}-${segmentIndex}.mp3`
      ),
    });

    const md5 = hashFile(output, { algo: "md5" });
    const dir = path.join(settings.cachePath(), "segments");
    fs.ensureDirSync(dir);
    fs.moveSync(
      output,
      path.join(dir, `${md5}.mp3`)
    );

    return Segment.create({
      targetId,
      targetType,
      md5: target.md5,
      caption,
    });
  }

  @AfterCreate
  static syncAndUploadAfterCreate(segment: Segment) {
    segment.sync();
    segment.upload();
  }

  @AfterUpdate
  static notifyForUpdate(segment: Segment) {
    this.notify(segment, "update");
  }

  @AfterUpdate
  static syncAfterUpdate(segment: Segment) {
    segment.sync().catch((err) => {
      logger.error("sync error", err);
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
