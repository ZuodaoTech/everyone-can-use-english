import { useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
  DictProviderContext,
} from "@renderer/context";
import { TabsContent, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { convertWordIpaToNormal } from "@/utils";
import {
  CamdictLookupResult,
  DictLookupResult,
  AiLookupResult,
  TranslateResult,
  DictSelect,
  VocabularyPronunciationAssessment,
} from "@renderer/components";

/*
 * Translation tab content.
 */
export function MediaCaptionTranslation(props: {
  caption: TimelineEntry;
  selectedIndices: number[];
}) {
  const { caption } = props;

  return (
    <TabsContent value="translation">
      <SelectedWords {...props} />
      <Separator className="my-4" />
      <div className="text-sm italic text-muted-foreground mb-2">
        {t("translateSentence")}
      </div>
      <TranslateResult text={caption.text} />
    </TabsContent>
  );
}

const SelectedWords = (props: {
  caption: TimelineEntry;
  selectedIndices: number[];
}) => {
  const { selectedIndices, caption } = props;

  const { currentDictValue } = useContext(DictProviderContext);
  const { transcription } = useContext(MediaShadowProviderContext);
  const { learningLanguage, ipaMappings } = useContext(
    AppSettingsProviderContext
  );

  const word = selectedIndices
    .map((index) => caption.timeline[index]?.text || "")
    .join(" ")
    .trim();

  if (selectedIndices.length === 0)
    return (
      <div className="text-sm text-muted-foreground py-4">
        {t("clickAnyWordToSelect")}
      </div>
    );

  return (
    <>
      <div className="flex justify-between items-start flex-wrap">
        <div className="flex flex-1 flex-wrap items-center space-x-2 select-text mb-4">
          {selectedIndices.map((index, i) => {
            const word = caption.timeline[index];
            if (!word) return;
            return (
              <div key={index}>
                <div className="font-serif text-lg font-semibold tracking-tight">
                  {word.text}
                </div>
                {word.timeline.length > 0 && (
                  <div className="text-sm text-serif text-muted-foreground">
                    <span
                      className={`mr-2 font-code ${
                        i === 0 ? "before:content-['/']" : ""
                      }
                        ${
                          i === selectedIndices.length - 1
                            ? "after:content-['/']"
                            : ""
                        }`}
                    >
                      {word.timeline
                        .map((t) =>
                          learningLanguage.startsWith("en")
                            ? convertWordIpaToNormal(
                                t.timeline.map((s) => s.text),
                                {
                                  mappings: ipaMappings,
                                }
                              ).join("")
                            : t.text
                        )
                        .join(" ")}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-60">
          <DictSelect />
        </div>
      </div>

      <VocabularyPronunciationAssessment word={word} />

      <Separator className="my-4" />

      <div className="rounded-lg overflow-hidden mr-10">
        {currentDictValue === "cambridge" ? (
          <CamdictLookupResult word={word} />
        ) : currentDictValue === "ai" ? (
          <AiLookupResult
            word={word}
            context={caption.text}
            sourceId={transcription.targetId}
            sourceType={transcription.targetType}
          />
        ) : (
          <DictLookupResult word={word} autoHeight={true} />
        )}
      </div>
    </>
  );
};
