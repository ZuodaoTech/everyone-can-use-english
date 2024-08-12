import {
  RecordingPlayer,
  PronunciationAssessmentFulltextResult,
  PronunciationAssessmentScoreResult,
} from "@renderer/components";
import { Separator, ScrollArea, toast } from "@renderer/components/ui";
import { useState, useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Tooltip } from "react-tooltip";
import { usePronunciationAssessments } from "@renderer/hooks";

export const RecordingDetail = (props: {
  recording: RecordingType;
  pronunciationAssessment?: PronunciationAssessmentType;
  onAssess?: (assessment: PronunciationAssessmentType) => void;
}) => {
  const { recording, onAssess } = props;
  if (!recording) return;

  const [pronunciationAssessment, setPronunciationAssessment] =
    useState<PronunciationAssessmentType>(
      props.pronunciationAssessment || recording.pronunciationAssessment
    );
  const { result } = pronunciationAssessment || {};
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seek, setSeek] = useState<{
    seekTo: number;
    timestamp: number;
  }>();
  const [isPlaying, setIsPlaying] = useState(false);

  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const { createAssessment } = usePronunciationAssessments();
  const [assessing, setAssessing] = useState(false);

  const assess = () => {
    if (assessing) return;
    if (result) return;

    setAssessing(true);
    createAssessment({
      recording,
      reference: recording.referenceText || "",
      language: recording.language || learningLanguage,
    })
      .then((assessment) => {
        onAssess && onAssess(assessment);
        setPronunciationAssessment(assessment);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setAssessing(false);
      });
  };

  useEffect(() => {
    assess();
  }, [recording]);

  return (
    <div className="">
      <div className="mb-6 px-4">
        <RecordingPlayer
          recording={recording}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onCurrentTimeChange={(time) => setCurrentTime(time)}
          seek={seek}
        />
      </div>

      <Separator />

      {result ? (
        <PronunciationAssessmentFulltextResult
          words={result.words}
          currentTime={currentTime}
          onSeek={(time) => {
            setSeek({
              seekTo: time,
              timestamp: Date.now(),
            });
            setIsPlaying(true);
          }}
        />
      ) : (
        <ScrollArea className="min-h-72 py-4 px-8 select-text">
          {(recording?.referenceText || "").split("\n").map((line, index) => (
            <div key={index} className="text-xl font-serif tracking-wide mb-2">
              {line}
            </div>
          ))}
        </ScrollArea>
      )}

      <Separator />

      <PronunciationAssessmentScoreResult
        pronunciationScore={pronunciationAssessment?.pronunciationScore}
        accuracyScore={pronunciationAssessment?.accuracyScore}
        fluencyScore={pronunciationAssessment?.fluencyScore}
        completenessScore={pronunciationAssessment?.completenessScore}
        prosodyScore={pronunciationAssessment?.prosodyScore}
        assessing={assessing}
        onAssess={assess}
      />

      <Tooltip id="recording-tooltip" />
    </div>
  );
};
