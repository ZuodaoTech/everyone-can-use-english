import { useEffect, useContext, useState } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import {
  MediaProvider,
  MediaTranscription,
  MediaInfo,
  MediaRecordings,
} from "@renderer/components";
import {
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";
import { t } from "i18next";

export const MediaLeftPanel = () => {
  const { media, decoded } = useContext(MediaShadowProviderContext);
  const [tab, setTab] = useState("provider");

  useEffect(() => {
    if (!decoded) return;

    setTab("transcription");
  }, [decoded]);

  if (!media) return null;

  return (
    <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
      <TabsList
        className={`grid gap-4 rounded-none w-full px-4 ${
          media?.mediaType === "Video" ? "grid-cols-4" : "grid-cols-3"
        }`}
      >
        {media?.mediaType === "Video" && (
          <TabsTrigger
            value="provider"
            className="capitalize block truncate px-1"
          >
            {t("player")}
          </TabsTrigger>
        )}
        <TabsTrigger
          value="transcription"
          className="capitalize block truncate px-1"
        >
          {t("transcription")}
        </TabsTrigger>
        <TabsTrigger
          value="recordings"
          className="capitalize block truncate px-1"
        >
          {t("myRecordings")}
        </TabsTrigger>
        <TabsTrigger value="info" className="capitalize block truncate px-1">
          {t("mediaInfo")}
        </TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1 relative">
        <TabsContent forceMount={true} value="provider">
          <div className={`${tab === "provider" ? "block" : "hidden"}`}>
            <MediaProvider />
          </div>
        </TabsContent>
        <TabsContent forceMount={true} value="recordings">
          <div className={`${tab === "recordings" ? "block" : "hidden"}`}>
            <MediaRecordings />
          </div>
        </TabsContent>
        <TabsContent value="transcription">
          <MediaTranscription display={tab === "transcription"} />
        </TabsContent>
        <TabsContent value="info">
          <MediaInfo />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
};
