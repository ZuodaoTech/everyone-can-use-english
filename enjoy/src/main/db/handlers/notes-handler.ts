import { ipcMain, IpcMainEvent } from "electron";
import { Speech } from "@main/db/models";
import fs from "fs-extra";
import path from "path";
import settings from "@main/settings";
import { hashFile } from "@main/utils";

class NotesHandler {
  private async create(
    event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      content: string;
    }
  ) {}

  register() {
    ipcMain.handle("notes-create", this.create);
  }
}

export const notesHandler = new NotesHandler();
