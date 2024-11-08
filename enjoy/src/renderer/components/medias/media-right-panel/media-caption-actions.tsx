import { useEffect, useState, useContext, useRef } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import cloneDeep from "lodash/cloneDeep";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  toast,
} from "@renderer/components/ui";
import { ConversationShortcuts, MediaCaption } from "@renderer/components";
import { t } from "i18next";
import {
  BotIcon,
  CopyIcon,
  CheckIcon,
  SpeechIcon,
  NotebookPenIcon,
  DownloadIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import {
  Timeline,
  TimelineEntry,
} from "echogarden/dist/utilities/Timeline.d.js";
import { convertWordIpaToNormal } from "@/utils";
import { useCopyToClipboard } from "@uidotdev/usehooks";

export const MediaCaptionActions = (props: {
  caption: TimelineEntry;
  displayIpa: boolean;
  setDisplayIpa: (display: boolean) => void;
  displayNotes: boolean;
  setDisplayNotes: (display: boolean) => void;
}) => {
  const { caption, displayIpa, setDisplayIpa, displayNotes, setDisplayNotes } =
    props;
  const { media, currentSegment, createSegment, transcription, activeRegion } =
    useContext(MediaShadowProviderContext);
  const { EnjoyApp, learningLanguage, ipaMappings } = useContext(
    AppSettingsProviderContext
  );
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);

  const [fbtOpen, setFbtOpen] = useState<boolean>(false);

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
            loading: t("downloadingFile", { file: media.filename }),
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
          loading: t("downloadingFile", { file: media.filename }),
          success: () => t("downloadedSuccessfully"),
          error: t("downloadFailed"),
          position: "bottom-right",
        });
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  if (!transcription) return null;
  if (!caption) return null;

  return (
    <Popover open={fbtOpen} onOpenChange={setFbtOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant={fbtOpen ? "secondary" : "outline"}
          className="rounded-full w-8 h-8 p-0 shadow-lg z-30"
        >
          {fbtOpen ? (
            <XIcon className="w-4 h-4" />
          ) : (
            <PlusIcon className="w-4 h-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-8 bg-transparent p-0 border-none shadow-none"
      >
        <div className="flex flex-col space-y-1">
          <Button
            variant={displayIpa ? "secondary" : "outline"}
            size="icon"
            className="rounded-full w-8 h-8 p-0"
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("displayIpa")}
            data-tooltip-place="left"
            onClick={() => setDisplayIpa(!displayIpa)}
          >
            <SpeechIcon className="w-4 h-4" />
          </Button>

          <Button
            variant={displayNotes ? "secondary" : "outline"}
            size="icon"
            className="rounded-full w-8 h-8 p-0"
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("displayNotes")}
            data-tooltip-place="left"
            onClick={() => setDisplayNotes(!displayNotes)}
          >
            <NotebookPenIcon className="w-4 h-4" />
          </Button>

          <ConversationShortcuts
            prompt={caption.text as string}
            trigger={
              <Button
                data-tooltip-id="media-shadow-tooltip"
                data-tooltip-content={t("sendToAIAssistant")}
                data-tooltip-place="left"
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
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("copyText")}
            data-tooltip-place="left"
            onClick={() => {
              if (displayIpa) {
                const text = caption.timeline
                  .map((word) => {
                    const ipas = word.timeline.map((t) =>
                      t.timeline.map((s) => s.text).join("")
                    );
                    return `${word.text}(${
                      (transcription.language || learningLanguage).startsWith(
                        "en"
                      )
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
                data-tooltip-id="media-shadow-tooltip"
                data-tooltip-content={t("copyText")}
                data-tooltip-place="left"
                className="w-4 h-4"
              />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 p-0"
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={t("downloadSegment")}
            data-tooltip-place="left"
            onClick={handleDownload}
          >
            <DownloadIcon className="w-4 h-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
