import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { TabContentSelected } from "./tab-content-selected";
import { TabContentTranslation } from "./tab-content-translation";
import { TabContentAnalysis } from "./tab-content-analysis";
import { TabContentNote } from "./tab-content-note";

export const MediaCaptionTabs = (props: {
  caption: TimelineEntry;
  currentSegmentIndex: number;
  selectedIndices: number[];
  toggleRegion: (index: number) => void;
  children?: React.ReactNode;
}) => {
  const {
    caption,
    currentSegmentIndex,
    selectedIndices,
    toggleRegion,
    children,
  } = props;

  const [tab, setTab] = useState<string>("selected");

  if (!caption) return null;

  return (
    <ScrollArea className="h-full relative">
      <Tabs value={tab} onValueChange={(value) => setTab(value)} className="">
        {children}

        <div className="px-4 pb-10 min-h-32">
          <TabContentSelected
            caption={caption}
            selectedIndices={selectedIndices}
            toggleRegion={toggleRegion}
          />

          <TabContentTranslation text={caption.text} />

          <TabContentAnalysis text={caption.text} />

          <TabContentNote
            currentSegmentIndex={currentSegmentIndex}
            caption={caption}
            selectedIndices={selectedIndices}
          />
        </div>

        <TabsList className="grid grid-cols-4 gap-4 rounded-none absolute w-full bottom-0 px-4">
          <TabsTrigger value="selected" className="block truncate px-1">
            {t("captionTabs.selected")}
          </TabsTrigger>
          <TabsTrigger value="translation" className="block truncate px-1">
            {t("captionTabs.translation")}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="block truncate px-1">
            {t("captionTabs.analysis")}
          </TabsTrigger>
          <TabsTrigger value="note" className="block truncate px-1">
            {t("captionTabs.note")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </ScrollArea>
  );
};
