import { useContext, useState } from "react";
import {
  AppSettingsProviderContext,
  MediaShadowProviderContext,
} from "@renderer/context";
import { formatDuration, formatDateTime } from "@renderer/lib/utils";
import { t } from "i18next";
import { Button, toast } from "@renderer/components/ui";
import { useAiCommand } from "@renderer/hooks";
import { LoaderIcon } from "lucide-react";

export const MediaInfo = () => {
  const { media, transcription } = useContext(MediaShadowProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { summarizeTopic } = useAiCommand();
  const [summarizing, setSummarizing] = useState<boolean>(false);

  const handleSummarize = async () => {
    setSummarizing(true);

    try {
      const topic = await summarizeTopic(transcription.result.transcript);
      if (media.mediaType === "Video") {
        await EnjoyApp.videos.update(media.id, {
          name: topic,
        });
      } else if (media.mediaType === "Audio") {
        await EnjoyApp.audios.update(media.id, {
          name: topic,
        });
      }
    } catch (error) {
      toast.error(error.message);
    }

    setSummarizing(false);
  };

  if (!media) return null;

  return (
    <div className="px-4" data-testid="media-info-panel">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="capitalize text-sm text-muted-foreground mb-1">
            {t("models.audio.name")}
          </div>
          <Button
            disabled={summarizing}
            onClick={handleSummarize}
            variant="outline"
            size="sm"
          >
            {summarizing && (
              <LoaderIcon className="animate-spin mr-2" size={16} />
            )}
            {t("summarize")}
          </Button>
        </div>
        <div className="">{media.name}</div>
      </div>

      {[
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
