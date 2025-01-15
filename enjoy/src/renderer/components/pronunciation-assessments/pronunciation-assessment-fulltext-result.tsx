import { t } from "i18next";
import { useState, useEffect, useCallback } from "react";
import { PronunciationAssessmentWordResult } from "@renderer/components";
import { Switch, ScrollArea } from "@renderer/components/ui";
import { InfoIcon } from "lucide-react";
import { cn } from "@renderer/lib/utils";

export const PronunciationAssessmentFulltextResult = (props: {
  words: PronunciationAssessmentWordResultType[];
  currentTime?: number;
  src?: string;
  onPlayOrigin?: (word: string, index: number) => void;
  className?: string;
}) => {
  const { words, currentTime, src, onPlayOrigin, className } = props;
  const [errorStats, setErrorStats] = useState({
    mispronunciation: 0,
    omission: 0,
    insertion: 0,
    unexpectedBreak: 0,
    missingBreak: 0,
    monotone: 0,
  });
  const [errorDisplay, setErrorDisplay] = useState({
    mispronunciation: true,
    omission: true,
    insertion: true,
    unexpectedBreak: true,
    missingBreak: true,
    monotone: true,
  });

  const handlePlayOrigin = useCallback((word: string, index: number) => {
    if (!onPlayOrigin) return;
    onPlayOrigin(word, index);
  }, []);

  const calErrorStats = () => {
    return {
      mispronunciation: words.filter(
        (w) => w.pronunciationAssessment.errorType === "Mispronunciation"
      ).length,
      omission: words.filter(
        (w) => w.pronunciationAssessment.errorType === "Omission"
      ).length,
      insertion: words.filter(
        (w) => w.pronunciationAssessment.errorType === "Insertion"
      ).length,
      unexpectedBreak: words.filter(
        (w) => w.pronunciationAssessment.errorType === "UnexpectedBreak"
      ).length,
      missingBreak: words.filter(
        (w) => w.pronunciationAssessment.errorType === "MissingBreak"
      ).length,
      monotone: words.filter(
        (w) => w.pronunciationAssessment.errorType === "Monotone"
      ).length,
    };
  };

  useEffect(() => {
    setErrorStats(calErrorStats());
  }, []);

  return (
    <ScrollArea className={cn("min-h-72", className)}>
      <div className="flex items-start justify-between space-x-6">
        <div className="flex-1 py-4 flex items-center flex-wrap">
          {words.map((result, index: number) => (
            <PronunciationAssessmentWordResult
              key={index}
              result={result}
              errorDisplay={errorDisplay}
              currentTime={currentTime}
              src={src}
              onPlayOrigin={() => {
                // if (!onPlayOrigin) return;

                const word = words[index];
                const candidates = words.filter((w) => w.word === word.word);
                const wordIndex = candidates.findIndex(
                  (w) => w.offset === word.offset
                );
                handlePlayOrigin(word.word, wordIndex);
              }}
            />
          ))}
        </div>

        <div className="">
          <div className="font-bold mb-4">{t("errors")}</div>

          <div className="flex items-center justify-between space-x-6 mb-2 min-w-[12rem]">
            <div className="flex items-center">
              <span className="bg-yellow-600 text-sm px-1">
                {errorStats.mispronunciation}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.misspronunciation")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.misspronunciation"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.mispronunciation}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    mispronunciation: !errorDisplay.mispronunciation,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-6 mb-2">
            <div className="flex items-center">
              <span className="bg-gray-600 text-sm text-white px-1">
                {errorStats.omission}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.omission")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.omission"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.omission}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    omission: !errorDisplay.omission,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-6 mb-2">
            <div className="flex items-center">
              <span className="bg-red-600 text-sm text-white px-1">
                {errorStats.insertion}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.insertion")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.insertion"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.insertion}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    insertion: !errorDisplay.insertion,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-6 mb-2">
            <div className="flex items-center">
              <span className="bg-pink-600 text-sm text-white px-1">
                {errorStats.unexpectedBreak}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.unexpectedBreak")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.unexpectedBreak"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.unexpectedBreak}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    unexpectedBreak: !errorDisplay.unexpectedBreak,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-6 mb-2">
            <div className="flex items-center">
              <span className="bg-gray-200 text-sm px-1">
                {errorStats.missingBreak}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.missingBreak")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.missingBreak"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.missingBreak}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    missingBreak: !errorDisplay.missingBreak,
                  });
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-6 mb-2">
            <div className="flex items-center">
              <span className="bg-purple-600 text-sm text-white px-1">
                {errorStats.monotone}
              </span>
              <span className="ml-2">
                {t("models.pronunciationAssessment.errors.monotone")}
              </span>
              <InfoIcon
                data-tooltip-id="recording-tooltip"
                data-tooltip-content={t(
                  "models.pronunciationAssessment.explainations.monotone"
                )}
                className="inline w-3 h-3 cursor-pointer ml-2"
              />
            </div>
            <div className="">
              <Switch
                checked={errorDisplay.monotone}
                onClick={() => {
                  setErrorDisplay({
                    ...errorDisplay,
                    monotone: !errorDisplay.monotone,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
