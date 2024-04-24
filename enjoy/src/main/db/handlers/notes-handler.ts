import { ipcMain, IpcMainEvent } from "electron";
import { Note, Segment } from "@main/db/models";

class NotesHandler {
  private async findAll(
    _event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
    }
  ) {
    const notes = await Note.findAll({
      where: {
        targetId: params.targetId,
        targetType: params.targetType,
      },
      order: [["createdAt", "DESC"]],
    });

    return notes.map((note) => note.toJSON());
  }

  private async find(_event: IpcMainEvent, id: string) {
    const note = await Note.findByPk(id);
    return note.toJSON();
  }

  private async update(
    _event: IpcMainEvent,
    id: string,
    params: {
      content: string;
      parameters: any;
    }
  ) {
    const note = await Note.findByPk(id);
    if (!note) {
      throw new Error("Note not found");
    }

    await note.update({
      content: params.content,
      parameters: params.parameters,
    });

    return note.toJSON();
  }

  private async delete(_event: IpcMainEvent, id: string) {
    const note = await Note.findByPk(id);
    if (!note) {
      throw new Error("Note not found");
    }

    note.destroy();
  }

  private async create(
    _event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      content: string;
      parameters: any;
    }
  ) {
    const { targetId, targetType, content, parameters } = params;

    switch (targetType) {
      case "Segment":
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
      parameters,
    });
  }

  register() {
    ipcMain.handle("notes-find-all", this.findAll);
    ipcMain.handle("notes-find", this.find);
    ipcMain.handle("notes-update", this.update);
    ipcMain.handle("notes-delete", this.delete);
    ipcMain.handle("notes-create", this.create);
  }
}

export const notesHandler = new NotesHandler();
