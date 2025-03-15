import { IpcMainEvent } from "electron";
import { Note, Segment } from "@main/db/models";
import { Sequelize } from "sequelize";
import { BaseHandler, HandlerMethod } from "./base-handler";

class NotesHandler extends BaseHandler {
  protected prefix = "notes";
  protected handlers: Record<string, HandlerMethod> = {
    "group-by-target": this.groupByTarget.bind(this),
    "group-by-segment": this.groupBySegment.bind(this),
    "find-all": this.findAll.bind(this),
    find: this.find.bind(this),
    update: this.update.bind(this),
    delete: this.delete.bind(this),
    create: this.create.bind(this),
    sync: this.sync.bind(this),
  };

  private async groupByTarget(
    event: IpcMainEvent,
    params: {
      limit?: number;
      offset?: number;
    }
  ) {
    return this.handleRequest(event, async () => {
      const { limit, offset } = params;

      const notes = await Note.findAll({
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
      });

      return notes.map((note) => note.toJSON());
    });
  }

  private async groupBySegment(
    event: IpcMainEvent,
    targetId: string,
    targetType: string
  ) {
    return this.handleRequest(event, async () => {
      const notes = await Note.findAll({
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
      });

      return notes.map((note) => note.toJSON());
    });
  }

  private async findAll(
    event: IpcMainEvent,
    params: {
      targetId?: string;
      targetType?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    return this.handleRequest(event, async () => {
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
    });
  }

  private async find(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const note = await Note.findByPk(id);
      return note ? note.toJSON() : null;
    });
  }

  private async update(
    event: IpcMainEvent,
    id: string,
    params: {
      content: string;
      parameters: any;
    }
  ) {
    return this.handleRequest(event, async () => {
      const note = await Note.findByPk(id);
      if (!note) {
        throw new Error("Note not found");
      }

      await note.update({
        content: params.content,
        parameters: params.parameters,
      });

      return note.toJSON();
    });
  }

  private async delete(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const note = await Note.findByPk(id);
      if (!note) {
        throw new Error("Note not found");
      }

      await note.destroy();

      return note.toJSON();
    });
  }

  private async create(
    event: IpcMainEvent,
    params: {
      targetId: string;
      targetType: string;
      content: string;
      parameters: any;
    }
  ) {
    return this.handleRequest(event, async () => {
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

      const note = await Note.create({
        targetId,
        targetType,
        content,
        parameters,
      });

      return note.toJSON();
    });
  }

  private async sync(event: IpcMainEvent, id: string) {
    return this.handleRequest(event, async () => {
      const note = await Note.findByPk(id);
      if (!note) {
        throw new Error("Note not found");
      }

      await note.sync();
      return note.toJSON();
    });
  }
}

export const notesHandler = new NotesHandler();
