import { useEffect, useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import { Button, toast } from "@renderer/components/ui";
import { ConversationShortcuts } from "@renderer/components";
import { t } from "i18next";
import {
  BotIcon,
  CopyIcon,
  CheckIcon,
  SpeechIcon,
  NotebookPenIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { convertWordIpaToNormal } from "@/utils";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { MediaCaptionTabs } from "./media-captions";

export const MediaCaption = () => {
  const {
    media,
    currentSegmentIndex,
    currentSegment,
    createSegment,
    currentTime,
    transcription,
    regions,
    activeRegion,
    setActiveRegion,
    editingRegion,
    setEditingRegion,
    setTranscriptionDraft,
    ipaMappings,
  } = useContext(MediaPlayerProviderContext);
  const { EnjoyApp, learningLanguage } = useContext(AppSettingsProviderContext);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [multiSelecting, setMultiSelecting] = useState<boolean>(false);

  const [displayIpa, setDisplayIpa] = useState<boolean>(true);
  const [displayNotes, setDisplayNotes] = useState<boolean>(true);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

  const [caption, setCaption] = useState<TimelineEntry | null>(null);

  const toggleMultiSelect = (event: KeyboardEvent) => {
    setMultiSelecting(event.shiftKey && event.type === "keydown");
  };

  const toggleSeletedIndex = (index: number) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }

    const startWord = caption.timeline[index];
    if (!startWord) return;

    if (multiSelecting) {
      const min = Math.min(index, ...selectedIndices);
      const max = Math.max(index, ...selectedIndices);

      // Select all the words between the min and max indices.
      setSelectedIndices(
        Array.from({ length: max - min + 1 }, (_, i) => i + min)
      );
    } else if (selectedIndices.includes(index)) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices([index]);
    }
  };

  const toggleRegion = (params: number[]) => {
    if (!activeRegion) return;
    if (editingRegion) {
      toast.warning(t("currentRegionIsBeingEdited"));
      return;
    }
    if (params.length === 0) {
      if (activeRegion.id.startsWith("word-region")) {
        activeRegion.remove();
        setActiveRegion(
          regions.getRegions().find((r) => r.id.startsWith("segment-region"))
        );
      }
      return;
    }

    const startIndex = Math.min(...params);
    const endIndex = Math.max(...params);

    const startWord = caption.timeline[startIndex];
    if (!startWord) return;

    const endWord = caption.timeline[endIndex] || startWord;

    const start = startWord.startTime;
    const end = endWord.endTime;

    // If the active region is a word region, then merge the selected words into a single region.
    if (activeRegion.id.startsWith("word-region")) {
      activeRegion.remove();

      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: editingRegion,
      });

      setActiveRegion(region);
      // If the active region is a meaning group region, then active the segment region.
    } else if (activeRegion.id.startsWith("meaning-group-region")) {
      setActiveRegion(
        regions.getRegions().find((r) => r.id.startsWith("segment-region"))
      );
      // If the active region is a segment region, then create a new word region.
    } else {
      const region = regions.addRegion({
        id: `word-region-${startIndex}`,
        start,
        end,
        color: "#fb6f9233",
        drag: false,
        resize: false,
      });

      setActiveRegion(region);
    }
  };

  const handleDownload = async () => {
    if (activeRegion && !activeRegion.id.startsWith("segment-region")) {
      handleDownloadActiveRegion();
    } else {
      handleDownloadSegment();
    }
  };

  const handleDownloadSegment = async () => {
    const segment = currentSegment || (await createSegment());
    if (!segment) return;

    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: `${media.name}(${segment.startTime.toFixed(
          2
        )}s-${segment.endTime.toFixed(2)}s).mp3`,
        filters: [
          {
            name: "Audio",
            extensions: ["mp3"],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(
          EnjoyApp.download.start(segment.src, savePath as string),
          {
            loading: t("downloading", { file: media.filename }),
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          }
        );
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.message);
      });
  };

  const handleDownloadActiveRegion = async () => {
    if (!activeRegion) return;
    let src: string;

    try {
      if (media.mediaType === "Audio") {
        src = await EnjoyApp.audios.crop(media.id, {
          startTime: activeRegion.start,
          endTime: activeRegion.end,
        });
      } else if (media.mediaType === "Video") {
        src = await EnjoyApp.videos.crop(media.id, {
          startTime: activeRegion.start,
          endTime: activeRegion.end,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(`${t("downloadFailed")}: ${err.message}`);
    }

    if (!src) return;

    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: `${media.name}(${activeRegion.start.toFixed(
          2
        )}s-${activeRegion.end.toFixed(2)}s).mp3`,
        filters: [
          {
            name: "Audio",
            extensions: ["mp3"],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(EnjoyApp.download.start(src, savePath as string), {
          loading: t("downloading", { file: media.filename }),
          success: () => t("downloadedSuccessfully"),
          error: t("downloadFailed"),
          position: "bottom-right",
        });
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    if (!caption) return;

    const index = caption.timeline.findIndex(
      (w) => currentTime >= w.startTime && currentTime < w.endTime
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, caption]);

  useEffect(() => {
    if (!caption?.timeline) return;
    if (!activeRegion) return;

    toggleRegion(selectedIndices);
  }, [caption, selectedIndices]);

  useEffect(() => {
    if (!activeRegion) return;
    if (!activeRegion.id.startsWith("word-region")) return;

    const region = regions.addRegion({
      id: `word-region-${selectedIndices.join("-")}`,
      start: activeRegion.start,
      end: activeRegion.end,
      color: "#fb6f9233",
      drag: false,
      resize: editingRegion,
    });

    activeRegion.remove();
    setActiveRegion(region);

    const subscriptions = [
      regions.on("region-updated", (region) => {
        if (!region.id.startsWith("word-region")) return;

        const draft = cloneDeep(transcription.result);
        const draftCaption = draft.timeline[currentSegmentIndex];

        const firstIndex = selectedIndices[0];
        const lastIndex = selectedIndices[selectedIndices.length - 1];
        const firstWord = draftCaption.timeline[firstIndex];
        const lastWord = draftCaption.timeline[lastIndex];

        // If no word is selected somehow, then ignore the update.
        if (!firstWord || !lastWord) {
          setEditingRegion(false);
          return;
        }

        firstWord.startTime = region.start;
        lastWord.endTime = region.end;

        /* Update the timeline of the previous and next words
         * It happens only when regions are intersecting with the previous or next word.
         * It will ignore if the previous/next word's position changed in timestamps.
         */
        const prevWord = draftCaption.timeline[firstIndex - 1];
        const nextWord = draftCaption.timeline[lastIndex + 1];
        if (
          prevWord &&
          prevWord.endTime > region.start &&
          prevWord.startTime < region.start
        ) {
          prevWord.endTime = region.start;
        }
        if (
          nextWord &&
          nextWord.startTime < region.end &&
          nextWord.endTime > region.end
        ) {
          nextWord.startTime = region.end;
        }

        /*
         * If the last word is the last word of the segment, then update the segment's end time.
         */
        if (lastIndex === draftCaption.timeline.length - 1) {
          draftCaption.endTime = region.end;
        }

        setTranscriptionDraft(draft);
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [editingRegion]);

  useEffect(() => {
    setCaption(
      (transcription?.result?.timeline as Timeline)?.[currentSegmentIndex]
    );
  }, [currentSegmentIndex, transcription]);

  useEffect(() => {
    return () => setSelectedIndices([]);
  }, [caption]);

  useEffect(() => {
    document.addEventListener("keydown", (event: KeyboardEvent) =>
      toggleMultiSelect(event)
    );
    document.addEventListener("keyup", (event: KeyboardEvent) =>
      toggleMultiSelect(event)
    );

    return () => {
      document.removeEventListener("keydown", toggleMultiSelect);
      document.removeEventListener("keyup", toggleMultiSelect);
    };
  }, []);

  if (!caption) return null;

  return (
    <div className="h-full flex justify-between space-x-4">
      <div className="flex-1 font-serif h-full border shadow-lg rounded-lg">
        <MediaCaptionTabs
          caption={caption}
          currentSegmentIndex={currentSegmentIndex}
          selectedIndices={selectedIndices}
          setSelectedIndices={setSelectedIndices}
        >
          <Caption
            caption={caption}
            selectedIndices={selectedIndices}
            currentSegmentIndex={currentSegmentIndex}
            activeIndex={activeIndex}
            displayIpa={displayIpa}
            displayNotes={displayNotes}
            onClick={toggleSeletedIndex}
          />
        </MediaCaptionTabs>
      </div>

      <div className="flex flex-col space-y-2">
        <Button
          variant={displayIpa ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("displayIpa")}
          onClick={() => setDisplayIpa(!displayIpa)}
        >
          <SpeechIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={displayNotes ? "secondary" : "outline"}
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("displayNotes")}
          onClick={() => setDisplayNotes(!displayNotes)}
        >
          <NotebookPenIcon className="w-4 h-4" />
        </Button>

        <ConversationShortcuts
          prompt={caption.text as string}
          trigger={
            <Button
              data-tooltip-id="media-player-tooltip"
              data-tooltip-content={t("sendToAIAssistant")}
              variant="outline"
              size="sm"
              className="p-0 w-8 h-8 rounded-full"
            >
              <BotIcon className="w-5 h-5" />
            </Button>
          }
        />

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("copyText")}
          onClick={() => {
            if (displayIpa) {
              const text = caption.timeline
                .map((word) => {
                  const ipas = word.timeline.map((t) =>
                    t.timeline.map((s) => s.text).join("")
                  );
                  return `${word.text}(${
                    learningLanguage.startsWith("en")
                      ? convertWordIpaToNormal(ipas, {
                          mappings: ipaMappings,
                        }).join("")
                      : ipas.join("")
                  })`;
                })
                .join(" ");

              copyToClipboard(text);
            } else {
              copyToClipboard(caption.text);
            }
            setCopied(true);
            setTimeout(() => {
              setCopied(false);
            }, 1500);
          }}
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-green-500" />
          ) : (
            <CopyIcon
              data-tooltip-id="media-player-tooltip"
              data-tooltip-content={t("copyText")}
              className="w-4 h-4"
            />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 p-0"
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("downloadSegment")}
          onClick={handleDownload}
        >
          <DownloadIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const Caption = (props: {
  caption: TimelineEntry;
  selectedIndices?: number[];
  currentSegmentIndex: number;
  activeIndex?: number;
  displayIpa?: boolean;
  displayNotes?: boolean;
  onClick?: (index: number) => void;
}) => {
  const {
    caption,
    selectedIndices = [],
    currentSegmentIndex,
    activeIndex,
    displayIpa,
    displayNotes,
    onClick,
  } = props;

  const { currentNotes, ipaMappings } = useContext(MediaPlayerProviderContext);
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const notes = currentNotes.filter((note) => note.parameters?.quoteIndices);
  const [notedquoteIndices, setNotedquoteIndices] = useState<number[]>([]);

  let words = caption.text.split(" ");
  const ipas = caption.timeline.map((w) =>
    w.timeline.map((t) =>
      learningLanguage.startsWith("en")
        ? convertWordIpaToNormal(
            t.timeline.map((s) => s.text),
            { mappings: ipaMappings }
          ).join("")
        : t.text
    )
  );

  if (words.length !== caption.timeline.length) {
    words = caption.timeline.map((w) => w.text);
  }

  return (
    <div className="flex flex-wrap px-4 py-2 rounded-t-lg bg-muted/50">
      {/* use the words splitted by caption text if it is matched with the timeline length, otherwise use the timeline */}
      {words.map((word, index) => (
        <div
          className=""
          key={`word-${currentSegmentIndex}-${index}`}
          id={`word-${currentSegmentIndex}-${index}`}
        >
          <div
            className={`font-serif text-lg xl:text-xl 2xl:text-2xl p-1 pb-2 rounded ${
              onClick && "hover:bg-red-500/10 cursor-pointer"
            } ${index === activeIndex ? "text-red-500" : ""} ${
              selectedIndices.includes(index) ? "bg-red-500/10 selected" : ""
            } ${
              notedquoteIndices.includes(index)
                ? "border-b border-red-500 border-dashed"
                : ""
            }`}
            onClick={() => onClick && onClick(index)}
          >
            {word}
          </div>

          {displayIpa && (
            <div
              className={`select-text text-sm 2xl:text-base text-muted-foreground font-code mb-1 px-1 ${
                index === 0 ? "before:content-['/']" : ""
              } ${
                index === caption.timeline.length - 1
                  ? "after:content-['/']"
                  : ""
              }`}
            >
              {ipas[index]}
            </div>
          )}

          {displayNotes &&
            notes
              .filter((note) => note.parameters.quoteIndices[0] === index)
              .map((note) => (
                <div
                  key={`note-${currentSegmentIndex}-${note.id}`}
                  className="mb-1 text-xs 2xl:text-sm text-red-500 max-w-64 line-clamp-3 font-code cursor-pointer"
                  onMouseOver={() =>
                    setNotedquoteIndices(note.parameters.quoteIndices)
                  }
                  onMouseLeave={() => setNotedquoteIndices([])}
                  onClick={() =>
                    document.getElementById("note-" + note.id)?.scrollIntoView()
                  }
                >
                  {note.parameters.quoteIndices[0] === index && note.content}
                </div>
              ))}
        </div>
      ))}
    </div>
  );
};
