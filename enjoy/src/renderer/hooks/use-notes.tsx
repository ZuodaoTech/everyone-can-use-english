import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext, DbProviderContext } from "../context";
import { toast } from "@renderer/components/ui";

export const useNotes = (props: { targetId: string; targetType: string }) => {
  const { targetId, targetType } = props;

  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);

  const [notes, setNotes] = useState<NoteType[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const findNotes = (params?: { offset: number; limit?: number }) => {
    if (!targetId || !targetType) {
      setNotes([]);
      return;
    }

    const { offset = 0, limit = 100 } = params || {};
    if (offset > 0 && !hasMore) return;

    EnjoyApp.notes
      .findAll({
        targetId,
        targetType,
        limit,
        offset,
      })
      .then((foundNotes) => {
        if (offset === 0) {
          setNotes(foundNotes);
        } else {
          setNotes([...notes, ...foundNotes]);
        }
        setHasMore(notes.length === limit);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const createNote = (params: {
    targetId: string;
    targetType: string;
    content: string;
  }) => {
    const { targetId, targetType, content } = params;

    EnjoyApp.notes.create({
      targetId,
      targetType,
      content,
    });
  };

  const onNoteUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (model !== "Note") return;

    if (action === "update") {
      setNotes((notes) => {
        const index = notes.findIndex((n) => n.id === record.id);
        if (index > -1) {
          notes[index] = record;
        }
        return [...notes];
      });
    } else if (action === "destroy") {
      setNotes((notes) => {
        return notes.filter((n) => n.id !== record.id);
      });
    } else if (action === "create") {
      if (record.targetId === targetId && record.targetType === targetType) {
        setNotes((notes) => {
          return [record, ...notes];
        });
      }
    }
  };

  useEffect(() => {
    findNotes();
    addDblistener(onNoteUpdate);

    return () => {
      removeDbListener(onNoteUpdate);
    };
  }, [targetId, targetType]);

  return {
    notes,
    hasMore,
    findNotes,
    createNote,
  };
};
