import {
  AudioLinesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  VideoIcon,
} from "lucide-react";
import { Button, Separator } from "@renderer/components/ui";
import { t } from "i18next";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNotes } from "@/renderer/hooks";
import { NoteCard } from "./note-card";
import { NoteSemgent } from "./note-segment";

export const NoteSegmentGroup = (props: {
  count: number;
  segment: SegmentType;
}) => {
  const { count, segment } = props;
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const { notes, findNotes, hasMore } = useNotes({
    targetId: segment.id,
    targetType: "Segment",
  });

  return (
    <div
      className={`bg-background p-4 rounded-lg border transition-[shadow] ${
        collapsed ? "" : "shadow-lg"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="select-text line-clamp-3 text-muted-foreground font-serif pl-3 border-l-4 mb-4">
            {segment.caption.text}
          </div>
          <div className="font-mono text-lg mb-4">
            {t("notesCount", { count })}
          </div>
          <div className="flex justify-start text-sm text-muted-foreground">
            <Link
              to={`/${segment.targetType.toLowerCase()}s/${
                segment.targetId
              }?segmentIndex=${segment.segmentIndex}`}
            >
              {t("source")}: {t(segment.targetType.toLowerCase())}
            </Link>
          </div>
        </div>
        <div className="w-24 h-24 flex">
          {segment.targetType === "Audio" && (
            <AudioLinesIcon className="object-cover m-auto w-5/6 h-5/6 text-muted-foreground" />
          )}
          {segment.targetType === "Video" && (
            <VideoIcon className="object-cover m-auto w-5/6 h-5/6 text-muted-foreground" />
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-[height] ease-in-out duration-500 ${
          collapsed ? "h-0" : "h-auto"
        }`}
      >
        <Separator className="my-4" />

        <div className="mb-4">
          <NoteSemgent segment={segment} notes={notes} />
        </div>

        <div className="grid gap-2 mb-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mb-2">
            <Button
              onClick={() => findNotes({ offset: notes.length })}
              variant="link"
              size="sm"
            >
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center">
        <Button
          onClick={() => setCollapsed(!collapsed)}
          variant="ghost"
          size="icon"
          className="p-0 w-6 h-6"
        >
          {collapsed ? (
            <ChevronDownIcon className="w-5 h-5" />
          ) : (
            <ChevronUpIcon className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
