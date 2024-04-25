import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  ScrollArea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline.d.js";
import { TabContentTranslation } from "./tab-content-translation";
import { TabContentAnalysis } from "./tab-content-analysis";
import { TabContentNote } from "./tab-content-note";

export const MediaCaptionTabs = (props: {
  caption: TimelineEntry;
  currentSegmentIndex: number;
  selectedIndices: number[];
  setSelectedIndices: (indices: number[]) => void;
  children?: React.ReactNode;
}) => {
  const {
    caption,
    currentSegmentIndex,
    selectedIndices,
    setSelectedIndices,
    children,
  } = props;

  const [tab, setTab] = useState<string>("note");

  if (!caption) return null;

  return (
    <ScrollArea className="h-full relative">
      <Tabs value={tab} onValueChange={(value) => setTab(value)} className="">
        {children}

        <div className="px-4 pb-10 min-h-32">
          <TabContentNote
            currentSegmentIndex={currentSegmentIndex}
            selectedIndices={selectedIndices}
            setSelectedIndices={setSelectedIndices}
          />

          <TabContentTranslation
            caption={caption}
            selectedIndices={selectedIndices}
          />

          <TabContentAnalysis text={caption.text} />
        </div>

        <TabsList className="grid grid-cols-3 gap-4 rounded-none absolute w-full bottom-0 px-4">
          <TabsTrigger value="note" className="block truncate px-1">
            {t("captionTabs.note")}
          </TabsTrigger>
          <TabsTrigger value="translation" className="block truncate px-1">
            {t("captionTabs.translation")}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="block truncate px-1">
            {t("captionTabs.analysis")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </ScrollArea>
  );
};
