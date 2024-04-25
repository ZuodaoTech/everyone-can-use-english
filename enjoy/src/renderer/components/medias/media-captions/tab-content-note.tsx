import { MediaPlayerProviderContext } from "@renderer/context";
import { Button, TabsContent, toast } from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import { NoteCard, NoteForm } from "@renderer/components";

/*
 * Note tab content.
 */
export const TabContentNote = (props: {
  currentSegmentIndex: number;
  selectedIndices: number[];
  setSelectedIndices: (indices: number[]) => void;
}) => {
  const { selectedIndices, setSelectedIndices } = props;
  const { currentSegment, createSegment, currentNotes } = useContext(
    MediaPlayerProviderContext
  );
  const [editingNote, setEditingNote] = useState<NoteType>();

  console.log("current notes ->", currentNotes);

  if (!currentSegment) {
    return (
      <TabsContent value="note">
        <div className="py-4 flex justify-center items-center">
          <Button size="sm" onClick={createSegment}>
            {t("startToNote")}
          </Button>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="note">
      <div className="py-4">
        <div className="">
          {!editingNote && (
            <div className="mb-6">
              <NoteForm
                segment={currentSegment}
                parameters={{ wordIndices: selectedIndices }}
                onParametersChange={(param) => {
                  if (param.wordIndices) {
                    setSelectedIndices(param.wordIndices);
                  }
                }}
              />
            </div>
          )}

          <div className="space-y-2 mb-4">
            {currentNotes.map((note) => (
              <div key={note.id} className="flex space-x-2">
                {editingNote?.id === note.id ? (
                  <NoteForm
                    segment={currentSegment}
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
        </div>
      </div>
    </TabsContent>
  );
};
