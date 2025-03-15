import { IpcMainEvent } from "electron";
import { PronunciationAssessment, Recording } from "@main/db/models";
import { Attributes, FindOptions, WhereOptions } from "sequelize";
import { BaseHandler, HandlerMethod } from "./base-handler";

class PronunciationAssessmentsHandler extends BaseHandler {
  protected prefix = "pronunciation-assessments";
  protected handlers: Record<string, HandlerMethod> = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
  };

  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<PronunciationAssessment>>
  ) {
    return this.handleRequest(event, async () => {
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
    });
  }

  private async findOne(
    event: IpcMainEvent,
    where: WhereOptions<PronunciationAssessment>
  ) {
    return this.handleRequest(event, async () => {
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
    });
  }

  private async create(
    event: IpcMainEvent,
    data: Partial<Attributes<PronunciationAssessment>>
  ) {
    return this.handleRequest(event, async () => {
      const { targetId, targetType } = data;
      const existed = await PronunciationAssessment.findOne({
        where: {
          targetId,
          targetType,
        },
      });

      if (existed) {
        return existed.toJSON();
      }

      const assessment = await PronunciationAssessment.create(data);
      return assessment.toJSON();
    });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    data: Attributes<PronunciationAssessment>
  ) {
    return this.handleRequest(event, async () => {
      const assessment = await PronunciationAssessment.findOne({
        where: { id: id },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      await assessment.update(data);
    });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const assessment = await PronunciationAssessment.findOne({
        where: {
          id,
        },
      });

      if (!assessment) {
        throw new Error("Assessment not found");
      }

      await assessment.destroy();
    });
  }
}

export const pronunciationAssessmentsHandler =
  new PronunciationAssessmentsHandler();
