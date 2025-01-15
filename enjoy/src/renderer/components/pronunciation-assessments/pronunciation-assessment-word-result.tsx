import { t } from "i18next";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  ScrollArea,
  ScrollBar,
} from "@renderer/components/ui";
import { Volume2Icon } from "lucide-react";
import { memo, useEffect, useRef } from "react";

export const PronunciationAssessmentWordResult = (props: {
  src?: string;
  result: PronunciationAssessmentWordResultType;
  errorDisplay?: {
    mispronunciation: boolean;
    omission: boolean;
    insertion: boolean;
    unexpectedBreak: boolean;
    missingBreak: boolean;
    monotone: boolean;
  };
  currentTime?: number;
  onPlayOrigin?: () => void;
}) => {
  const {
    result,
    errorDisplay = {
      mispronunciation: true,
      omission: true,
      insertion: true,
      unexpectedBreak: true,
      missingBreak: true,
      monotone: true,
    },
    currentTime = 0,
    onPlayOrigin,
  } = props;

  const audio = useRef<HTMLAudioElement>(null);

  const WordDisplay = {
    None: <CorrectWordDisplay word={result.word} />,
    Mispronunciation: errorDisplay.mispronunciation ? (
      <MispronunciationWordDisplay word={result.word} />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
    Omission: errorDisplay.omission ? (
      <OmissionWordDisplay word={result.word} />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
    Insertion: errorDisplay.insertion ? (
      <InsertionWordDisplay word={result.word} />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
    UnexpectedBreak: errorDisplay.unexpectedBreak ? (
      <UnexpectedBreakWordDisplay word={result.word} />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
    MissingBreak: errorDisplay ? (
      <MissingBreakWordDisplay />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
    Monotone: errorDisplay ? (
      <MonotoneWordDisplay word={result.word} />
    ) : (
      <CorrectWordDisplay word={result.word} />
    ),
  }[result.pronunciationAssessment.errorType];

  const play = () => {
    if (!audio.current || !props.src) return;

    const { offset, duration } = result;
    if (!offset || !duration) return;

    const startTime = (offset * 1.0) / 1e7;
    const endTime = ((offset + duration) * 1.0) / 1e7;

    audio.current.currentTime = startTime;

    // Add timeupdate listener to stop at the end of the segment
    const handleTimeUpdate = () => {
      if (audio.current.currentTime >= endTime) {
        audio.current.pause();
        audio.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };

    audio.current.addEventListener("timeupdate", handleTimeUpdate);
    audio.current.play();
  };

  useEffect(() => {
    if (!audio.current) {
      audio.current = new Audio(props.src);
    }

    return () => {
      if (audio.current) {
        audio.current.pause();
        audio.current.removeEventListener("timeupdate", () => {});
        audio.current = null;
      }
    };
  }, [props.src]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="text-center mb-3 cursor-pointer">
          <div
            className={`${
              currentTime * 1e7 >= result.offset &&
              currentTime * 1e7 < result.offset + result.duration
                ? "underline"
                : ""
            } underline-offset-4`}
          >
            {WordDisplay}
          </div>
          <div className="mb-1">
            {result.phonemes.map((phoneme, index) => (
              <span
                key={index}
                className={`italic font-code ${scoreColor(
                  phoneme.pronunciationAssessment.accuracyScore
                )}`}
              >
                {phoneme.phoneme}
              </span>
            ))}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent align="start" className="bg-muted">
        <div className="text-sm flex items-center space-x-2 mb-2">
          <span className="font-serif">{t("score")}:</span>
          <span className="font-serif">
            {result.pronunciationAssessment.accuracyScore}
          </span>
        </div>
        <PronunciationAssessmentPhonemeResult result={result} />

        <div className="flex items-center space-x-2">
          <span className="text-sm">{t("myPronunciation")}:</span>
          <Button onClick={play} variant="ghost" size="icon">
            <Volume2Icon className="w-5 h-5" />
          </Button>
        </div>
        {onPlayOrigin && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{t("originalPronunciation")}:</span>
            <Button onClick={onPlayOrigin} variant="ghost" size="icon">
              <Volume2Icon className="w-5 h-5" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const CorrectWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide cursor-pointer">
    {props.word}
  </span>
);

const MispronunciationWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide cursor-pointer bg-yellow-600">
    {props.word}
  </span>
);

const OmissionWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide cursor-pointer bg-gray-600 text-white">
    [{props.word}]
  </span>
);

const InsertionWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide cursor-pointer bg-red-600 text-white line-through">
    {props.word}
  </span>
);

const UnexpectedBreakWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide bg-pink-600 line-through">
    [{props.word}]
  </span>
);

const MissingBreakWordDisplay = () => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide bg-gray-200">
    [ ]
  </span>
);

const MonotoneWordDisplay = (props: { word: string }) => (
  <span className="mx-1 px-2 py-1 text-xl font-serif tracking-wide cursor-pointer bg-purple-600 text-white">
    {props.word}
  </span>
);

const scoreColor = (score: number) => {
  if (!score) return "gray";

  if (score >= 80) return "text-foreground/70";
  if (score >= 60) return "font-bold text-yellow-600";

  return "font-bold text-red-600";
};

export const PronunciationAssessmentPhonemeResult = memo(
  (props: { result: PronunciationAssessmentWordResultType }) => {
    const { result } = props;

    return (
      <ScrollArea className="w-full">
        <div className="w-full flex items-center gap-2">
          {result.phonemes.map((phoneme, index) => (
            <div key={index} className="text-sm text-center">
              <div className="font-bold font-code">{phoneme.phoneme}</div>
              <div
                className={`text-xs font-serif ${scoreColor(
                  phoneme.pronunciationAssessment.accuracyScore
                )}`}
              >
                {phoneme.pronunciationAssessment.accuracyScore}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }
);
