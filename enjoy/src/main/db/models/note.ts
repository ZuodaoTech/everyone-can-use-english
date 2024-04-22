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
  AfterCreate,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import log from "@main/logger";
import { Client } from "@/api";
import { WEB_API_URL } from "@/constants";
import settings from "@main/settings";
import { Segment } from "@main/db/models";

const logger = log.scope("db/models/note");
@Table({
  modelName: "Note",
  tableName: "notes",
  underscored: true,
  timestamps: true,
})
export class Note extends Model<Note> {
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.UUID)
  targetId: string;

  @Column(DataType.STRING)
  targetType: string;

  @Column(DataType.TEXT)
  content: string;

  @Column(DataType.DATE)
  syncedAt: Date;

  @Column(DataType.DATE)
  uploadedAt: Date;

  @BelongsTo(() => Segment, { foreignKey: "targetId", constraints: false })
  segment: Segment;

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  async sync(): Promise<void> {
    if (this.isSynced) return;

    const webApi = new Client({
      baseUrl: process.env.WEB_API_URL || WEB_API_URL,
      accessToken: settings.getSync("user.accessToken") as string,
      logger,
    });

    return webApi.syncNote(this.toJSON()).then(() => {
      const now = new Date();
      this.update({ syncedAt: now, updatedAt: now });
    });
  }

  @AfterCreate
  static syncAndUploadAfterCreate(note: Note) {
    note.sync();
  }

  @AfterUpdate
  static notifyForUpdate(note: Note) {
    this.notify(note, "update");
  }

  @AfterUpdate
  static syncAfterUpdate(note: Note) {
    note.sync().catch((err) => {
      logger.error("sync error", err);
    });
  }

  @AfterDestroy
  static notifyForDestroy(note: Note) {
    this.notify(note, "destroy");
  }

  static notify(note: Note, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Note",
      id: note.id,
      action: action,
      record: note.toJSON(),
    });
  }
}
