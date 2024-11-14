import { Button } from "@renderer/components/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import {
  AppSettingsProviderContext,
  HotKeysSettingsProviderContext,
} from "@renderer/context";
import { LoaderSpin, MeaningMemorizingCard } from "@renderer/components";
import { useHotkeys } from "react-hotkeys-hook";

export default () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [meanings, setMeanings] = useState<MeaningType[]>([]);
  const { webApi } = useContext(AppSettingsProviderContext);
  const { currentHotkeys, enabled } = useContext(
    HotKeysSettingsProviderContext
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [nextPage, setNextPage] = useState(1);

  const fetchMeanings = async (page: number = nextPage) => {
    if (!page) return;
    if (loading) return;

    setLoading(true);
    webApi
      .mineMeanings({ page, items: 10 })
      .then((response) => {
        setMeanings([...meanings, ...response.meanings]);
        setNextPage(response.next);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMeanings(1);
  }, []);

  useHotkeys(
    [currentHotkeys.PlayPreviousSegment, currentHotkeys.PlayNextSegment],
    (keyboardEvent, hotkeyEvent) => {
      keyboardEvent.preventDefault();

      switch (hotkeyEvent.keys.join("")) {
        case currentHotkeys.PlayPreviousSegment.toLowerCase():
          document.getElementById("vocabulary-previous-button").click();
          break;
        case currentHotkeys.PlayNextSegment.toLowerCase():
          document.getElementById("vocabulary-next-button").click();
          break;
      }
    },
    {
      enabled,
    },
    []
  );

  if (loading) {
    return <LoaderSpin />;
  }

  return (
    <div className="h-[100vh]">
      <div className="max-w-screen-md mx-auto p-4">
        {meanings.length === 0 ? (
          <div className=""></div>
        ) : (
          <div className="h-[calc(100vh-5.25rem)] flex items-center justify-between space-x-6">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              id="vocabulary-previous-button"
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                }
              }}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
            <div className="bg-background flex-1 h-5/6 border p-6 rounded-xl shadow-xl">
              <MeaningMemorizingCard meaning={meanings[currentIndex]} />
            </div>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              id="vocabulary-next-button"
              onClick={() => {
                if (currentIndex < meanings.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                }
                if (currentIndex === meanings.length - 2 && nextPage) {
                  fetchMeanings(nextPage);
                }
              }}
            >
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
