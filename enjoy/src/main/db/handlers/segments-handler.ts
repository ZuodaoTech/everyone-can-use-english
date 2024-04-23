import { ipcMain, IpcMainEvent } from "electron";
import { Speech } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import settings from "@main/settings";
import { hashFile } from "@main/utils";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";

class SegmentsHandler {
  private async create(
    event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      segmentIndex: number;
      caption: TimelineEntry;
      startTime: number;
      endTime: number;
    }
  ) {}

  register() {
    ipcMain.handle("segments-create", this.create);
  }
}

export const segmentsHandler = new SegmentsHandler();
