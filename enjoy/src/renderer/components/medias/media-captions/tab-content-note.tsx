import {
  AppSettingsProviderContext,
  MediaPlayerProviderContext,
} from "@renderer/context";
import { Button, TabsContent, toast } from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { useNotes } from "@/renderer/hooks";
import { NoteCard, NoteForm } from "@renderer/components";

/*
 * Note tab content.
 */
export function TabContentNote(props: {
  currentSegmentIndex: number;
  selectedIndices: number[];
  setSelectedIndices: (indices: number[]) => void;
}) {
  const { currentSegmentIndex, selectedIndices, setSelectedIndices } = props;
  const { media } = useContext(MediaPlayerProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [segment, setSegment] = useState<SegmentType>();

  const findSegment = () => {
    if (!media) return;

    EnjoyApp.segments
      .findAll({
        targetId: media.id,
        targetType: media.mediaType,
        segmentIndex: currentSegmentIndex,
      })
      .then((segments) => {
        if (segments.length) {
          setSegment(segments[0]);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const createSegment = () => {
    if (!media) return;

    EnjoyApp.segments
      .create({
        targetId: media.id,
        targetType: media.mediaType,
        segmentIndex: currentSegmentIndex,
      })
      .then((segment) => {
        setSegment(segment);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    if (!media) return;

    findSegment();
  }, [currentSegmentIndex]);

  if (!segment)
    return (
      <TabsContent value="note">
        <div className="py-4 flex justify-center items-center">
          <Button onClick={createSegment}>{t("startToNote")}</Button>
        </div>
      </TabsContent>
    );

  return (
    <TabsContent value="note">
      <div className="py-4">
        <SegmentNotes
          segment={segment}
          selectedIndices={selectedIndices}
          setSelectedIndices={setSelectedIndices}
        />
      </div>
    </TabsContent>
  );
}

const SegmentNotes = (props: {
  segment: SegmentType;
  selectedIndices: number[];
  setSelectedIndices: (indices: number[]) => void;
}) => {
  const { segment, selectedIndices, setSelectedIndices } = props;
  const [editingNote, setEditingNote] = useState<NoteType>();
  const { setCurrentNotes } = useContext(MediaPlayerProviderContext);

  const { notes, findNotes, hasMore } = useNotes({
    targetId: segment?.id,
    targetType: "Segment",
  });

  useEffect(() => {
    setCurrentNotes(notes || []);
  }, [notes]);

  if (!segment) return null;

  return (
    <div className="">
      {!editingNote && (
        <div className="mb-6">
          <NoteForm
            segment={segment}
            parameters={{ wordIndices: selectedIndices }}
            onParametersChange={(param) => {
              if (param.wordIndices) {
                setSelectedIndices(param.wordIndices);
              }
            }}
          />
        </div>
      )}

      <div className="space-y-4 mb-4">
        {notes.map((note) => (
          <div key={note.id} className="flex space-x-2">
            {editingNote?.id === note.id ? (
              <NoteForm
                segment={segment}
                parameters={{ wordIndices: selectedIndices }}
                onParametersChange={(param) => {
                  if (param.wordIndices) {
                    setSelectedIndices(param.wordIndices);
                  }
                }}
                note={note}
                onCancel={() => setEditingNote(null)}
                onSave={() => setEditingNote(null)}
              />
            ) : (
              <NoteCard note={note} onEdit={() => setEditingNote(note)} />
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center my-4">
          <Button
            variant="link"
            onClick={() => findNotes({ offset: notes.length })}
          >
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
};
