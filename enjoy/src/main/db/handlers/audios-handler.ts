import { IpcMainEvent } from "electron";
import { Audio, Transcription } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@/main/services/downloader";
import { t } from "i18next";
import youtubedr from "@/main/services/youtubedr";
import { pathToEnjoyUrl } from "@/main/utils";
import { BaseHandler } from "./base-handler";

class AudiosHandler extends BaseHandler {
  protected prefix = "audios";
  protected handlers = {
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
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Audio>> & { query?: string }
  ) {
    return this.handleRequest(_event, async () => {
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
    });
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Audio>>
  ) {
    return this.handleRequest(_event, async () => {
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
    });
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
    return this.handleRequest(event, async () => {
      this.logger.info("Creating audio...", { uri, params });
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
        this.logger.error(err.message);
        throw err;
      }
    });
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Audio>
  ) {
    return this.handleRequest(_event, async () => {
      const { name, description, metadata, language, coverUrl, source } =
        params;

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
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const audio = await Audio.findByPk(id);

      if (!audio) {
        throw new Error(t("models.audio.notFound"));
      }
      return await audio.destroy();
    });
  }

  private async upload(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const audio = await Audio.findByPk(id);
      if (!audio) {
        throw new Error(t("models.audio.notFound"));
      }

      return await audio.upload();
    });
  }

  private async crop(
    _event: IpcMainEvent,
    id: string,
    params: { startTime: number; endTime: number }
  ) {
    return this.handleRequest(_event, async () => {
      const audio = await Audio.findByPk(id);
      if (!audio) {
        throw new Error(t("models.audio.notFound"));
      }

      const { startTime, endTime } = params;
      const output = await audio.crop({ startTime, endTime });

      return pathToEnjoyUrl(output);
    });
  }

  private async cleanUp(_event: IpcMainEvent) {
    return this.handleRequest(_event, async () => {
      const audios = await Audio.findAll();

      for (const audio of audios) {
        if (!audio.src) {
          audio.destroy();
        }
      }
    });
  }
}

export const audiosHandler = new AudiosHandler();
