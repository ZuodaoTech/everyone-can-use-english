import { useState, useContext } from "react";
import { RecordButton, SpeechPlayer } from "@renderer/components";
import {
  Button,
  Textarea,
  Dialog,
  DialogContent,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderIcon } from "lucide-react";
import { t } from "i18next";

export const SpeechForm = (props: {
  lastMessage?: MessageType;
  onSubmit: (content: string, file: string) => void;
}) => {
  const { lastMessage, onSubmit } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [transcribing, setTranscribing] = useState(false);
  const [editting, setEditting] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState("");

  const handleCancel = () => {
    setEditting(false);
    setContent("");
    setFile("");
  };

  const handleSubmit = () => {
    if (!content) return;
    onSubmit(content, file);
    handleCancel();
  };

  return (
    <>
      <RecordButton
        disabled={false}
        onRecordEnd={async (blob, _duration) => {
          setTranscribing(true);
          setEditting(true);
          EnjoyApp.whisper
            .transcribe(
              {
                type: blob.type.split(";")[0],
                arrayBuffer: await blob.arrayBuffer(),
              },
              lastMessage?.content
            )
            .then(({ content, file }) => {
              setContent(content);
              setFile(file);
            })
            .finally(() => {
              setTranscribing(false);
            });
        }}
      />
      <Dialog
        open={editting}
        onOpenChange={(value) => {
          setEditting(value);
        }}
      >
        <DialogContent>
          {transcribing ? (
            <div className="flex items-center justify-center p-6">
              <LoaderIcon className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="">
              <div className="my-4">
                <Textarea
                  className="w-full h-36"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              {file && (
                <div className="mb-4">
                  <SpeechPlayer speech={{ playSource: "enjoy://" + file }} />
                </div>
              )}
              <div className="flex items-center justify-end space-x-2">
                <Button variant="secondary" onClick={handleCancel}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSubmit}>{t("send")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
