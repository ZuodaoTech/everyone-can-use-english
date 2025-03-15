import { IpcMainEvent } from "electron";
import {
  Recording,
  Audio,
  Video,
  PronunciationAssessment,
} from "@main/db/models";
import {
  FindOptions,
  WhereOptions,
  Attributes,
  Sequelize,
  Op,
} from "sequelize";
import dayjs from "dayjs";
import { t } from "i18next";
import log from "@/main/services/logger";
import { NIL as NIL_UUID } from "uuid";
import FfmpegWrapper from "@/main/services/ffmpeg";
import path from "path";
import { config } from "@main/config";
import { enjoyUrlToPath, pathToEnjoyUrl } from "@main/utils";
import { BaseHandler, HandlerMethod } from "./base-handler";

const logger = log.scope("db/handlers/recordings-handler");

class RecordingsHandler extends BaseHandler {
  protected prefix = "recordings";
  protected handlers: Record<string, HandlerMethod> = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    sync: this.sync.bind(this),
    "sync-all": this.syncAll.bind(this),
    create: this.create.bind(this),
    destroy: this.destroy.bind(this),
    "destroy-bulk": this.destroyBulk.bind(this),
    upload: this.upload.bind(this),
    stats: this.stats.bind(this),
    "group-by-date": this.groupByDate.bind(this),
    "group-by-target": this.groupByTarget.bind(this),
    "group-by-segment": this.groupBySegment.bind(this),
    "stats-for-delete-bulk": this.statsForDeleteBulk.bind(this),
    export: this.export.bind(this),
  };

  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Recording>>
  ) {
    return this.handleRequest(event, async () => {
      const recordings = await Recording.scope("withoutDeleted").findAll({
        include: PronunciationAssessment,
        order: [["createdAt", "DESC"]],
        ...options,
      });

      return recordings.map((recording) => recording.toJSON());
    });
  }

  private async findOne(event: IpcMainEvent, where: WhereOptions<Recording>) {
    return this.handleRequest(event, async () => {
      const recording = await Recording.scope("withoutDeleted").findOne({
        include: PronunciationAssessment,
        order: [["createdAt", "DESC"]],
        where: {
          ...where,
        },
      });
      if (recording && !recording.isSynced) {
        recording.sync().catch(() => {});
      }

      return recording?.toJSON();
    });
  }

  private async sync(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const recording = await Recording.findOne({
        where: {
          id,
        },
      });

      if (!recording) {
        throw new Error(t("models.recording.notFound"));
      }

      await recording.sync();

      return recording.toJSON();
    });
  }

  private async syncAll(event: IpcMainEvent) {
    return this.handleRequest(event, async () => {
      const recordings = await Recording.findAll({
        where: { syncedAt: null },
      });
      if (recordings.length == 0) return;

      event.sender.send("on-notification", {
        type: "warning",
        message: t("syncingRecordings", { count: recordings.length }),
      });

      await Promise.all(recordings.map((recording) => recording.sync()));
    });
  }

  private async create(
    event: IpcMainEvent,
    options: Attributes<Recording> & {
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    }
  ) {
    return this.handleRequest(event, async () => {
      const {
        targetId = NIL_UUID,
        targetType = "None",
        referenceId,
        referenceText,
        duration,
      } = options;
      const recording = await Recording.createFromBlob(options.blob as any, {
        targetId,
        targetType,
        referenceId,
        referenceText,
        duration,
      });
      if (!recording) {
        throw new Error(t("models.recording.failedToSave"));
      }
      return recording.toJSON();
    });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const recording = await Recording.scope("withoutDeleted").findOne({
        where: {
          id,
        },
      });

      if (!recording) {
        throw new Error(t("models.recording.notFound"));
      }

      await recording.softDelete();

      return recording.toJSON();
    });
  }

  private async destroyBulk(
    event: IpcMainEvent,
    where: WhereOptions<Recording> & { ids: string[] }
  ) {
    return this.handleRequest(event, async () => {
      if (where.ids) {
        where = {
          ...where,
          id: {
            [Op.in]: where.ids,
          },
        };
      }
      delete where.ids;

      const recordings = await Recording.scope("withoutDeleted").findAll({
        where,
      });
      if (recordings.length === 0) {
        return;
      }
      for (const recording of recordings) {
        await recording.softDelete();
      }
    });
  }

  private async upload(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const recording = await Recording.scope("withoutDeleted").findOne({
        where: {
          id,
        },
      });

      if (!recording) {
        throw new Error(t("models.recording.notFound"));
      }

      await recording.upload();

      return recording.toJSON();
    });
  }

  private async stats(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    return this.handleRequest(event, async () => {
      const { from, to } = options;
      const where: WhereOptions = {};
      if (from && to) {
        where.createdAt = {
          [Op.between]: [from, to],
        };
      }

      const stats = await Recording.findOne({
        attributes: [
          [Sequelize.fn("count", Sequelize.col("id")), "count"],
          [
            Sequelize.fn("SUM", Sequelize.col("recording.duration")),
            "duration",
          ],
        ],
        where,
      });

      return stats ? stats.toJSON() : null;
    });
  }

  private async groupByDate(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    return this.handleRequest(event, async () => {
      const { from, to } = options;

      const recordings = await Recording.findAll({
        attributes: [
          [Sequelize.fn("DATE", Sequelize.col("created_at")), "date"],
          [Sequelize.fn("count", Sequelize.col("id")), "count"],
        ],
        group: ["date"],
        order: [["date", "ASC"]],
        where: {
          createdAt: {
            [Op.between]: [from, to],
          },
        },
      });

      return recordings.map((recording) => recording.toJSON());
    });
  }

  private async groupByTarget(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    return this.handleRequest(event, async () => {
      // query last 7 days by default
      const {
        from = dayjs().subtract(7, "day").format(),
        to = dayjs().format(),
      } = options;

      const recordings = await Recording.findAll({
        include: [
          {
            model: Audio,
            attributes: ["name", "id"],
          },
          {
            model: Video,
            attributes: ["name", "id"],
          },
        ],
        attributes: [
          "targetId",
          "targetType",
          [Sequelize.fn("DATE", Sequelize.col("recording.created_at")), "date"],
          [Sequelize.fn("COUNT", Sequelize.col("recording.id")), "count"],
          [
            Sequelize.fn("SUM", Sequelize.col("recording.duration")),
            "duration",
          ],
        ],
        group: ["date", "target_id", "target_type"],
        order: [
          ["date", "DESC"],
          ["count", "DESC"],
        ],
        where: {
          createdAt: {
            [Op.between]: [from, to],
          },
        },
      });

      return recordings.map((recording) => recording.toJSON());
    });
  }

  private async groupBySegment(
    event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
    return this.handleRequest(event, async () => {
      const recordings = await Recording.findAll({
        where: {
          targetId,
          targetType,
        },
        include: [
          {
            model: PronunciationAssessment,
            attributes: [
              [
                Sequelize.fn("MAX", Sequelize.col("pronunciation_score")),
                "pronunciationScore",
              ],
            ],
          },
        ],
        attributes: [
          "targetId",
          "targetType",
          "referenceId",
          "referenceText",
          [Sequelize.fn("COUNT", Sequelize.col("reference_id")), "count"],
          [Sequelize.fn("SUM", Sequelize.col("duration")), "duration"],
        ],
        group: ["referenceId"],
        order: [["referenceId", "ASC"]],
      });

      return recordings.map((recording) => recording.toJSON());
    });
  }

  private async statsForDeleteBulk(event: IpcMainEvent) {
    return this.handleRequest(event, async () => {
      // all recordings
      const recordings = await Recording.scope("withoutDeleted").findAll({
        include: PronunciationAssessment,
        order: [["createdAt", "DESC"]],
      });
      // no assessment
      const noAssessment = recordings.filter((r) => !r.pronunciationAssessment);
      // score less than 90
      const scoreLessThan90 = recordings.filter(
        (r) =>
          !r.pronunciationAssessment ||
          r.pronunciationAssessment?.pronunciationScore < 90
      );
      // score less than 80
      const scoreLessThan80 = recordings.filter(
        (r) =>
          !r.pronunciationAssessment ||
          r.pronunciationAssessment?.pronunciationScore < 80
      );

      return {
        noAssessment: noAssessment.map((r) => r.id),
        scoreLessThan90: scoreLessThan90.map((r) => r.id),
        scoreLessThan80: scoreLessThan80.map((r) => r.id),
        all: recordings.map((r) => r.id),
      };
    });
  }

  // Select the highest score of the recordings of each referenceId from the
  // recordings of the target and export as a single file.
  private async export(
    event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
    return this.handleRequest(event, async () => {
      let target: Audio | Video;
      if (targetType === "Audio") {
        target = await Audio.findOne({
          where: {
            id: targetId,
          },
        });
      } else {
        target = await Video.findOne({
          where: {
            id: targetId,
          },
        });
      }

      if (!target) {
        throw new Error(t("models.recording.notFound"));
      }

      // query all recordings of the target
      const recordings = await Recording.scope("withoutDeleted").findAll({
        where: {
          targetId,
          targetType,
        },
        include: [
          {
            model: PronunciationAssessment,
            attributes: [
              [
                Sequelize.fn("MAX", Sequelize.col("pronunciation_score")),
                "pronunciationScore",
              ],
            ],
          },
        ],
        group: ["referenceId"],
        order: [["referenceId", "ASC"]],
      });

      if (!recordings || recordings.length === 0) {
        throw new Error(t("models.recording.notFound"));
      }

      // export the recordings to a single file
      // using ffmpeg concat
      const ffmpeg = new FfmpegWrapper();
      const outputFilePath = path.join(
        config.cachePath(),
        `${targetType}-${target.id}.mp3`
      );
      const inputFiles = recordings.map((recording) =>
        enjoyUrlToPath(recording.src)
      );
      await ffmpeg.concat(inputFiles, outputFilePath);
      return pathToEnjoyUrl(outputFilePath);
    });
  }
}

export const recordingsHandler = new RecordingsHandler();
