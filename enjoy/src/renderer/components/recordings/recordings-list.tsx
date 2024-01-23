import {
  RecordButton,
  RecordingCard,
  RecordingDetail,
} from "@renderer/components";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@renderer/components/ui";
import { useEffect, useState, useRef, useContext, useReducer } from "react";
import { LoaderIcon, ChevronDownIcon } from "lucide-react";
import { t } from "i18next";
import {
  DbProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { recordingsReducer } from "@renderer/reducers";

export const RecordingsList = (props: {
  targetId: string;
  targetType: "Audio" | "Video";
  referenceId: number;
  referenceText: string;
}) => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { targetId, targetType, referenceId, referenceText } = props;
  const containerRef = useRef<HTMLDivElement>();

  const [recordings, dispatchRecordings] = useReducer(recordingsReducer, []);
  const [selected, setSelected] = useState<RecordingType | null>(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffest] = useState(0);

  const scrollToRecording = (recording: RecordingType) => {
    if (!containerRef.current) return;
    if (!recording) return;

    setTimeout(() => {
      containerRef.current
        .querySelector(`#recording-${recording.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
        } as ScrollIntoViewOptions);
    }, 500);
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
      if ((record as RecordingType).targetId !== targetId) return;
      dispatchRecordings({
        type: "create",
        record,
      });

      scrollToRecording(record);
    }
  };

  const createRecording = async (blob: Blob, duration: number) => {
    if (typeof referenceId !== "number") return;

    EnjoyApp.recordings.create({
      targetId,
      targetType,
      blob: {
        type: blob.type.split(";")[0],
        arrayBuffer: await blob.arrayBuffer(),
      },
      referenceId,
      referenceText,
      duration,
    });
  };

  useEffect(() => {
    addDblistener(onRecordingsUpdate);

    return () => {
      removeDbListener(onRecordingsUpdate);
    };
  }, [recordings]);

  useEffect(() => {
    fetchRecordings();
  }, [targetId, targetType, referenceId]);

  const fetchRecordings = async () => {
    setLoading(true);

    const limit = 10;
    EnjoyApp.recordings
      .findAll({
        limit,
        offset,
        where: { targetId, targetType, referenceId },
      })
      .then((_recordings) => {
        if (_recordings.length === 0) {
          setOffest(-1);
          return;
        }

        if (_recordings.length < limit) {
          setOffest(-1);
        } else {
          setOffest(offset + _recordings.length);
        }

        dispatchRecordings({
          type: "append",
          records: _recordings,
        });

        scrollToRecording(_recordings[0]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div ref={containerRef} className="">
        {offset > -1 && (
          <div className="flex items-center justify-center my-4">
            <Button variant="ghost" onClick={fetchRecordings}>
              {t("loadMore")}
              {loading && (
                <LoaderIcon className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
            </Button>
          </div>
        )}

        <div className="flex flex-col-reverse space-y-4">
          <div className="w-full h-24"></div>
          {recordings.map((recording) => (
            <RecordingCard
              id={`recording-${recording.id}`}
              key={recording.id}
              recording={recording}
              onSelect={() => setSelected(recording)}
            />
          ))}
        </div>

        <div className="z-50 bottom-16 left-1/2 w-0 h-0 absolute flex items-center justify-center">
          {referenceId !== undefined && Boolean(referenceText) && (
            <RecordButton
              disabled={referenceId == undefined || !Boolean(referenceText)}
              onRecordEnd={createRecording}
            />
          )}
        </div>
      </div>

      <Sheet
        open={!!selected}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl shadow-lg"
          displayClose={false}
        >
          <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
            <SheetClose>
              <ChevronDownIcon />
            </SheetClose>
          </SheetHeader>

          <RecordingDetail recording={selected} />
        </SheetContent>
      </Sheet>
    </>
  );
};
