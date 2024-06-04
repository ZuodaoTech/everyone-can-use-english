import { useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { TabsContent, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { convertWordIpaToNormal } from "@/utils";
import {
  CamdictLookupResult,
  AiLookupResult,
  TranslateResult,
} from "@renderer/components";

/*
 * Translation tab content.
 */
export function TabContentTranslation(props: {
  caption: TimelineEntry;
  selectedIndices: number[];
}) {
  const { caption } = props;

  return (
    <TabsContent value="translation">
      <SelectedWords {...props} />
      <Separator className="my-2" />
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

  const { transcription, ipaMappings } = useContext(MediaPlayerProviderContext);
  const { learningLanguage } = useContext(AppSettingsProviderContext);

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
      <div className="flex flex-wrap items-center space-x-2 select-text mb-4">
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

      {learningLanguage.startsWith("en") && (
        <>
          <Separator className="my-2" />
          <CamdictLookupResult word={word} />
        </>
      )}

      <Separator className="my-2" />
      <AiLookupResult
        word={word}
        context={caption.text}
        sourceId={transcription.targetId}
        sourceType={transcription.targetType}
      />
    </>
  );
};
