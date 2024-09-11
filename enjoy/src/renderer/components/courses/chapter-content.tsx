import { toast, Button } from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExampleContent, MarkdownWrapper } from "@renderer/components";
import { CheckCircleIcon, UsersIcon } from "lucide-react";

export const ChapterContent = (props: {
  chapter: ChapterType;
  onUpdate?: () => void;
}) => {
  const { webApi, nativeLanguage } = useContext(AppSettingsProviderContext);
  const { chapter, onUpdate } = props;
  const translation = chapter?.translations?.find(
    (t) => t.language === nativeLanguage
  );
  const [audios, setAudios] = useState<AudioType[]>([]);

  useEffect(() => {
    if (chapter?.finished) return;
    if (audios.length === 0) return;
    if (!chapter?.examples) return;

    const finished = audios.filter((a) => a.recordingsCount > 0);
    if (finished.length === 0) return;
    if (chapter.examples.length === 0) return;

    if (finished.length >= chapter.examples.length) {
      webApi
        .finishCourseChapter(chapter.course.id, chapter.sequence)
        .then(() => onUpdate?.())
        .catch((err) => {
          toast.error(err.message);
        });
    }
  }, [audios]);

  useEffect(() => {
    setAudios([]);
  }, [chapter]);

  if (!chapter) return null;

  return (
    <div className="">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon
            className={`w-4 h-4 ${chapter.finished ? "text-green-600" : ""}`}
          />

          {typeof chapter.finishesCount === "number" &&
            chapter.finishesCount > 0 && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <UsersIcon className="w-4 h-4" />
                <span className="text-sm">{chapter.finishesCount}</span>
              </div>
            )}
        </div>
        <div className="flex items-center space-x-2">
          {chapter.sequence > 1 && (
            <Link
              to={`/courses/${chapter.course.id}/chapters/${
                chapter.sequence - 1
              }`}
            >
              <Button variant="outline" size="sm">
                {t("previousChapter")}
              </Button>
            </Link>
          )}
          {chapter.course.chaptersCount > chapter.sequence + 1 && (
            <Link
              to={`/courses/${chapter.course.id}/chapters/${
                chapter.sequence + 1
              }`}
            >
              <Button variant="outline" size="sm">
                {t("nextChapter")}
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="select-text max-w-full prose dark:prose-invert prose-em:font-bold prose-em:text-red-700">
        <h2>
          {chapter.sequence}. {chapter?.title}
        </h2>
        <MarkdownWrapper className="max-w-full">
          {chapter?.content}
        </MarkdownWrapper>
        {translation && (
          <details>
            <summary>{t("translation")}</summary>
            <MarkdownWrapper className="max-w-full">
              {translation.content}
            </MarkdownWrapper>
          </details>
        )}

        {chapter.examples.length > 0 && (
          <>
            <h3>{t("examples")}</h3>
            <div className="text-sm mb-4">{t("howToFinishChapter")}</div>
          </>
        )}
        <div className="grid gap-4">
          {chapter.examples.map((example, index) => (
            <ExampleContent
              key={index}
              example={example}
              course={chapter.course}
              onAudio={(audio) => {
                setAudios((audios) => {
                  if (!audio) return [];

                  const index = audios.findIndex((a) => a.id === audio.id);
                  if (index >= 0) {
                    audios[index] = audio;
                  } else {
                    audios.push(audio);
                  }
                  return [...audios];
                });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
