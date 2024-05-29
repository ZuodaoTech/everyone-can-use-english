import {
  RecordingPlayer,
  PronunciationAssessmentFulltextResult,
  PronunciationAssessmentScoreResult,
} from "@renderer/components";
import { Separator, ScrollArea } from "@renderer/components/ui";
import { useState, useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { Tooltip } from "react-tooltip";

export const RecordingDetail = (props: { recording: RecordingType }) => {
  const { recording } = props;
  if (!recording) return;

  const { pronunciationAssessment } = recording;
  const { result } = pronunciationAssessment || {};
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [seek, setSeek] = useState<{
    seekTo: number;
    timestamp: number;
  }>();
  const [isPlaying, setIsPlaying] = useState(false);

  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const [assessing, setAssessing] = useState(false);

  const assess = () => {
    setAssessing(true);
    EnjoyApp.recordings.assess(recording.id, learningLanguage).finally(() => {
      setAssessing(false);
    });
  };

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
        <ScrollArea className="h-72 py-4 px-8 select-text">
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
