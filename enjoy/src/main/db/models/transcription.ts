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
} from "sequelize-typescript";
import { Audio, UserSetting, Video } from "@main/db/models";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Client } from "@/api";
import { PROCESS_TIMEOUT } from "@/constants";
import settings from "@main/settings";
import { AlignmentResult } from "echogarden/dist/api/Alignment";
import { createHash } from "crypto";

const logger = log.scope("db/models/transcription");
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

  @Column(DataType.STRING)
  language: string;

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
  result: Partial<AlignmentResult> & {
    originalText?: string;
    tokenId?: string | number;
  };

  @Column(DataType.DATE)
  syncedAt: Date;

  @BelongsTo(() => Audio, { foreignKey: "targetId", constraints: false })
  audio: Audio;

  @BelongsTo(() => Video, { foreignKey: "targetId", constraints: false })
  video: Video;

  @Column(DataType.VIRTUAL)
  get md5(): string {
    // Calculate md5 of result
    if (!this.result) return null;
    return createHash("md5").update(JSON.stringify(this.result)).digest("hex");
  }

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  async sync() {
    if (this.isSynced) return;
    if (this.getDataValue("state") !== "finished") return;

    const webApi = new Client({
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger,
    });
    return webApi.syncTranscription(this.toJSON()).then(() => {
      const now = new Date();
      this.update({ syncedAt: now, updatedAt: now });
    });
  }

  @AfterUpdate
  static notifyForUpdate(transcription: Transcription) {
    this.notify(transcription, "update");
  }

  @AfterUpdate
  static syncAfterUpdate(transcription: Transcription) {
    transcription.sync().catch((err) => {
      logger.error("sync transcription error", transcription.id, err);
    });
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
