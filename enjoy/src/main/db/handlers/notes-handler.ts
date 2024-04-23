import { ipcMain, IpcMainEvent } from "electron";
import { Note, Segment } from "@main/db/models";

class NotesHandler {
  private async create(
    _event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      content: string;
    }
  ) {
    const { targetId, targetType, content } = params;

    switch (targetType) {
      case "segment":
        const segment = await Segment.findByPk(targetId);
        if (!segment) {
          throw new Error("Segment not found");
        }
        break;
      default:
        throw new Error("Invalid target");
    }

    return Note.create({
      targetId,
      targetType,
      content,
    });
  }

  register() {
    ipcMain.handle("notes-create", this.create);
  }
}

export const notesHandler = new NotesHandler();
