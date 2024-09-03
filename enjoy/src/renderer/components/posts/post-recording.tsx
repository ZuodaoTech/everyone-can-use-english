import { useEffect, useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import {
  PronunciationAssessmentScoreDetail,
  WavesurferPlayer,
  Sentence,
} from "@renderer/components";

export const PostRecording = (props: {
  recording: RecordingType;
  height?: number;
}) => {
  const { webApi } = useContext(AppSettingsProviderContext);
  const { recording, height = 80 } = props;
  const [segment, setSegment] = useState<SegmentType>(null);

  const fetchSegment = async () => {
    if (segment) return;
    if (!recording.targetId) return;

    webApi
      .segments({
        targetId: recording.targetId,
        targetType: recording.targetType,
        segmentIndex: recording.referenceId,
      })
      .then((res) => {
        if (res.segments.length === 0) return;

        setSegment(res.segments[0]);
      });
  };

  useEffect(() => {
    fetchSegment();
  }, [recording.src]);

  return (
    <div className="w-full">
      <WavesurferPlayer
        height={height}
        id={recording.id}
        src={recording.src}
        className="bg-sky-500/30"
        wavesurferOptions={{
          waveColor: "rgba(0, 0, 0, 0.25)",
          progressColor: "rgba(0, 0, 0, 0.5)",
        }}
        pitchContourOptions={{
          borderColor: "#fb6f92",
          pointBorderColor: "#fb6f92",
          pointBackgroundColor: "#ff8fab",
        }}
      />

      {recording.pronunciationAssessment && (
        <div className="my-2 flex justify-end">
          <PronunciationAssessmentScoreDetail
            assessment={recording.pronunciationAssessment}
          />
        </div>
      )}

      {recording.referenceText && (
        <div className="my-2 bg-muted px-4 py-2 rounded">
          <div className="text-muted-foreground text-center font-serif select-text">
            <Sentence sentence={recording.referenceText} />
          </div>
        </div>
      )}

      {segment?.src && <WavesurferPlayer id={segment.id} src={segment.src} />}
    </div>
  );
};
