import { useEffect, useContext, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { formatDuration } from "@renderer/lib/utils";
import { t } from "i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  Button,
  toast,
} from "@renderer/components/ui";
import {
  GalleryHorizontalIcon,
  Share2Icon,
  SpellCheckIcon,
  MinimizeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MoreVerticalIcon,
  DownloadIcon,
} from "lucide-react";

const ZOOM_RATIO_OPTIONS = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0,
];
const MIN_ZOOM_RATIO = 0.25;
const MAX_ZOOM_RATIO = 4.0;

export const MediaPlayer = () => {
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const {
    media,
    currentTime,
    setRef,
    pitchChart,
    wavesurfer,
    zoomRatio,
    setZoomRatio,
    fitZoomRatio,
  } = useContext(MediaPlayerProviderContext);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);
  const [isSharing, setIsSharing] = useState(false);
  const [width, setWidth] = useState<number>();

  const ref = useRef(null);

  const onShare = async () => {
    if (!media.source && !media.isUploaded) {
      try {
        await EnjoyApp.audios.upload(media.id);
      } catch (err) {
        toast.error(t("shareFailed"), {
          description: err.message,
        });
        return;
      }
    }
    webApi
      .createPost({
        targetType: media.mediaType,
        targetId: media.id,
      })
      .then(() => {
        toast.success(t("sharedSuccessfully"), {
          description: t("sharedAudio"),
        });
      })
      .catch((err) => {
        toast.error(t("shareFailed"), {
          description: err.message,
        });
      });
  };

  const calContainerWidth = () => {
    const w = document
      .querySelector(".media-player-wrapper")
      ?.getBoundingClientRect()?.width;
    if (!w) return;

    setWidth(w - 48);
  };

  const handleDownload = () => {
    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: media.filename,
        filters: [
          {
            name: media.mediaType,
            extensions: [media.filename.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(EnjoyApp.download.start(media.src, savePath as string), {
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
    if (ref?.current) {
      setRef(ref);
    }
  }, [ref]);

  useEffect(() => {
    const container: HTMLDivElement = document.querySelector(
      ".media-player-container"
    );
    if (!container) return;

    ref.current.style.width = `${width}px`;
  }, [width]);

  useEffect(() => {
    calContainerWidth();
  }, []);

  return (
    <div className="flex media-player-wrapper border rounded-lg">
      <div
        data-testid="media-player-container"
        className="flex-1 relative media-player-container"
      >
        <div ref={ref} />
        <div className="absolute right-2 top-1">
          <span className="text-sm">{formatDuration(currentTime || 0)}</span>
          <span className="mx-1">/</span>
          <span className="text-sm">
            {formatDuration(media?.duration || 0)}
          </span>
        </div>
      </div>
      <div className="flex flex-col border-l">
        <Button
          variant={`${zoomRatio === fitZoomRatio ? "secondary" : "ghost"}`}
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("zoomToFit")}
          className="relative p-0 w-8 h-6 rounded-none rounded-tr-lg"
          onClick={() => {
            if (zoomRatio == fitZoomRatio) {
              setZoomRatio(1.0);
            } else {
              setZoomRatio(fitZoomRatio);
            }
          }}
        >
          <MinimizeIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={`${zoomRatio > 1.0 ? "secondary" : "ghost"}`}
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("zoomIn")}
          className="relative aspect-square rounded-none p-0 w-8 h-6"
          onClick={() => {
            if (zoomRatio < MAX_ZOOM_RATIO) {
              const nextZoomRatio = ZOOM_RATIO_OPTIONS.find(
                (rate) => rate > zoomRatio
              );
              setZoomRatio(nextZoomRatio || MAX_ZOOM_RATIO);
            }
          }}
        >
          <ZoomInIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={`${zoomRatio < 1.0 ? "secondary" : "ghost"}`}
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("zoomOut")}
          className="relative aspect-square rounded-none p-0 w-8 h-6"
          onClick={() => {
            if (zoomRatio > MIN_ZOOM_RATIO) {
              const nextZoomRatio = ZOOM_RATIO_OPTIONS.reverse().find(
                (rate) => rate < zoomRatio
              );
              setZoomRatio(nextZoomRatio || MIN_ZOOM_RATIO);
            }
          }}
        >
          <ZoomOutIcon className="w-4 h-4" />
        </Button>

        <Button
          variant={`${displayInlineCaption ? "secondary" : "ghost"}`}
          data-tooltip-id="media-player-tooltip"
          data-tooltip-content={t("inlineCaption")}
          className="relative aspect-square rounded-none p-0 w-8 h-6"
          onClick={() => {
            setDisplayInlineCaption(!displayInlineCaption);
            if (pitchChart) {
              pitchChart.options.scales.x.display = !displayInlineCaption;
              pitchChart.update();
            }
          }}
        >
          <SpellCheckIcon className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-tooltip-id="media-player-tooltip"
              data-tooltip-content={t("more")}
              className="rounded-none rounded-br-lg w-8 h-6 p-0"
            >
              <MoreVerticalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                if (zoomRatio > MIN_ZOOM_RATIO) {
                  const nextZoomRatio = ZOOM_RATIO_OPTIONS.reverse().find(
                    (rate) => rate < zoomRatio
                  );
                  setZoomRatio(nextZoomRatio || MIN_ZOOM_RATIO);
                }
              }}
            >
              <ZoomOutIcon className="w-4 h-4 mr-4" />
              <span>{t("zoomOut")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setDisplayInlineCaption(!displayInlineCaption);
                if (pitchChart) {
                  pitchChart.options.scales.x.display = !displayInlineCaption;
                  pitchChart.update();
                }
              }}
            >
              <SpellCheckIcon className="w-4 h-4 mr-4" />
              <span>{t("inlineCaption")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                wavesurfer.setOptions({
                  autoCenter: !wavesurfer?.options?.autoCenter,
                });
              }}
            >
              <GalleryHorizontalIcon className="w-4 h-4 mr-4" />
              <span>{t("autoCenter")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setIsSharing(true)}
            >
              <Share2Icon className="w-4 h-4 mr-4" />
              <span>{t("share")}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleDownload}
            >
              <DownloadIcon className="w-4 h-4 mr-4" />
              <span>{t("download")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isSharing} onOpenChange={setIsSharing}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {media?.mediaType === "Audio"
                  ? t("shareAudio")
                  : t("shareVideo")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {media?.mediaType === "Audio"
                  ? t("areYouSureToShareThisAudioToCommunity")
                  : t("areYouSureToShareThisVideoToCommunity")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="default" onClick={onShare}>
                  {t("share")}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
