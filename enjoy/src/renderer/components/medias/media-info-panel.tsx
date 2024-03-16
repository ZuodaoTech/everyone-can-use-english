import { useContext } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import { formatDuration, formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";

export const MediaInfoPanel = () => {
  const { media } = useContext(MediaPlayerProviderContext);
  if (!media) return null;

  return (
    <div className="px-4" data-testid="media-info-panel">
      {[
        { label: t("models.audio.name"), value: media.name },
        {
          label: t("models.audio.duration"),
          value: formatDuration(media.duration),
        },
        {
          label: t("models.audio.recordingsCount"),
          value: media.recordingsCount ? media.recordingsCount : 0,
        },
        {
          label: t("models.audio.recordingsDuration"),
          value: formatDuration(media.recordingsDuration, "ms"),
        },
        {
          label: t("models.audio.createdAt"),
          value: formatDateTime(media.createdAt),
        },
      ].map((item, index) => (
        <div key={`media-info-item-${index}`} className="mb-2">
          <div className="capitalize text-sm text-muted-foreground mb-1">
            {item.label}
          </div>
          <div className="">{item.value}</div>
        </div>
      ))}
    </div>
  );
};
