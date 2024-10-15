import { useState, useContext, useEffect, useReducer } from "react";
import {
  AppSettingsProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { recordingsReducer } from "@renderer/reducers";

export const useRecordings = (
  media: AudioType | VideoType,
  referenceId: number
) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const [recordings, dispatchRecordings] = useReducer(recordingsReducer, []);
  const [loading, setLoading] = useState(false);

  const fetchRecordings = async () => {
    setLoading(true);

    EnjoyApp.recordings
      .findAll({
        where: {
          targetId: media.id,
          targetType: media.mediaType,
          referenceId,
        },
      })
      .then((records) => {
        dispatchRecordings({
          type: "set",
          records: records.filter((r) => r.src),
        });

        EnjoyApp.recordings.destroyBulk({
          ids: records.filter((r) => !r.src).map((r) => r.id),
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onRecordingsUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};

    if (model === "PronunciationAssessment" && action === "create") {
      const recording = recordings.find((r) => r.id === record.targetId);
      if (!recording) return;

      recording.pronunciationAssessment = record;
      dispatchRecordings({
        type: "update",
        record: recording,
      });
    }

    if (model != "Recording") return;
    if (record.targetId !== media.id) return;
    if (record.referenceId !== referenceId) return;

    if (action === "destroy") {
      dispatchRecordings({
        type: "destroy",
        record,
      });
    } else if (action === "create") {
      dispatchRecordings({
        type: "create",
        record,
      });
    } else if (action === "update") {
      if (record.isDeleted) {
        dispatchRecordings({
          type: "destroy",
          record,
        });
      } else {
        dispatchRecordings({
          type: "update",
          record,
        });
      }
    }
  };

  useEffect(() => {
    if (!media) return;

    addDblistener(onRecordingsUpdate);

    return () => {
      removeDbListener(onRecordingsUpdate);
    };
  }, [recordings]);

  useEffect(() => {
    if (!media) return;

    fetchRecordings();
  }, [media, referenceId]);

  return {
    recordings,
    fetchRecordings,
    loading,
  };
};
