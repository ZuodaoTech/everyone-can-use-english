import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { MediaTabContentTranslation } from "./media-tab-content-translation";
import { MediaTabContentAnalysis } from "./media-tab-content-analysis";
import { MediaTabContentNote } from "./media-tab-content-note";

export const MediaCaptionPanelTabs = (props: {
  caption: TimelineEntry;
  tab: string;
  currentSegmentIndex: number;
  selectedIndices: number[];
  setTab: (v: string) => void;
  setSelectedIndices: (indices: number[]) => void;
  children?: React.ReactNode;
}) => {
  const {
    caption,
    currentSegmentIndex,
    selectedIndices,
    setSelectedIndices,
    children,
    tab,
    setTab,
  } = props;

  if (!caption) return null;

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value)}
      className="h-full flex flex-col"
    >
      <TabsList className="grid grid-cols-3 gap-4 rounded-none w-full px-4">
        <TabsTrigger
          value="translation"
          className="capitalize block truncate px-1"
        >
          {t("captionTabs.translation")}
        </TabsTrigger>
        <TabsTrigger value="note" className="capitalize block truncate px-1">
          {t("captionTabs.note")}
        </TabsTrigger>
        <TabsTrigger
          value="analysis"
          className="capitalize block truncate px-1"
        >
          {t("captionTabs.analysis")}
        </TabsTrigger>
      </TabsList>
      <ScrollArea className="flex-1 relative">
        {children}

        <div className="px-4 pb-10 min-h-32">
          <MediaTabContentNote
            currentSegmentIndex={currentSegmentIndex}
            selectedIndices={selectedIndices}
            setSelectedIndices={setSelectedIndices}
          />

          <MediaTabContentTranslation
            caption={caption}
            selectedIndices={selectedIndices}
          />

          <MediaTabContentAnalysis text={caption.text} />
        </div>
      </ScrollArea>
    </Tabs>
  );
};
