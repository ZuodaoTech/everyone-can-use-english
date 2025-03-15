import { IpcMainEvent } from "electron";
import { Audio, Segment, Video } from "@main/db/models";
import { BaseHandler, HandlerMethod } from "./base-handler";

class SegmentsHandler extends BaseHandler {
  protected prefix = "segments";
  protected handlers: Record<string, HandlerMethod> = {
    create: this.create.bind(this),
    find: this.find.bind(this),
    "find-all": this.findAll.bind(this),
    sync: this.sync.bind(this),
  };

  private async find(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const segment = await Segment.findByPk(id);
      return segment.toJSON();
    });
  }

  private async findAll(
    event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      segmentIndex: number;
    }
  ) {
    return this.handleRequest(event, async () => {
      const { targetId, targetType, segmentIndex } = params;
      const segments = await Segment.findAll({
        where: {
          targetId,
          targetType,
          segmentIndex,
        },
        include: [Audio, Video],
      });

      return segments.map((segment) => segment.toJSON());
    });
  }

  private async create(
    event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      segmentIndex: number;
    }
  ) {
    return this.handleRequest(event, async () => {
      const segment = await Segment.generate({
        targetId: params.targetId,
        targetType: params.targetType,
        segmentIndex: params.segmentIndex,
      });
      return segment.toJSON();
    });
  }

  private async sync(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const segment = await Segment.findByPk(id);
      await segment.sync();
      await segment.upload();
      return segment.toJSON();
    });
  }
}

export const segmentsHandler = new SegmentsHandler();
