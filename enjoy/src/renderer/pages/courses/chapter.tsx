import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  toast,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@renderer/components/ui";
import {
  AppSettingsProviderContext,
  MediaPlayerProvider,
} from "@renderer/context";
import { t } from "i18next";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AudioPlayer,
  MarkdownWrapper,
  WavesurferPlayer,
} from "@renderer/components";
import {
  ChevronDownIcon,
  DownloadIcon,
  LoaderIcon,
  MicIcon,
} from "lucide-react";

export default () => {
  const { id, sequence } = useParams<{ id: string; sequence: string }>();
  const { webApi } = useContext(AppSettingsProviderContext);
  const [chapter, setChapter] = useState<ChapterType | null>(null);
  const [shadowing, setShadowing] = useState<AudioType>(null);

  const fetchChapter = async (id: string, sequence: string) => {
    webApi
      .coursechapter(id, sequence)
      .then((chapter) => setChapter(chapter))
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    fetchChapter(id, sequence);
  }, [id, sequence]);

  return (
    <MediaPlayerProvider>
      <div className="flex flex-col h-screen px-4 xl:px-6 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/courses">{t("sidebar.courses")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>
              <Link to={`/courses/${id}`}>{chapter?.course?.title || id}</Link>
            </BreadcrumbPage>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{chapter?.title || sequence}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex-1 h-[calc(100vh-5.75rem)] border rounded-lg">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50}>
              <ScrollArea className="px-4 py-3 h-full relative bg-muted">
                <ChapterContent chapter={chapter} onShadowing={setShadowing} />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <ScrollArea className="px-4 py-3">Conversation</ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <Sheet
          modal={false}
          open={Boolean(shadowing)}
          onOpenChange={(value) => {
            if (!value) setShadowing(null);
          }}
        >
          <SheetContent
            side="bottom"
            className="h-screen p-0"
            displayClose={false}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <SheetHeader className="flex items-center justify-center h-14">
              <SheetClose>
                <ChevronDownIcon />
              </SheetClose>
            </SheetHeader>

            {Boolean(shadowing) && <AudioPlayer id={shadowing.id} />}
          </SheetContent>
        </Sheet>
      </div>
    </MediaPlayerProvider>
  );
};

const ChapterContent = (props: {
  chapter: ChapterType;
  onShadowing: (audio: AudioType) => void;
}) => {
  const { chapter, onShadowing } = props;
  const { nativeLanguage } = useContext(AppSettingsProviderContext);
  const translation = chapter?.translations?.find(
    (t) => t.language === nativeLanguage
  );
  const [audios, setAudios] = useState<AudioType[]>([]);

  useEffect(() => {
    if (!chapter?.examples) return;

    const finished = audios.filter((a) => a.recordingsCount > 0);
    if (finished.length >= chapter.examples.length) {
      // TODO: finish chapter
    }
  }, [audios]);

  if (!chapter) return null;

  return (
    <div className="">
      <div className="flex items-center justify-end space-x-4 mb-4">
        {chapter.sequence > 1 && (
          <Link
            to={`/courses/${chapter.course.id}/chapters/${
              chapter.sequence - 1
            }`}
          >
            <button className="btn">{t("previousChapter")}</button>
          </Link>
        )}
        {chapter.course.chaptersCount > chapter.sequence + 1 && (
          <Link
            to={`/courses/${chapter.course.id}/chapters/${
              chapter.sequence + 1
            }`}
          >
            <button className="btn">{t("nextChapter")}</button>
          </Link>
        )}
      </div>
      <div className="select-text prose dark:prose-invert prose-em:font-bold prose-em:text-red-700 mx-auto">
        <h2>{chapter?.title}</h2>
        <MarkdownWrapper>{chapter?.content}</MarkdownWrapper>
        {translation && (
          <details>
            <summary>{t("translation")}</summary>
            <MarkdownWrapper>{translation.content}</MarkdownWrapper>
          </details>
        )}

        {chapter.examples.length > 0 && <h3>{t("examples")}</h3>}
        <div className="grid gap-4">
          {chapter.examples.map((example, index) => (
            <ExampleContent
              key={index}
              example={example}
              onShadowing={onShadowing}
              course={chapter.course}
              onAudio={(audio) => {
                if (!audio) return;
                const index = audios.findIndex((a) => a.id === audio.id);
                if (index >= 0) {
                  audios[index] = audio;
                } else {
                  audios.push(audio);
                }

                setAudios([...audios]);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ExampleContent = (props: {
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
