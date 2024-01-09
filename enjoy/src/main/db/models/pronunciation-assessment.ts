import {
  AfterCreate,
  AfterUpdate,
  AfterDestroy,
  BelongsTo,
  Scopes,
  Table,
  Column,
  Default,
  IsUUID,
  Model,
  DataType,
  AllowNull,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import { Recording } from "@main/db/models";
import webApi from "@main/web-api";

@Table({
  modelName: "PronunciationAssessment",
  tableName: "pronunciation_assessments",
  underscored: true,
  timestamps: true,
})
@Scopes(() => ({
  asc: {
    order: [["createdAt", "ASC"]],
  },
  desc: {
    order: [["createdAt", "DESC"]],
  },
}))
export class PronunciationAssessment extends Model<PronunciationAssessment> {
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  targetId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  targetType: string;

  @BelongsTo(() => Recording, {
    foreignKey: "targetId",
    constraints: false,
  })
  recording: Recording;

  @AllowNull(true)
  @Column(DataType.STRING)
  referenceText: string;

  @Column(DataType.FLOAT)
  accuracyScore: number;

  @Column(DataType.FLOAT)
  completenessScore: number;

  @Column(DataType.FLOAT)
  fluencyScore: number;

  @Column(DataType.FLOAT)
  prosodyScore: number;

  @Column(DataType.FLOAT)
  pronunciationScore: number;

  @Column(DataType.FLOAT)
  grammarScore: number;

  @Column(DataType.FLOAT)
  vocabularyScore: number;

  @Column(DataType.FLOAT)
  topicScore: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  result: any;

  @Column(DataType.DATE)
  syncedAt: Date;

  @Column(DataType.VIRTUAL)
  get isSynced(): boolean {
    return Boolean(this.syncedAt) && this.syncedAt >= this.updatedAt;
  }

  async sync() {
    return webApi.syncPronunciationAssessment(this.toJSON()).then(() => {
      this.update({ syncedAt: new Date() });
    });
  }

  @AfterCreate
  static autoSync(pronunciationAssessment: PronunciationAssessment) {
    pronunciationAssessment.sync().catch(() => {});
  }

  @AfterCreate
  static notifyForCreate(pronunciationAssessment: PronunciationAssessment) {
    this.notify(pronunciationAssessment, "create");
  }

  @AfterUpdate
  static notifyForUpdate(pronunciationAssessment: PronunciationAssessment) {
    this.notify(pronunciationAssessment, "update");
  }

  @AfterDestroy
  static notifyForDestroy(pronunciationAssessment: PronunciationAssessment) {
    this.notify(pronunciationAssessment, "destroy");
  }

  static notify(
    pronunciationAssessment: PronunciationAssessment,
    action: "create" | "update" | "destroy"
  ) {
    if (!mainWindow.win) return;

    mainWindow.win.webContents.send("db-on-transaction", {
      model: "PronunciationAssessment",
      id: pronunciationAssessment.id,
      action: action,
      record: pronunciationAssessment.toJSON(),
    });
  }
}
