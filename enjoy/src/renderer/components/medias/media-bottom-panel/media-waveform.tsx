import { useEffect, useContext, useRef, useState } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
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
  MoreHorizontalIcon,
  DownloadIcon,
} from "lucide-react";
import debounce from "lodash/debounce";

const ZOOM_RATIO_OPTIONS = [
  0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0,
];
const MIN_ZOOM_RATIO = 0.25;
const MAX_ZOOM_RATIO = 4.0;
const ACTION_BUTTON_HEIGHT = 35;

export const MediaWaveform = () => {
  const { EnjoyApp, webApi } = useContext(AppSettingsProviderContext);
  const {
    media,
    currentTime,
    setWaveformContainerRef,
    pitchChart,
    wavesurfer,
    zoomRatio,
    setZoomRatio,
    fitZoomRatio,
  } = useContext(MediaShadowProviderContext);
  const [displayInlineCaption, setDisplayInlineCaption] =
    useState<boolean>(true);
  const [isSharing, setIsSharing] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [actionButtonsCount, setActionButtonsCount] = useState(0);

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

  const calContainerSize = () => {
    const size = ref?.current
      ?.closest(".media-player-wrapper")
      ?.getBoundingClientRect();
    if (!size) return;

    setSize({ width: size.width, height: size.height });
    if (wavesurfer) {
      wavesurfer.setOptions({
        height: size.height - 10,
      });
    }

    setActionButtonsCount(Math.floor(size.height / ACTION_BUTTON_HEIGHT));
  };

  const debouncedCalContainerSize = debounce(calContainerSize, 100);

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

  useEffect(() => {
    if (!ref?.current) return;

    setWaveformContainerRef(ref);

    if (!wavesurfer) return;

    let rafId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        debouncedCalContainerSize();
      });
    });
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [ref, wavesurfer]);

  const Actions = [
    {
      name: "zoomToFit",
      label: t("zoomToFit"),
      icon: MinimizeIcon,
      active: zoomRatio == fitZoomRatio,
      onClick: () => {
        if (zoomRatio == fitZoomRatio) {
          setZoomRatio(1.0);
        } else {
          setZoomRatio(fitZoomRatio);
        }
      },
    },
    {
      name: "zoomIn",
      label: t("zoomIn"),
      icon: ZoomInIcon,
      active: zoomRatio > 1.0,
      onClick: () => {
        if (zoomRatio < MAX_ZOOM_RATIO) {
          const nextZoomRatio = ZOOM_RATIO_OPTIONS.find(
            (rate) => rate > zoomRatio
          );
          setZoomRatio(nextZoomRatio || MAX_ZOOM_RATIO);
        }
      },
    },
    {
      name: "zoomOut",
      label: t("zoomOut"),
      icon: ZoomOutIcon,
      active: zoomRatio < 1.0,
      onClick: () => {
        if (zoomRatio > MIN_ZOOM_RATIO) {
          const nextZoomRatio = ZOOM_RATIO_OPTIONS.reverse().find(
            (rate) => rate < zoomRatio
          );
          setZoomRatio(nextZoomRatio || MIN_ZOOM_RATIO);
        }
      },
    },
    {
      name: "inlineCaption",
      label: t("inlineCaption"),
      icon: SpellCheckIcon,
      active: displayInlineCaption,
      onClick: () => {
        setDisplayInlineCaption(!displayInlineCaption);
        if (pitchChart) {
          pitchChart.options.scales.x.display = !displayInlineCaption;
          pitchChart.update();
        }
      },
    },
    {
      name: "autoCenter",
      label: t("autoCenter"),
      icon: GalleryHorizontalIcon,
      active: wavesurfer?.options?.autoCenter,
      onClick: () => {
        wavesurfer.setOptions({
          autoCenter: !wavesurfer?.options?.autoCenter,
        });
      },
    },
    {
      name: "share",
      label: t("share"),
      icon: Share2Icon,
      onClick: () => setIsSharing(true),
    },
    {
      name: "download",
      label: t("download"),
      icon: DownloadIcon,
      onClick: handleDownload,
    },
  ];

  return (
    <div
      ref={ref}
      className="flex h-full media-player-wrapper border rounded-lg shadow"
    >
      <div
        data-testid="media-player-container"
        className="flex-1 relative media-player-container overflow-hidden"
      >
        <div
          style={{
            width: `${size?.width - 40}px`, // -40 for action buttons
            height: `${size?.height}px`,
          }}
          className="waveform-container"
        />
        <div className="absolute right-2 top-1">
          <span className="text-sm">{formatDuration(currentTime || 0)}</span>
          <span className="mx-1">/</span>
          <span className="text-sm">
            {formatDuration(media?.duration || 0)}
          </span>
        </div>
      </div>
      <div
        className={`grid grid-rows-${
          actionButtonsCount < Actions.length
            ? actionButtonsCount + 1
            : Actions.length
        } w-10 border-l rounded-r-lg`}
      >
        {Actions.slice(0, actionButtonsCount).map((action) => (
          <Button
            key={action.name}
            variant={`${action.active ? "secondary" : "ghost"}`}
            data-tooltip-id="media-shadow-tooltip"
            data-tooltip-content={action.label}
            data-tooltip-place="left"
            className="relative p-0 w-full h-full rounded-none"
            onClick={action.onClick}
          >
            <action.icon className="w-4 h-4" />
          </Button>
        ))}

        {actionButtonsCount < Actions.length && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-tooltip-id="media-shadow-tooltip"
                data-tooltip-content={t("more")}
                data-tooltip-place="left"
                className="relative p-0 w-full h-full rounded-none"
              >
                <MoreHorizontalIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              {Actions.slice(actionButtonsCount).map((action) => (
                <DropdownMenuItem
                  key={action.name}
                  className="cursor-pointer"
                  onClick={action.onClick}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
