import { ipcMain, IpcMainEvent } from "electron";
import { Video, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@main/downloader";
import log from "@main/logger";
import { t } from "i18next";
import youtubedr from "@main/youtubedr";
import { pathToEnjoyUrl } from "@main/utils";

const logger = log.scope("db/handlers/videos-handler");

class VideosHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Video>> & { query?: string }
  ) {
    const { query, where = {} } = options || {};
    delete options.query;
    delete options.where;

    if (query) {
      (where as any).name = {
        [Op.like]: `%${query}%`,
      };
    }
    const videos = await Video.findAll({
      order: [["updatedAt", "DESC"]],
      include: [
        {
          association: "transcription",
          model: Transcription,
          where: { targetType: "Video" },
          required: false,
        },
      ],
      where,
      ...options,
      group: ["Video.id"],
    });
    if (!videos) {
      return [];
    }
    return videos.map((video) => video.toJSON());
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Video>>
  ) {
    const video = await Video.findOne({
      where: {
        ...where,
      },
    });
    if (!video) return;

    if (!video.isSynced) {
      video.sync().catch(() => {});
    }

    return video.toJSON();
  }

  private async create(
    event: IpcMainEvent,
    uri: string,
    params: {
      name?: string;
      coverUrl?: string;
      md5?: string;
      compressing?: boolean;
    } = {}
  ) {
    logger.info("Creating video...", { uri, params });
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
        logger.error(err);
        throw new Error(t("models.video.failedToDownloadFile", { file: uri }));
      }
    }

    return Video.buildFromLocalFile(file, {
      source,
      ...params,
    })
      .then((video) => {
        return video.toJSON();
      })
      .catch((err) => {
        logger.error(err);
        throw new Error(t("models.video.failedToAdd", { error: err.message }));
      });
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Video>
  ) {
    const { name, description, metadata, language, coverUrl, source } = params;

    const video = await Video.findByPk(id);
    if (!video) {
      throw new Error(t("models.video.notFound"));
    }
    video.update({ name, description, metadata, language, coverUrl, source });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    const video = await Video.findByPk(id);
    if (!video) {
      throw new Error(t("models.video.notFound"));
    }
    return await video.destroy();
  }

  private async upload(event: IpcMainEvent, id: string) {
    const video = await Video.findByPk(id);
    if (!video) {
      throw new Error(t("models.video.notFound"));
    }
    video
      .upload()
      .then((res) => {
        return res;
      })
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  }

  private async crop(
    _event: IpcMainEvent,
    id: string,
    params: { startTime: number; endTime: number }
  ) {
    const video = await Video.findOne({
      where: { id },
    });
    if (!video) {
      throw new Error(t("models.video.notFound"));
    }

    const { startTime, endTime } = params;
    const output = await video.crop({ startTime, endTime });

    return pathToEnjoyUrl(output);
  }

  private async cleanUp() {
    const videos = await Video.findAll();

    for (const video of videos) {
      if (!video.src) {
        video.destroy();
      }
    }
  }

  register() {
    ipcMain.handle("videos-find-all", this.findAll);
    ipcMain.handle("videos-find-one", this.findOne);
    ipcMain.handle("videos-create", this.create);
    ipcMain.handle("videos-update", this.update);
    ipcMain.handle("videos-destroy", this.destroy);
    ipcMain.handle("videos-upload", this.upload);
    ipcMain.handle("videos-crop", this.crop);
    ipcMain.handle("videos-clean-up", this.cleanUp);
  }

  unregister() {
    ipcMain.removeHandler("videos-find-all");
    ipcMain.removeHandler("videos-find-one");
    ipcMain.removeHandler("videos-create");
    ipcMain.removeHandler("videos-update");
    ipcMain.removeHandler("videos-destroy");
    ipcMain.removeHandler("videos-upload");
    ipcMain.removeHandler("videos-crop");
    ipcMain.removeHandler("videos-clean-up");
  }
}

export const videosHandler = new VideosHandler();
