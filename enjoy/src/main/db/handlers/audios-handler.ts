import { ipcMain, IpcMainEvent } from "electron";
import { Audio, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@main/downloader";
import log from "@main/logger";
import { t } from "i18next";
import youtubedr from "@main/youtubedr";
import { pathToEnjoyUrl } from "@/main/utils";

const logger = log.scope("db/handlers/audios-handler");

class AudiosHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Audio>> & { query?: string }
  ) {
    const { query, where = {} } = options || {};
    delete options.query;
    delete options.where;

    if (query) {
      (where as any).name = {
        [Op.like]: `%${query}%`,
      };
    }
    const audios = await Audio.findAll({
      order: [["updatedAt", "DESC"]],
      include: [
        {
          association: "transcription",
          model: Transcription,
          where: { targetType: "Audio" },
          required: false,
        },
      ],
      where,
      ...options,
      group: ["Audio.id"],
    });

    if (!audios) {
      return [];
    }
    return audios.map((audio) => audio.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Audio>>
  ) {
    const audio = await Audio.findOne({
      where: {
        ...where,
      },
    });
    if (!audio) return;

    if (!audio.isSynced) {
      audio.sync().catch(() => {});
    }

    return audio.toJSON();
  }

  private async create(
    event: IpcMainEvent,
    uri: string,
    params: {
      name?: string;
      coverUrl?: string;
      originalText?: string;
      compressing?: boolean;
    } = {}
  ) {
    logger.info("Creating audio...", { uri, params });
    let file = uri;
    let source;
    if (uri.startsWith("http")) {
      if (youtubedr.validateYtURL(uri)) {
        file = await youtubedr.autoDownload(uri);
      } else {
        file = await downloader.download(uri, {
          webContents: event.sender,
        });
      }
      if (!file) throw new Error("Failed to download file");
      source = uri;
    }

    try {
      const audio = await Audio.buildFromLocalFile(file, {
        source,
        name: params.name,
        coverUrl: params.coverUrl,
        compressing: params.compressing,
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
      logger.error(err.message);
      throw err;
    }
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Audio>
  ) {
    const { name, description, metadata, language, coverUrl, source } = params;

    const audio = await Audio.findByPk(id);

    if (!audio) {
      throw new Error(t("models.audio.notFound"));
    }
    return await audio.update({
      name,
      description,
      metadata,
      language,
      coverUrl,
      source,
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const audio = await Audio.findByPk(id);

    if (!audio) {
      throw new Error(t("models.audio.notFound"));
    }
    return await audio.destroy();
  }

  private async upload(event: IpcMainEvent, id: string) {
    const audio = await Audio.findByPk(id);
    if (!audio) {
      throw new Error(t("models.audio.notFound"));
    }

    return await audio.upload();
  }

  private async crop(
    _event: IpcMainEvent,
    id: string,
    params: { startTime: number; endTime: number }
  ) {
    const audio = await Audio.findByPk(id);
    if (!audio) {
      throw new Error(t("models.audio.notFound"));
    }

    const { startTime, endTime } = params;
    const output = await audio.crop({ startTime, endTime });

    return pathToEnjoyUrl(output);
  }

  private async cleanUp() {
    const audios = await Audio.findAll();

    for (const audio of audios) {
      if (!audio.src) {
        audio.destroy();
      }
    }
  }

  register() {
    ipcMain.handle("audios-find-all", this.findAll);
    ipcMain.handle("audios-find-one", this.findOne);
    ipcMain.handle("audios-create", this.create);
    ipcMain.handle("audios-update", this.update);
    ipcMain.handle("audios-destroy", this.destroy);
    ipcMain.handle("audios-upload", this.upload);
    ipcMain.handle("audios-crop", this.crop);
    ipcMain.handle("audios-clean-up", this.cleanUp);
  }

  unregister() {
    ipcMain.removeHandler("audios-find-all");
    ipcMain.removeHandler("audios-find-one");
    ipcMain.removeHandler("audios-create");
    ipcMain.removeHandler("audios-update");
    ipcMain.removeHandler("audios-destroy");
    ipcMain.removeHandler("audios-upload");
    ipcMain.removeHandler("audios-crop");
    ipcMain.removeHandler("audios-clean-up");
  }
}

export const audiosHandler = new AudiosHandler();
