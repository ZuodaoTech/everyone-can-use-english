import { Button } from "@renderer/components/ui";
import { useCamdict } from "@renderer/hooks";
import { Volume2Icon } from "lucide-react";
import { t } from "i18next";

export const CamdictLookupResult = (props: { word: string }) => {
  const { word } = props;
  const { result } = useCamdict(word);

  if (!word) return null;

  return (
    <>
      {result ? (
        <div className="select-text">
          <div className="mb-2 font-semibord font-serif">{word}</div>
          {result.posItems.map((posItem, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center space-x-4 mb-2 flex-wrap">
                <div className="italic text-sm text-muted-foreground">
                  {posItem.type}
                </div>

                {posItem.pronunciations.map((pron, i) => (
                  <div
                    key={`pron-${i}`}
                    className="flex items-center space-x-2"
                  >
                    <span className="uppercase text-xs font-serif text-muted-foreground">
                      [{pron.region}]
                    </span>
                    <span className="text-sm font-code">
                      /{pron.pronunciation}/
                    </span>
                    {pron.audio && pron.audio.match(/\.mp3/i) && (
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full p-0 w-6 h-6"
                          onClick={() => {
                            const audio = new Audio(pron.audio);
                            audio.play();
                          }}
                        >
                          <Volume2Icon className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <ul className="list-disc pl-4">
                {posItem.definitions.map((def, i) => (
                  <li key={`pos-${i}`} className="">
                    {def.definition}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm font-serif text-muted-foreground py-2 text-center">
          - {t("noResultsFound")} -
        </div>
      )}
    </>
  );
};
