import { ipcMain, IpcMainEvent } from "electron";
import { Note, Segment } from "@main/db/models";
import { Sequelize } from "sequelize";

class NotesHandler {
  private async groupByTarget(
    _event: IpcMainEvent,
    params: {
      limit?: number;
      offset?: number;
    }
  ) {
    const { limit, offset } = params;

    return Note.findAll({
      include: [Segment],
      attributes: [
        "targetId",
        "targetType",
        [Sequelize.fn("COUNT", Sequelize.col("note.id")), "count"],
      ],
      group: ["targetId", "targetType"],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    }).then((notes) => notes.map((note) => note.toJSON()));
  }

  private async groupBySegment(
    _event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
    return Note.findAll({
      include: [
        {
          model: Segment,
          as: "segment",
          attributes: ["id", "segmentIndex"],
        },
      ],
      attributes: [
        "targetId",
        "targetType",
        [Sequelize.fn("COUNT", Sequelize.col("note.id")), "count"],
      ],
      group: ["targetId", "targetType"],
      where: {
        "$segment.target_id$": targetId,
        "$segment.target_type$": targetType,
      },
    }).then((notes) => notes.map((note) => note.toJSON()));
  }

  private async findAll(
    _event: IpcMainEvent,
    params: {
      targetId?: string;
      targetType?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { targetId, targetType, limit, offset } = params;

    const where: any = {};
    if (targetId && targetType) {
      where["targetId"] = targetId;
      where["targetType"] = targetType;
    }

    const notes = await Note.findAll({
      where,
      limit: limit,
      offset: offset,
      include: [Segment],
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

  private async sync(_event: IpcMainEvent, id: string) {
    const note = await Note.findByPk(id);
    if (!note) {
      throw new Error("Note not found");
    }

    await note.sync();
    return note.toJSON();
  }

  register() {
    ipcMain.handle("notes-group-by-target", this.groupByTarget);
    ipcMain.handle("notes-group-by-segment", this.groupBySegment);
    ipcMain.handle("notes-find-all", this.findAll);
    ipcMain.handle("notes-find", this.find);
    ipcMain.handle("notes-update", this.update);
    ipcMain.handle("notes-delete", this.delete);
    ipcMain.handle("notes-create", this.create);
    ipcMain.handle("notes-sync", this.sync);
  }

  unregister() {
    ipcMain.removeHandler("notes-group-by-target");
    ipcMain.removeHandler("notes-group-by-segment");
    ipcMain.removeHandler("notes-find-all");
    ipcMain.removeHandler("notes-find");
    ipcMain.removeHandler("notes-update");
    ipcMain.removeHandler("notes-delete");
    ipcMain.removeHandler("notes-create");
    ipcMain.removeHandler("notes-sync");
  }
}

export const notesHandler = new NotesHandler();
