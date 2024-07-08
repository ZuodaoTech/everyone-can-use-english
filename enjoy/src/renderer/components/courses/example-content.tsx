import { toast } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { MarkdownWrapper, WavesurferPlayer } from "@renderer/components";
import { DownloadIcon, LoaderIcon, MicIcon } from "lucide-react";

export const ExampleContent = (props: {
  example: ChapterType["examples"][0];
  onShadowing: (audio: AudioType) => void;
  course?: CourseType;
  onAudio?: (audio: AudioType) => void;
}) => {
  const { example, onShadowing, course, onAudio } = props;
  const { nativeLanguage, EnjoyApp } = useContext(AppSettingsProviderContext);
  const translation = example?.translations?.find(
    (t) => t.language === nativeLanguage
  );
  const [resourcing, setResourcing] = useState(false);
  const [audio, setAudio] = useState<AudioType | null>(null);

  const fetchAudio = async () => {
    if (!example) return;

    EnjoyApp.audios
      .findOne({
        source: example.audioUrl,
      })
      .then((audio) => {
        setAudio(audio);
        onAudio?.(audio);
      });
  };

  const startShadow = async () => {
    if (resourcing) return;

    if (audio) {
      onShadowing(audio);
      return;
    }
    setResourcing(true);

    const name =
      example.keywords.join(" ") + "-" + example.audioUrl.split("/").pop();
    EnjoyApp.audios
      .create(example.audioUrl, {
        name,
        originalText: example.content,
        coverUrl: course?.coverUrl,
      })
      .then((audio) => {
        if (!audio) return;

        setAudio(audio);

        if (audio.source !== example.audioUrl) {
          EnjoyApp.audios
            .update(audio.id, {
              name,
              coverUrl: course.coverUrl,
              source: example.audioUrl,
            })
            .finally(() => {
              onShadowing(audio);
            });
        } else {
          onShadowing(audio);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setResourcing(false);
      });
  };

  const handleDownload = async () => {
    const filename =
      example.keywords.join(" ") + "-" + example.audioUrl.split("/").pop();
    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: filename,
        filters: [
          {
            name: "Audio",
            extensions: [example.audioUrl.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(
          EnjoyApp.download.start(example.audioUrl, savePath as string),
          {
            success: () => t("downloadedSuccessfully"),
            error: t("downloadFailed"),
            position: "bottom-right",
          }
        );
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    fetchAudio();
  }, [example?.audioUrl]);

  if (!example) return null;

  return (
    <div className="flex flex-col gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm w-full">
      <MarkdownWrapper>{example.content}</MarkdownWrapper>
      {translation && (
        <details>
          <summary>{t("translation")}</summary>
          <MarkdownWrapper>{translation.content}</MarkdownWrapper>
        </details>
      )}
      <WavesurferPlayer id={example.id} src={example.audioUrl} />
      <div className="flex items-center justify-start space-x-2">
        {resourcing ? (
          <LoaderIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("addingResource")}
            className="w-3 h-3 animate-spin"
          />
        ) : (
          <MicIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("shadowingExercise")}
            data-testid="message-start-shadow"
            onClick={startShadow}
            className={`w-3 h-3 cursor-pointer ${
              audio && audio.recordingsCount > 0 ? "text-green-600" : ""
            }`}
          />
        )}
        <DownloadIcon
          data-tooltip-id="global-tooltip"
          data-tooltip-content={t("download")}
          data-testid="message-download-speech"
          onClick={handleDownload}
          className="w-3 h-3 cursor-pointer"
        />
      </div>
    </div>
  );
};
