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
  AllowNull,
  AfterFind,
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

  @AllowNull(false)
  @Column(DataType.TEXT)
  content: string;

  @Default({})
  @Column(DataType.JSON)
  parameters: any;

  @Column(DataType.DATE)
  syncedAt: Date;

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

  @AfterFind
  static async syncAfterFind(notes: Note[]) {
    if (!notes.length) return;

    const unsyncedNotes = notes.filter((note) => !note.isSynced);
    if (!unsyncedNotes.length) return;

    unsyncedNotes.forEach((note) => {
      note.sync().catch((err) => {
        logger.error("sync error", err);
      });
    });
  }

  @AfterCreate
  static syncAndUploadAfterCreate(note: Note) {
    note.sync();
  }

  @AfterCreate
  static notifyForCreate(note: Note) {
    this.notify(note, "create");
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
  static destroyRemote(note: Note) {
    const webApi = new Client({
      baseUrl: process.env.WEB_API_URL || WEB_API_URL,
      accessToken: settings.getSync("user.accessToken") as string,
      logger,
    });

    webApi.deleteNote(note.id).catch((err) => {
      logger.error("delete remote note failed:", err.message);
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
