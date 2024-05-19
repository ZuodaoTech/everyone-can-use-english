import { t } from "i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@renderer/components/ui";

export const PronunciationAssessmentWordResult = (props: {
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
  onSeek?: (time: number) => void;
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
    onSeek,
  } = props;

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

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger>
          <div
            onClick={() => {
              onSeek && onSeek(result.offset / 1e7);
            }}
            className="text-center mb-3"
          >
            <div className="mb-1">
              {result.phonemes.map((phoneme, index) => (
                <span
                  key={index}
                  className={`italic ${scoreColor(
                    phoneme.pronunciationAssessment.accuracyScore
                  )}`}
                >
                  {phoneme.phoneme}
                </span>
              ))}
            </div>
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
          </div>
        </TooltipTrigger>

        <TooltipContent>
          {result.phonemes.length > 0 ? (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-serif">{t("score")}:</span>
                <span className="font-serif">
                  {result.pronunciationAssessment.accuracyScore}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                {result.phonemes.map((phoneme, index) => (
                  <div key={index} className="text-center">
                    <div className="font-bold">{phoneme.phoneme}</div>
                    <div className="text-sm font-serif">
                      {phoneme.pronunciationAssessment.accuracyScore}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              {t(
                `models.pronunciationAssessment.errors.${result.pronunciationAssessment.errorType.toLowerCase()}`
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
