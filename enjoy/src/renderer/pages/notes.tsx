import { ChevronLeftIcon } from "lucide-react";
import { Button, toast } from "../components/ui";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "../context";
import { NoteSegmentGroup } from "../components";

export default function Notes() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<
    {
      targetId: string;
      targetType: string;
      count: number;
      segment?: SegmentType;
    }[]
  >([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const findNotesGroup = (params?: { offset: number; limit?: number }) => {
    const { offset = 0, limit = 5 } = params || {};
    if (offset > 0 && !hasMore) return;

    EnjoyApp.notes
      .groupByTarget({
        limit,
        offset,
      })
      .then((noteGroups) => {
        if (offset === 0) {
          setGroups(noteGroups);
        } else {
          setGroups([...groups, ...noteGroups]);
        }
        setHasMore(groups.length === limit);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    findNotesGroup({ offset: 0 });
  }, []);

  return (
    <div className="min-h-[100vh] w-full max-w-5xl mx-auto px-4 py-6 lg:px-8">
      {groups.length === 0 && (
        <div className="flex justify-center">
          <div className="my-4 text-muted-foreground text-sm">
            {t("noNotesYet")}
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {groups.map((group) => (
          <NoteSegmentGroup
            key={group.targetId}
            count={group.count}
            segment={group.segment}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            variant="secondary"
            onClick={() => findNotesGroup({ offset: groups.length })}
          >
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
