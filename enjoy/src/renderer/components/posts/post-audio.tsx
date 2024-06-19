import { useEffect, useState, useContext, useRef } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Button } from "@renderer/components/ui";
import { STORAGE_WORKER_ENDPOINTS } from "@/constants";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { t } from "i18next";
import { XCircleIcon } from "lucide-react";
import { UniversalPlayer, WavesurferPlayer } from "@renderer/components";

export const PostAudio = (props: {
  audio: Partial<MediumType>;
  height?: number;
}) => {
  const { audio, height = 80 } = props;
  const [currentTime, setCurrentTime] = useState<number>(0);
  const { webApi } = useContext(AppSettingsProviderContext);
  const [transcription, setTranscription] = useState<TranscriptionType>();
  const [error, setError] = useState<string>(null);

  const currentTranscription = transcription?.result["transcript"]
    ? (transcription.result?.timeline || []).find(
        (s: TimelineEntry) =>
          currentTime >= s.startTime && currentTime <= s.endTime
      )
    : (transcription?.result || []).find(
        (s: TranscriptionResultSegmentType) =>
          currentTime >= s.offsets.from / 1000.0 &&
          currentTime <= s.offsets.to / 1000.0
      );

  useEffect(() => {
    webApi
      .transcriptions({
        targetMd5: audio.md5,
      })
      .then((response) => {
        const transcription = response?.transcriptions?.[0];
        if (transcription.targetMd5 !== audio.md5) return;
        setTranscription(response?.transcriptions?.[0]);
      });
  }, [audio.md5]);

  if (error) {
    return (
      <div className="w-full rounded-lg p-4 border">
        <div className="flex items-center justify-center mb-2">
          <XCircleIcon className="w-4 h-4 text-destructive" />
        </div>
        <div className="select-text break-all text-center text-sm text-muted-foreground mb-4">
          {error}
        </div>
        <div className="flex items-center justify-center">
          <Button onClick={() => setError(null)}>{t("retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {audio.sourceUrl.match(
        new RegExp("^(" + STORAGE_WORKER_ENDPOINTS.join("|") + ")")
      ) ? (
        <WavesurferPlayer
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          id={audio.id}
          src={audio.sourceUrl}
          height={height}
          onError={(err) => setError(err.message)}
        />
      ) : (
        <UniversalPlayer
          src={audio.sourceUrl}
          onTimeUpdate={(time) => {
            setCurrentTime(time);
          }}
          onError={(err) => setError(err.message)}
        />
      )}

      {currentTranscription && (
        <div className="mt-2 bg-muted px-4 py-2 rounded">
          <div className="text-muted-foreground text-center font-serif">
            {currentTranscription.text}
          </div>
        </div>
      )}

      {audio.coverUrl && (
        <div className="mt-2">
          <img src={audio.coverUrl} className="w-full rounded" />
        </div>
      )}
    </div>
  );
};
