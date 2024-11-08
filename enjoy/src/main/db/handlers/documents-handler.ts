import { ipcMain, IpcMainEvent } from "electron";
import { Document } from "@main/db/models";
import { FindOptions, WhereOptions, Attributes, Op } from "sequelize";
import downloader from "@main/downloader";
import log from "@main/logger";
import { t } from "i18next";

const logger = log.scope("db/handlers/documents-handler");

class DocumentsHandler {
  private async findAll(
    _event: IpcMainEvent,
    options: FindOptions<Attributes<Document>> & { query?: string }
  ) {
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
  }

  private async findOne(
    _event: IpcMainEvent,
    where: WhereOptions<Attributes<Document>>
  ) {
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
    let { uri, title, config, source } = params;
    if (uri.startsWith("http")) {
      uri = await downloader.download(uri, {
        webContents: event.sender,
      });
      if (!uri) throw new Error("Failed to download file");
    }

    try {
      const document = await Document.buildFromLocalFile(uri, {
        title,
        config,
        source,
      });

      return document.toJSON();
    } catch (err) {
      logger.error(err.message);
      throw err;
    }
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: Attributes<Document>
  ) {
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
  }

  private async destroy(_event: IpcMainEvent, id: string) {
    const document = await Document.findByPk(id);

    if (!document) {
      throw new Error(t("models.document.notFound"));
    }
    return await document.destroy();
  }

  private async upload(event: IpcMainEvent, id: string) {
    const document = await Document.findByPk(id);
    if (!document) {
      throw new Error(t("models.document.notFound"));
    }

    return await document.upload();
  }

  private async cleanUp() {
    const documents = await Document.findAll();

    for (const document of documents) {
      if (!document.src) {
        document.destroy();
      }
    }
  }

  register() {
    ipcMain.handle("documents-find-all", this.findAll);
    ipcMain.handle("documents-find-one", this.findOne);
    ipcMain.handle("documents-create", this.create);
    ipcMain.handle("documents-update", this.update);
    ipcMain.handle("documents-destroy", this.destroy);
    ipcMain.handle("documents-upload", this.upload);
    ipcMain.handle("documents-clean-up", this.cleanUp);
  }

  unregister() {
    ipcMain.removeHandler("documents-find-all");
    ipcMain.removeHandler("documents-find-one");
    ipcMain.removeHandler("documents-create");
    ipcMain.removeHandler("documents-update");
    ipcMain.removeHandler("documents-destroy");
    ipcMain.removeHandler("documents-upload");
    ipcMain.removeHandler("documents-clean-up");
  }
}

export const documentsHandler = new DocumentsHandler();
