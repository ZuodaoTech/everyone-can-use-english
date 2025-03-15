import { ipcMain, IpcMainEvent } from "electron";
import { Document } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@main/services/downloader";
import { t } from "i18next";
import { BaseHandler } from "./base-handler";

class DocumentsHandler extends BaseHandler {
  protected prefix = "documents";
  protected handlers = {
    "find-all": this.findAll.bind(this),
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    update: this.update.bind(this),
    destroy: this.destroy.bind(this),
    upload: this.upload.bind(this),
    "clean-up": this.cleanUp.bind(this),
  };

  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Document>> & { query?: string }
  ) {
    return this.handleRequest(_event, async () => {
      const { query, where = {} } = options || {};
      delete options.query;
      delete options.where;

      if (query) {
        (where as any).title = {
          [Op.like]: `%${query}%`,
        };
      }
      const documents = await Document.findAll({
        order: [
          ["lastReadAt", "DESC"],
          ["updatedAt", "DESC"],
        ],
        where,
        ...options,
      });

      if (!documents) {
        return [];
      }
      return documents.map((document) => document.toJSON());
    });
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Document>>
  ) {
    return this.handleRequest(_event, async () => {
      const document = await Document.findOne({
        where: {
          ...where,
        },
      });
      if (!document) return;

      if (!document.isSynced) {
        document.sync().catch(() => {});
      }

      return document.toJSON();
    });
  }

  private async create(
    event: IpcMainEvent,
    params: {
      uri: string;
      title?: string;
      config?: Record<string, any>;
      source?: string;
    }
  ) {
    return this.handleRequest(event, async () => {
      let { uri, title, config, source } = params;
      if (uri.startsWith("http")) {
        uri = await downloader.download(uri, {
          webContents: event.sender,
        });
        if (!uri) throw new Error("Failed to download file");
      }

      const document = await Document.buildFromLocalFile(uri, {
        title,
        config,
        source,
      });

      return document.toJSON();
    });
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Document>
  ) {
    return this.handleRequest(_event, async () => {
      const { title, metadata, lastReadPosition, lastReadAt, config } = params;

      const document = await Document.findByPk(id);

      if (!document) {
        throw new Error(t("models.document.notFound"));
      }
      return await document.update({
        title,
        metadata,
        lastReadPosition,
        lastReadAt,
        config,
      });
    });
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    return this.handleRequest(_event, async () => {
      const document = await Document.findByPk(id);

      if (!document) {
        throw new Error(t("models.document.notFound"));
      }
      return await document.destroy();
    });
  }

  private async upload(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const document = await Document.findByPk(id);
      if (!document) {
        throw new Error(t("models.document.notFound"));
      }

      return await document.upload();
    });
  }

  private async cleanUp(_event: IpcMainEvent) {
    return this.handleRequest(_event, async () => {
      const documents = await Document.findAll();

      for (const document of documents) {
        if (!document.src) {
          document.destroy();
        }
      }
    });
  }
}

export const documentsHandler = new DocumentsHandler();
