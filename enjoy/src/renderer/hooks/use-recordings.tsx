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
  const [hasMore, setHasMore] = useState(true);

  const fetchRecordings = async (offset = 0) => {
    setLoading(true);

    const limit = 10;
    EnjoyApp.recordings
      .findAll({
        limit,
        offset,
        where: {
          targetId: media.id,
          targetType: media.mediaType,
          referenceId,
        },
      })
      .then((_recordings) => {
        if (_recordings.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        dispatchRecordings({
          type: offset === 0 ? "set" : "append",
          records: _recordings,
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

    if (action === "destroy") {
      dispatchRecordings({
        type: "destroy",
        record,
      });
    } else if (action === "create") {
      if ((record as RecordingType).targetId !== media.id) return;
      if ((record as RecordingType).referenceId !== referenceId) return;

      dispatchRecordings({
        type: "create",
        record,
      });
    }
  };

  useEffect(() => {
    addDblistener(onRecordingsUpdate);

    return () => {
      removeDbListener(onRecordingsUpdate);
    };
  }, [recordings]);

  useEffect(() => {
    if (!media) return;

    fetchRecordings(0);
  }, [media, referenceId]);

  return {
    recordings,
    hasMore,
    fetchRecordings,
    loading,
  };
};
