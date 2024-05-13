import { ipcMain, IpcMainEvent } from "electron";
import { Audio, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes } from "sequelize";
import downloader from "@main/downloader";
import log from "@main/logger";
import { t } from "i18next";
import youtubedr from "@main/youtubedr";
import { pathToEnjoyUrl } from "@/main/utils";

const logger = log.scope("db/handlers/audios-handler");

class AudiosHandler {
  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Audio>>
  ) {
    return Audio.findAll({
      order: [["updatedAt", "DESC"]],
      include: [
        {
          association: "transcription",
          model: Transcription,
          where: { targetType: "Audio" },
          required: false,
        },
      ],
      ...options,
    })
      .then((audios) => {
        if (!audios) {
          return [];
        }
        return audios.map((audio) => audio.toJSON());
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async findOne(
    event: IpcMainEvent,
    where: WhereOptions<Attributes<Audio>>
  ) {
    return Audio.findOne({
      where: {
        ...where,
      },
    })
      .then((audio) => {
        if (!audio) return;

        if (!audio.isSynced) {
          audio.sync().catch(() => {});
        }

        return audio.toJSON();
      })
      .catch((err) => {
        logger.error(err);
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async create(
    event: IpcMainEvent,
    uri: string,
    params: {
      name?: string;
      coverUrl?: string;
      originalText?: string;
    } = {}
  ) {
    let file = uri;
    let source;
    if (uri.startsWith("http")) {
      try {
        if (youtubedr.validateYtURL(uri)) {
          file = await youtubedr.autoDownload(uri);
        } else {
          file = await downloader.download(uri, {
            webContents: event.sender,
          });
        }
        if (!file) throw new Error("Failed to download file");
        source = uri;
      } catch (err) {
        return event.sender.send("on-notification", {
          type: "error",
          message: t("models.audio.failedToDownloadFile", { file: uri }),
        });
      }
    }

    try {
      const audio = await Audio.buildFromLocalFile(file, {
        source,
        name: params.name,
        coverUrl: params.coverUrl,
      });

      // create transcription if originalText is provided
      const { originalText } = params;
      if (originalText) {
        await Transcription.create({
          targetType: "Audio",
          targetId: audio.id,
          targetMd5: audio.md5,
          result: {
            originalText,
          },
        });
      }

      return audio.toJSON();
    } catch (err) {
      return event.sender.send("on-notification", {
        type: "error",
        message: t("models.audio.failedToAdd", { error: err.message }),
      });
    }
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Audio>
  ) {
    const { name, description, metadata } = params;

    return Audio.findOne({
      where: { id },
    })
      .then((audio) => {
        if (!audio) {
          throw new Error(t("models.audio.notFound"));
        }
        audio.update({ name, description, metadata });
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return Audio.findOne({
      where: { id },
    }).then((audio) => {
      if (!audio) {
        event.sender.send("on-notification", {
          type: "error",
          message: t("models.audio.notFound"),
        });
      }
      audio.destroy();
    });
  }

  private async upload(event: IpcMainEvent, id: string) {
    const audio = await Audio.findOne({
      where: { id },
    });
    if (!audio) {
      event.sender.send("on-notification", {
        type: "error",
        message: t("models.audio.notFound"),
      });
    }

    audio
      .upload()
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

  private async crop(
    _event: IpcMainEvent,
    id: string,
    params: { startTime: number; endTime: number }
  ) {
    const audio = await Audio.findOne({
      where: { id },
    });
    if (!audio) {
      throw new Error(t("models.audio.notFound"));
    }

    const { startTime, endTime } = params;
    const output = await audio.crop({ startTime, endTime });

    return pathToEnjoyUrl(output);
  }

  register() {
    ipcMain.handle("audios-find-all", this.findAll);
    ipcMain.handle("audios-find-one", this.findOne);
    ipcMain.handle("audios-create", this.create);
    ipcMain.handle("audios-update", this.update);
    ipcMain.handle("audios-destroy", this.destroy);
    ipcMain.handle("audios-upload", this.upload);
    ipcMain.handle("audios-crop", this.crop);
  }
}

export const audiosHandler = new AudiosHandler();
