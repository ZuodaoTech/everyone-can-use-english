import { TabsContent } from "@renderer/components/ui";
import { TimelineEntry } from "echogarden/dist/utilities/Timeline";
import { t } from "i18next";

/*
 * Note tab content.
 */
export function TabContentNote(props: {
  currentSegmentIndex: number;
  caption: TimelineEntry;
}) {
  const { currentSegmentIndex, caption } = props;

  return (
    <TabsContent value="note">
      <div className="text-muted-foreground text-center py-4">Comming soon</div>
    </TabsContent>
  );
}
