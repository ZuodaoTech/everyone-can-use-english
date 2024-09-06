import { ipcMain, IpcMainEvent } from "electron";
import { Transcription, Audio, Video } from "@main/db/models";
import { Attributes } from "sequelize";
import log from "@main/logger";

const logger = log.scope("db/handlers/transcriptions-handler");
class TranscriptionsHandler {
  private async findOrCreate(_event: IpcMainEvent, where: Transcription) {
    try {
      const { targetType, targetId } = where;
      let target: Video | Audio = null;
      if (targetType === "Video") {
        target = await Video.findByPk(targetId);
      } else if (targetType === "Audio") {
        target = await Audio.findByPk(targetId);
      } else {
        throw new Error("models.transcription.invalidTargetType");
      }

      const [transcription, _created] = await Transcription.findOrCreate({
        where: {
          targetId,
          targetType,
        },
        defaults: {
          targetId,
          targetType,
          targetMd5: target.md5,
        },
      });

      return transcription.toJSON();
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Transcription>
  ) {
    const { result, engine, model, state, language } = params;

    const transcription = await Transcription.findByPk(id);
    if (!transcription) {
      throw new Error("models.transcription.notFound");
    }
    return await transcription.update({
      result,
      engine,
      model,
      state,
      language,
    });
  }

  register() {
    ipcMain.handle("transcriptions-find-or-create", this.findOrCreate);
    ipcMain.handle("transcriptions-update", this.update);
  }

  unregister() {
    ipcMain.removeHandler("transcriptions-find-or-create");
    ipcMain.removeHandler("transcriptions-update");
  }
}

export const transcriptionsHandler = new TranscriptionsHandler();
