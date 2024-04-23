import { ipcMain, IpcMainEvent } from "electron";
import { Segment, Speech } from "@main/db/models";

class SegmentsHandler {
  private async create(
    _event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      segmentIndex: number;
    }
  ) {
    return Segment.generate({
      targetId: params.targetId,
      targetType: params.targetType,
      segmentIndex: params.segmentIndex,
    });
  }

  register() {
    ipcMain.handle("segments-create", this.create);
  }
}

export const segmentsHandler = new SegmentsHandler();