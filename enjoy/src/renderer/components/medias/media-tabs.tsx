import { useEffect, useContext, useState } from "react";
import { MediaPlayerProviderContext } from "@renderer/context";
import {
  MediaProvider,
  MediaTranscription,
  MediaInfoPanel,
  MediaRecordings,
} from "@renderer/components";
import { ScrollArea } from "@renderer/components/ui";
import { t } from "i18next";

export const MediaTabs = () => {
  const { media, decoded } = useContext(MediaPlayerProviderContext);
  const [tab, setTab] = useState("provider");

  useEffect(() => {
    if (!decoded) return;

    setTab("transcription");
  }, [decoded]);

  if (!media) return null;

  return (
    <ScrollArea className="h-full">
      <div className="flex items-center space-x-2 justify-between p-1 bg-muted rounded-t-lg mb-2 text-sm sticky top-0 z-10">
        {media.mediaType === "Video" && (
          <div
            className={`rounded cursor-pointer px-2 py-1 text-sm text-center capitalize ${
              tab === "provider" ? "bg-background" : ""
            }`}
            onClick={() => setTab("provider")}
          >
            {t("player")}
          </div>
        )}

        <div
          className={`rounded cursor-pointer px-2 py-1 text-sm text-center capitalize ${
            tab === "transcription" ? "bg-background" : ""
          }`}
          onClick={() => setTab("transcription")}
        >
          {t("transcription")}
        </div>
        <div
          className={`rounded cursor-pointer px-2 py-1 text-sm text-center capitalize ${
            tab === "recordings" ? "bg-background" : ""
          }`}
          onClick={() => setTab("recordings")}
        >
          {t("myRecordings")}
        </div>
        <div
          className={`rounded cursor-pointer px-2 py-1 text-sm text-center capitalize ${
            tab === "info" ? "bg-background" : ""
          }`}
          onClick={() => setTab("info")}
        >
          {t("mediaInfo")}
        </div>
      </div>

      <div className={tab === "provider" ? "" : "hidden"}>
        <MediaProvider />
      </div>
      <div className={tab === "recordings" ? "" : "hidden"}>
        <MediaRecordings />
      </div>
      <div className={tab === "transcription" ? "" : "hidden"}>
        <MediaTranscription />
      </div>
      <div className={tab === "info" ? "" : "hidden"}>
        <MediaInfoPanel />
      </div>
    </ScrollArea>
  );
};
