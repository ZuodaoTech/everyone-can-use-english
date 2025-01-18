import { ipcMain, IpcMainEvent } from "electron";
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
import log from "@main/logger";
import { NIL as NIL_UUID } from "uuid";
import FfmpegWrapper from "@main/ffmpeg";
import path from "path";
import settings from "@main/settings";
import { enjoyUrlToPath, pathToEnjoyUrl } from "@main/utils";

const logger = log.scope("db/handlers/recordings-handler");

class RecordingsHandler {
  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Recording>>
  ) {
    return Recording.scope("withoutDeleted")
      .findAll({
        include: PronunciationAssessment,
        order: [["createdAt", "DESC"]],
        ...options,
      })
      .then((recordings) => {
        if (!recordings) {
          return [];
        }
        return recordings.map((recording) => recording.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async findOne(_event: IpcMainEvent, where: WhereOptions<Recording>) {
    const recording = await Recording.scope("withoutDeleted").findOne({
      include: PronunciationAssessment,
      order: [["createdAt", "DESC"]],
      where: {
        ...where,
      },
    });
    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }
    if (!recording.isSynced) {
      recording.sync().catch(() => {});
    }

    return recording.toJSON();
  }

  private async sync(_event: IpcMainEvent, id: string) {
    const recording = await Recording.findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }

    return await recording.sync();
  }

  private async syncAll(event: IpcMainEvent) {
    const recordings = await Recording.findAll({
      where: { syncedAt: null },
    });
    if (recordings.length == 0) return;

    event.sender.send("on-notification", {
      type: "warning",
      message: t("syncingRecordings", { count: recordings.length }),
    });

    try {
      await Promise.all(recordings.map((recording) => recording.sync()));
    } catch (err) {
      logger.error("failed to sync recordings", err.message);

      event.sender.send("on-notification", {
        type: "error",
        message: t("failedToSyncRecordings"),
      });
    }
  }

  private async create(
    _event: IpcMainEvent,
    options: Attributes<Recording> & {
      blob: {
        type: string;
        arrayBuffer: ArrayBuffer;
      };
    }
  ) {
    const {
      targetId = NIL_UUID,
      targetType = "None",
      referenceId,
      referenceText,
      duration,
    } = options;
    const recording = await Recording.createFromBlob(options.blob, {
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
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const recording = await Recording.scope("withoutDeleted").findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }

    await recording.softDelete();
  }

  private async destroyBulk(
    _event: IpcMainEvent,
    where: WhereOptions<Recording> & { ids: string[] }
  ) {
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
  }

  private async upload(_event: IpcMainEvent, id: string) {
    const recording = await Recording.scope("withoutDeleted").findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }

    return await recording.upload();
  }

  private async stats(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    const { from, to } = options;
    const where: WhereOptions = {};
    if (from && to) {
      where.createdAt = {
        [Op.between]: [from, to],
      };
    }

    return Recording.findOne({
      attributes: [
        [Sequelize.fn("count", Sequelize.col("id")), "count"],
        [Sequelize.fn("SUM", Sequelize.col("recording.duration")), "duration"],
      ],
      where,
    })
      .then((stats) => {
        if (!stats) {
          return [];
        }
        return stats.toJSON();
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async groupByDate(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    const { from, to } = options;

    return Recording.findAll({
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
    })
      .then((recordings) => {
        if (!recordings) {
          return [];
        }
        return recordings.map((recording) => recording.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async groupByTarget(
    event: IpcMainEvent,
    options: { from: string; to: string }
  ) {
    // query last 7 days by default
    const {
      from = dayjs().subtract(7, "day").format(),
      to = dayjs().format(),
    } = options;

    return Recording.findAll({
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
        [Sequelize.fn("SUM", Sequelize.col("recording.duration")), "duration"],
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
    })
      .then((recordings) => {
        if (!recordings) {
          return [];
        }
        return recordings.map((recording) => recording.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async groupBySegment(
    event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
    return Recording.findAll({
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
    })
      .then((stats) => {
        if (!stats) {
          return [];
        }
        return stats.map((stat) => stat.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async statsForDeleteBulk() {
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
  }

  // Select the highest score of the recordings of each referenceId from the
  // recordings of the target and export as a single file.
  private async export(
    _event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
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
      settings.cachePath(),
      `${targetType}-${target.id}.mp3`
    );
    const inputFiles = recordings.map((recording) =>
      enjoyUrlToPath(recording.src)
    );
    await ffmpeg.concat(inputFiles, outputFilePath);
    return pathToEnjoyUrl(outputFilePath);
  }

  register() {
    ipcMain.handle("recordings-find-all", this.findAll);
    ipcMain.handle("recordings-find-one", this.findOne);
    ipcMain.handle("recordings-sync", this.sync);
    ipcMain.handle("recordings-sync-all", this.syncAll);
    ipcMain.handle("recordings-create", this.create);
    ipcMain.handle("recordings-destroy", this.destroy);
    ipcMain.handle("recordings-destroy-bulk", this.destroyBulk);
    ipcMain.handle("recordings-upload", this.upload);
    ipcMain.handle("recordings-stats", this.stats);
    ipcMain.handle("recordings-group-by-date", this.groupByDate);
    ipcMain.handle("recordings-group-by-target", this.groupByTarget);
    ipcMain.handle("recordings-group-by-segment", this.groupBySegment);
    ipcMain.handle("recordings-stats-for-delete-bulk", this.statsForDeleteBulk);
    ipcMain.handle("recordings-export", this.export);
  }

  unregister() {
    ipcMain.removeHandler("recordings-find-all");
    ipcMain.removeHandler("recordings-find-one");
    ipcMain.removeHandler("recordings-sync");
    ipcMain.removeHandler("recordings-sync-all");
    ipcMain.removeHandler("recordings-create");
    ipcMain.removeHandler("recordings-destroy");
    ipcMain.removeHandler("recordings-destroy-bulk");
    ipcMain.removeHandler("recordings-upload");
    ipcMain.removeHandler("recordings-stats");
    ipcMain.removeHandler("recordings-group-by-date");
    ipcMain.removeHandler("recordings-group-by-target");
    ipcMain.removeHandler("recordings-group-by-segment");
    ipcMain.removeHandler("recordings-stats-for-delete-bulk");
    ipcMain.removeHandler("recordings-export");
  }
}

export const recordingsHandler = new RecordingsHandler();
