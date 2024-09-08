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
  AfterFind,
} from "sequelize-typescript";
import mainWindow from "@main/window";
import { Recording, UserSetting } from "@main/db/models";
import { Client } from "@/api";
import settings from "@main/settings";
import log from "@main/logger";

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
  @IsUUID("all")
  @Default(DataType.UUIDV4)
  @Column({ primaryKey: true, type: DataType.UUID })
  id: string;

  @Column(DataType.STRING)
  language: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  targetId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  targetType: string;

  @Column(DataType.VIRTUAL)
  target: Recording;

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
    const webApi = new Client({
      baseUrl: settings.apiUrl(),
      accessToken: (await UserSetting.accessToken()) as string,
      logger: log.scope("api/client"),
    });

    return webApi.syncPronunciationAssessment(this.toJSON()).then(() => {
      this.update({ syncedAt: new Date() });
    });
  }

  @AfterFind
  static async findTarget(
    findResult: PronunciationAssessment | PronunciationAssessment[]
  ) {
    if (!findResult) return;
    if (!Array.isArray(findResult)) findResult = [findResult];

    for (const instance of findResult) {
      if (instance.targetType === "Recording" && instance.recording) {
        instance.target = instance.recording.toJSON();
      }
      // To prevent mistakes:
      delete instance.recording;
      delete instance.dataValues.recording;
    }
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
