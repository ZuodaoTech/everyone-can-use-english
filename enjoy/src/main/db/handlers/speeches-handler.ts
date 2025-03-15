import { IpcMainEvent } from "electron";
import { Speech } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import { config } from "@main/config";
import { hashFile } from "@main/utils";
import { Attributes, WhereOptions } from "sequelize";
import { BaseHandler, HandlerMethod } from "./base-handler";

class SpeechesHandler extends BaseHandler {
  protected prefix = "speeches";
  protected handlers: Record<string, HandlerMethod> = {
    "find-one": this.findOne.bind(this),
    create: this.create.bind(this),
    delete: this.delete.bind(this),
  };

  private async findOne(
    event: IpcMainEvent,
    where: WhereOptions<Attributes<Speech>>
  ) {
    return this.handleRequest(event, async () => {
      const speech = await Speech.findOne({ where });
      if (!speech) {
        return null;
      }

      return speech.toJSON();
    });
  }

  private async create(
    event: IpcMainEvent,
    params: {
      sourceId: string;
      sourceType: string;
      text: string;
      section?: number;
      segment?: number;
      configuration: {
        engine: string;
        model: string;
        voice: string;
      };
    },
    blob: {
      type: string;
      arrayBuffer: ArrayBuffer;
    }
  ) {
    return this.handleRequest(event, async () => {
      const format = blob.type.split("/")[1];
      const filename = `${Date.now()}.${format}`;
      const file = path.join(config.userDataPath(), "speeches", filename);
      await fs.outputFile(file, Buffer.from(blob.arrayBuffer));
      const md5 = await hashFile(file, { algo: "md5" });
      fs.renameSync(file, path.join(path.dirname(file), `${md5}.${format}`));

      const speech = await Speech.create({
        ...params,
        extname: `.${format}`,
        md5,
      });

      return speech.toJSON();
    });
  }

  private async delete(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      await Speech.destroy({ where: { id } });

      return true;
    });
  }
}

export const speechesHandler = new SpeechesHandler();
