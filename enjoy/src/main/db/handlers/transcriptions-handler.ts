import { IpcMainEvent } from "electron";
import { Transcription, Audio, Video } from "@main/db/models";
import { Attributes } from "sequelize";
import log from "@/main/services/logger";
import { BaseHandler, HandlerMethod } from "./base-handler";

const logger = log.scope("db/handlers/transcriptions-handler");

class TranscriptionsHandler extends BaseHandler {
  protected prefix = "transcriptions";
  protected handlers: Record<string, HandlerMethod> = {
    "find-or-create": this.findOrCreate.bind(this),
    update: this.update.bind(this),
  };

  private async findOrCreate(event: IpcMainEvent, where: Transcription) {
    return this.handleRequest(event, async () => {
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
    });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: Attributes<Transcription>
  ) {
    return this.handleRequest(event, async () => {
      const { result, engine, model, state, language } = params;

      const transcription = await Transcription.findByPk(id);
      if (!transcription) {
        throw new Error("models.transcription.notFound");
      }
      await transcription.update({
        result,
        engine,
        model,
        state,
        language,
      });

      return transcription.toJSON();
    });
  }
}

export const transcriptionsHandler = new TranscriptionsHandler();
