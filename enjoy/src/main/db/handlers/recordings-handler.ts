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

const logger = log.scope("db/handlers/recordings-handler");

class RecordingsHandler {
  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Recording>>
  ) {
    return Recording.findAll({
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

  private async findOne(event: IpcMainEvent, where: WhereOptions<Recording>) {
    return Recording.findOne({
      where: {
        ...where,
      },
    })
      .then((recording) => {
        if (!recording) {
          throw new Error(t("models.recording.notFound"));
        }

        if (!recording.isSynced) {
          recording.sync();
        }

        return recording.toJSON();
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
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
      recordings.forEach(async (recording) => {
        await recording.sync();
      });

      event.sender.send("on-notification", {
        type: "info",
        message: t("allRecordingsSynced"),
      });
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
    const { targetId, targetType, referenceId, referenceText, duration } =
      options;
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
    const recording = await Recording.findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }

    await recording.destroy();
  }

  private async upload(_event: IpcMainEvent, id: string) {
    const recording = await Recording.findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      throw new Error(t("models.recording.notFound"));
    }

    return await recording.upload();
  }

  private async assess(event: IpcMainEvent, id: string, language?: string) {
    const recording = await Recording.findOne({
      where: {
        id,
      },
    });

    if (!recording) {
      event.sender.send("on-notification", {
        type: "error",
        message: t("models.recording.notFound"),
      });
    }

    return recording
      .assess(language)
      .then((res) => {
        return res;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
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

  register() {
    ipcMain.handle("recordings-find-all", this.findAll);
    ipcMain.handle("recordings-find-one", this.findOne);
    ipcMain.handle("recordings-sync", this.sync);
    ipcMain.handle("recordings-sync-all", this.syncAll);
    ipcMain.handle("recordings-create", this.create);
    ipcMain.handle("recordings-destroy", this.destroy);
    ipcMain.handle("recordings-upload", this.upload);
    ipcMain.handle("recordings-assess", this.assess);
    ipcMain.handle("recordings-stats", this.stats);
    ipcMain.handle("recordings-group-by-date", this.groupByDate);
    ipcMain.handle("recordings-group-by-target", this.groupByTarget);
    ipcMain.handle("recordings-group-by-segment", this.groupBySegment);
  }
}

export const recordingsHandler = new RecordingsHandler();
