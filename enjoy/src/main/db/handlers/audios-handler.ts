import { ipcMain, IpcMainEvent } from "electron";
import { Audio, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes } from "sequelize";
import downloader from "@main/downloader";
import log from "electron-log/main";
import { t } from "i18next";
import youtubedr from "@main/youtubedr";

const logger = log.scope("db/handlers/audios-handler");

class AudiosHandler {
  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Audio>>
  ) {
    return Audio.findAll({
      order: [["createdAt", "DESC"]],
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

  private async transcribe(event: IpcMainEvent, id: string) {
    const audio = await Audio.findOne({
      where: {
        id,
      },
    });
    if (!audio) {
      event.sender.send("on-notification", {
        type: "error",
        message: t("models.audio.notFound"),
      });
    }

    const timeout = setTimeout(() => {
      event.sender.send("on-notification", {
        type: "warning",
        message: t("stillTranscribing"),
      });
    }, 1000 * 10);

    audio
      .transcribe()
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      })
      .finally(() => {
        clearTimeout(timeout);
      });
  }

  private async create(
    event: IpcMainEvent,
    uri: string,
    params: {
      name?: string;
      coverUrl?: string;
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

    return Audio.buildFromLocalFile(file, {
      source,
      ...params,
    })
      .then((audio) => {
        return audio.toJSON();
      })
      .catch((err) => {
        return event.sender.send("on-notification", {
          type: "error",
          message: t("models.audio.failedToAdd", { error: err.message }),
        });
      });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Audio>
  ) {
    const { name, description, transcription } = params;

    return Audio.findOne({
      where: { id },
    })
      .then((audio) => {
        if (!audio) {
          throw new Error(t("models.audio.notFound"));
        }
        audio.update({ name, description, transcription });
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

  register() {
    ipcMain.handle("audios-find-all", this.findAll);
    ipcMain.handle("audios-find-one", this.findOne);
    ipcMain.handle("audios-transcribe", this.transcribe);
    ipcMain.handle("audios-create", this.create);
    ipcMain.handle("audios-update", this.update);
    ipcMain.handle("audios-destroy", this.destroy);
    ipcMain.handle("audios-upload", this.upload);
  }
}

export const audiosHandler = new AudiosHandler();
