import { IpcMainEvent } from "electron";
import { Video, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@/main/services/downloader";
import log from "@/main/services/logger";
import { t } from "i18next";
import youtubedr from "@/main/services/youtubedr";
import { pathToEnjoyUrl } from "@main/utils";
import { BaseHandler, HandlerMethod } from "./base-handler";

const logger = log.scope("db/handlers/videos-handler");

class VideosHandler extends BaseHandler {
  protected prefix = "videos";
  protected handlers: Record<string, HandlerMethod> = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
    upload: this.upload.bind(this),
    crop: this.crop.bind(this),
    "clean-up": this.cleanUp.bind(this),
  };

  private async findAll(
    event: IpcMainEvent,
    options: FindOptions<Attributes<Video>> & { query?: string }
  ) {
    return this.handleRequest(event, async () => {
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
    });
  }

  private async findOne(
    event: IpcMainEvent,
    where: WhereOptions<Attributes<Video>>
  ) {
    return this.handleRequest(event, async () => {
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
    });
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
    return this.handleRequest(event, async () => {
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
          throw new Error(
            t("models.video.failedToDownloadFile", { file: uri })
          );
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
          throw new Error(
            t("models.video.failedToAdd", { error: err.message })
          );
        });
    });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Video>
  ) {
    return this.handleRequest(event, async () => {
      const { name, description, metadata, language, coverUrl, source } =
        params;

      const video = await Video.findByPk(id);
      if (!video) {
        throw new Error(t("models.video.notFound"));
      }
      video.update({ name, description, metadata, language, coverUrl, source });
    });
  }

  private async destroy(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const video = await Video.findByPk(id);
      if (!video) {
        throw new Error(t("models.video.notFound"));
      }
      return await video.destroy();
    });
  }

  private async upload(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const video = await Video.findByPk(id);
      if (!video) {
        throw new Error(t("models.video.notFound"));
      }
      return video
        .upload()
        .then((res) => {
          return res;
        })
        .catch((err) => {
          logger.error(err);
          throw err;
        });
    });
  }

  private async crop(
    event: IpcMainEvent,
    id: string,
    params: { startTime: number; endTime: number }
  ) {
    return this.handleRequest(event, async () => {
      const video = await Video.findOne({
        where: { id },
      });
      if (!video) {
        throw new Error(t("models.video.notFound"));
      }

      const { startTime, endTime } = params;
      const output = await video.crop({ startTime, endTime });

      return pathToEnjoyUrl(output);
    });
  }

  private async cleanUp(event: IpcMainEvent) {
    return this.handleRequest(event, async () => {
      const videos = await Video.findAll();

      for (const video of videos) {
        if (!video.src) {
          video.destroy();
        }
      }
    });
  }
}

export const videosHandler = new VideosHandler();
