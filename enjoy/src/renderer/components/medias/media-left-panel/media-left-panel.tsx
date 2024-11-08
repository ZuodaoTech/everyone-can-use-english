import { useEffect, useContext, useState } from "react";
import { MediaShadowProviderContext } from "@renderer/context";
import {
  MediaProvider,
  MediaTranscription,
  MediaInfo,
  MediaRecordings,
} from "@renderer/components";
import {
  Button,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui";
import { t } from "i18next";
import { cn } from "@renderer/lib/utils";
import { ArrowLeftRightIcon } from "lucide-react";

export const MediaLeftPanel = (props: {
  className?: string;
  setDisplayPanel?: (displayPanel: "left" | "right" | null) => void;
}) => {
  const { className, setDisplayPanel } = props;
  const { media, decoded, layout } = useContext(MediaShadowProviderContext);
  const [tab, setTab] = useState("provider");

  useEffect(() => {
    if (!decoded) return;

    setTab("transcription");
  }, [decoded]);

  if (!media) return null;

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className={cn("h-full flex flex-col", className)}
    >
      <div className="flex items-center bg-muted px-4">
        {layout === "compact" && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setDisplayPanel?.("right")}
          >
            <ArrowLeftRightIcon className="w-4 h-4" />
          </Button>
        )}

        <TabsList
          className={`grid gap-4 rounded-none w-full ${
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
      </div>

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
