import { toast } from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  CourseProviderContext,
  DbProviderContext,
} from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { MarkdownWrapper, WavesurferPlayer } from "@renderer/components";
import { DownloadIcon, LoaderIcon, MicIcon } from "lucide-react";

export const ExampleContent = (props: {
  example: ChapterType["examples"][0];
  course?: CourseType;
  onAudio?: (audio: AudioType) => void;
}) => {
  const { nativeLanguage, EnjoyApp } = useContext(AppSettingsProviderContext);
  const { setShadowing } = useContext(CourseProviderContext);
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { example, course, onAudio } = props;
  const translation = example?.translations?.find(
    (t) => t.language === nativeLanguage
  );
  const [resourcing, setResourcing] = useState(false);
  const [audio, setAudio] = useState<AudioType | null>(null);

  const onAudioUpdate = (event: CustomEvent) => {
    const { model, action, record } = event.detail || {};
    if (
      model === "Audio" &&
      action === "create" &&
      record.source === example.audioUrl
    ) {
      setAudio(record);
      onAudio?.(record);
    } else if (model === "Recording" && audio?.id === record.targetId) {
      EnjoyApp.audios.findOne({ id: audio.id }).then((audio) => {
        setAudio(audio);
        onAudio?.(audio);
      });
    }
  };

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
      setShadowing(audio);
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
              setShadowing(audio);
            });
        } else {
          setShadowing(audio);
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

  useEffect(() => {
    addDblistener(onAudioUpdate);

    return () => {
      removeDbListener(onAudioUpdate);
    };
  }, [audio]);

  if (!example) return null;

  return (
    <div className="flex flex-col gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm w-full">
      <MarkdownWrapper className="max-w-full">
        {example.content}
      </MarkdownWrapper>
      {translation && (
        <details>
          <summary>{t("translation")}</summary>
          <MarkdownWrapper className="max-w-full">
            {translation.content}
          </MarkdownWrapper>
        </details>
      )}
      <WavesurferPlayer id={example.id} src={example.audioUrl} />
      <div className="flex items-center justify-start space-x-2">
        {resourcing ? (
          <LoaderIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("addingResource")}
            className="w-4 h-4 animate-spin"
          />
        ) : (
          <MicIcon
            data-tooltip-id="global-tooltip"
            data-tooltip-content={t("shadowingExercise")}
            data-testid="message-start-shadow"
            onClick={startShadow}
            className={`w-4 h-4 cursor-pointer ${
              audio && audio.recordingsCount > 0 ? "text-green-600" : ""
            }`}
          />
        )}
        <DownloadIcon
          data-tooltip-id="global-tooltip"
          data-tooltip-content={t("download")}
          data-testid="message-download-speech"
          onClick={handleDownload}
          className="w-4 h-4 cursor-pointer"
        />
      </div>
    </div>
  );
};
