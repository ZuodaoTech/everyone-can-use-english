import { useContext } from "react";
import {
  ScrollArea,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Separator,
} from "@renderer/components/ui";
import { MediaPlayerProviderContext } from "@renderer/context";
import { formatDuration, formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import {
  MediaPlayer as VidstackMediaPlayer,
  MediaProvider,
  isAudioProvider,
  isVideoProvider,
  useMediaRemote,
} from "@vidstack/react";
import {
  DefaultAudioLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

export const MediaInfoPanel = () => {
  const { media, decoded, setMediaProvider } = useContext(
    MediaPlayerProviderContext
  );
  const mediaRemote = useMediaRemote();

  return (
    <ScrollArea
      className="border rounded-lg shadow-lg px-4"
      data-testid="media-info-panel"
    >
      <div className="sticky top-0 py-2 bg-background z-10">
        {t("mediaInfo")}
      </div>

      {media?.src && (
        <>
          <div
            className={
              decoded ? (media?.mediaType === "Audio" ? "hidden" : "") : ""
            }
          >
            <VidstackMediaPlayer
              controls
              src={media.src}
              onCanPlayThrough={(detail, nativeEvent) => {
                mediaRemote.setTarget(nativeEvent.target);
                const { provider } = detail;
                if (isAudioProvider(provider)) {
                  setMediaProvider(provider.audio);
                } else if (isVideoProvider(provider)) {
                  setMediaProvider(provider.video);
                }
              }}
            >
              <MediaProvider />
              <DefaultAudioLayout icons={defaultLayoutIcons} />
            </VidstackMediaPlayer>
          </div>
          {media?.mediaType === "Video" && <Separator className="my-4" />}
        </>
      )}

      {media && (
        <Table>
          <TableBody>
            <TableRow className="border-none">
              <TableHead className="w-20 capitalize">
                {t("models.audio.name")}:
              </TableHead>
              <TableCell>{media.name}</TableCell>
            </TableRow>
            <TableRow className="border-none">
              <TableHead className="w-20 capitalize">
                {t("models.audio.duration")}:
              </TableHead>
              <TableCell>{formatDuration(media.duration)}</TableCell>
            </TableRow>
            <TableRow className="border-none">
              <TableHead className="w-20 capitalize">
                {t("models.audio.recordingsCount")}:
              </TableHead>
              <TableCell>
                {media.recordingsCount ? media.recordingsCount : 0}
              </TableCell>
            </TableRow>
            <TableRow className="border-none">
              <TableHead className="w-20 capitalize">
                {t("models.audio.recordingsDuration")}:
              </TableHead>
              <TableCell>
                {formatDuration(media.recordingsDuration, "ms")}
              </TableCell>
            </TableRow>
            <TableRow className="border-none">
              <TableHead className="w-20 capitalize">
                {t("models.audio.createdAt")}:
              </TableHead>
              <TableCell>{formatDateTime(media.createdAt)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </ScrollArea>
  );
};
