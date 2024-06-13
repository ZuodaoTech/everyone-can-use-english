import { ipcMain, IpcMainEvent } from "electron";
import { PronunciationAssessment, Recording } from "@main/db/models";
import { Attributes, FindOptions, WhereOptions } from "sequelize";

class PronunciationAssessmentsHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<PronunciationAssessment>>
  ) {
    const assessments = await PronunciationAssessment.findAll({
      include: [
        {
          association: "recording",
          model: Recording,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      ...options,
    });

    if (!assessments) {
      return [];
    }
    return assessments.map((assessment) => assessment.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<PronunciationAssessment>
  ) {
    const assessment = await PronunciationAssessment.findOne({
      where: {
        ...where,
      },
      include: [
        {
          association: "recording",
          model: Recording,
          required: false,
        },
      ],
    });

    return assessment.toJSON();
  }

  private async create(
    _event: IpcMainEvent,
    data: Partial<Attributes<PronunciationAssessment>> & {
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    }
  ) {
    const recording = await Recording.createFromBlob(data.blob, {
      targetId: "00000000-0000-0000-0000-000000000000",
      targetType: "None",
      referenceText: data.referenceText,
      language: data.language,
    });

    try {
      const assessment = await recording.assess(data.language);
      return assessment.toJSON();
    } catch (error) {
      await recording.destroy();
      throw error;
    }
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    data: Attributes<PronunciationAssessment>
  ) {
    const assessment = await PronunciationAssessment.findOne({
      where: { id: id },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    await assessment.update(data);
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const assessment = await PronunciationAssessment.findOne({
      where: {
        id,
      },
    });

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    await assessment.destroy();
  }

  register() {
    ipcMain.handle("pronunciation-assessments-find-all", this.findAll);
    ipcMain.handle("pronunciation-assessments-find-one", this.findOne);
    ipcMain.handle("pronunciation-assessments-create", this.create);
    ipcMain.handle("pronunciation-assessments-update", this.update);
    ipcMain.handle("pronunciation-assessments-destroy", this.destroy);
  }
}

export const pronunciationAssessmentsHandler =
  new PronunciationAssessmentsHandler();
