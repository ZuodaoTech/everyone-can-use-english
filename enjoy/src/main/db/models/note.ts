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
import settings from "@main/settings";
import { Segment, UserSetting } from "@main/db/models";

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
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger,
    });

    // Sync the segment if the note is related to a segment
    if (this.targetType === "Segment") {
      const segment = await Segment.findByPk(this.targetId);
      if (!segment) {
        throw new Error("Segment not found");
      }

      await segment.sync();
    }

    return webApi.syncNote(this.toJSON()).then(() => {
      const now = new Date();
      this.update({ syncedAt: now, updatedAt: now });
    });
  }

  @AfterFind
  static async syncAfterFind(notes: Note[]) {
    if (!notes.length) return;

    const unsyncedNotes = notes.filter((note) => note.id && !note.isSynced);
    if (!unsyncedNotes.length) return;

    unsyncedNotes.forEach((note) => {
      note.sync().catch((err) => {
        logger.error("sync note error", note.id, err);
      });
    });
  }

  @AfterCreate
  static syncAndUploadAfterCreate(note: Note) {
    note.sync().catch((err) => {
      logger.error("sync note error", note.id, err);
    });
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
      logger.error("sync note error", note.id, err);
    });
  }

  @AfterDestroy
  static async destroyRemote(note: Note) {
    const webApi = new Client({
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
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

  static async notify(note: Note, action: "create" | "update" | "destroy") {
    if (!mainWindow.win) return;

    const segment = await Segment.findOne({ where: { id: note.targetId } });
    const record = note.toJSON();

    if (segment) {
      record.segment = segment.toJSON();
    }
    mainWindow.win.webContents.send("db-on-transaction", {
      model: "Note",
      id: note.id,
      action,
      record,
    });
  }
}
