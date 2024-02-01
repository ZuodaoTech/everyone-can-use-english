import { ipcMain, IpcMainEvent } from "electron";
import { Speech } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import settings from "@main/settings";
import { hashFile } from "@/utils";

class SpeechesHandler {
  private async create(
    event: IpcMainEvent,
    params: {
      sourceId: string;
      sourceType: string;
      text: string;
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
    const extname = blob.type.split("/")[1];
    const filename = `${Date.now()}.${extname}`;
    const file = path.join(settings.userDataPath(), "speeches", filename);
    await fs.outputFile(file, Buffer.from(blob.arrayBuffer));
    const md5 = await hashFile(file, { algo: "md5" });
    fs.renameSync(file, path.join(path.dirname(file), `${md5}${extname}`));

    return Speech.create({ ...params, extname, md5 })
      .then((speech) => {
        return speech.toJSON();
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  register() {
    ipcMain.handle("speeches-create", this.create);
  }
}

export const speechesHandler = new SpeechesHandler();
