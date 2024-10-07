import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  toast,
} from "@renderer/components/ui";
import {
  ConversationShortcuts,
  MarkdownWrapper,
  SpeechPlayer,
} from "@renderer/components";
import { formatDateTime } from "@renderer/lib/utils";
import { useContext, useEffect, useState } from "react";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ForwardIcon,
  LanguagesIcon,
  LoaderIcon,
  MicIcon,
  SpeechIcon,
} from "lucide-react";
import { t } from "i18next";
import { useAiCommand, useSpeech } from "@renderer/hooks";
import {
  AppSettingsProviderContext,
  CourseProviderContext,
} from "@renderer/context";
import { md5 } from "js-md5";

export const LlmMessage = (props: { llmMessage: LlmMessageType }) => {
  const { llmMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { setShadowing } = useContext(CourseProviderContext);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speech, setSpeech] = useState<Partial<SpeechType>>();
  const [speeching, setSpeeching] = useState<boolean>(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const { tts } = useSpeech();
  const { summarizeTopic, translate } = useAiCommand();
  const [translation, setTranslation] = useState<string>();
  const [translating, setTranslating] = useState<boolean>(false);

  const createSpeech = () => {
    if (speeching) return;

    setSpeeching(true);

    tts({
      sourceType: "LlmMessage",
      sourceId: llmMessage.id,
      text: llmMessage.response,
      configuration: {
        engine: "enjoyai",
        model: "tts-1",
        voice: "alloy",
      },
    })
      .then((speech) => {
        setSpeech(speech);
      })
      .catch((err) => {
        toast.error(err.message);
      })
      .finally(() => {
        setSpeeching(false);
      });
  };

  const findSpeech = () => {
    if (!llmMessage.id) return;
    EnjoyApp.speeches
      .findOne({
        sourceType: "LlmMessage",
        sourceId: llmMessage.id,
      })
      .then((speech) => {
        setSpeech(speech);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const startShadow = async () => {
    if (resourcing) return;

    const audio = await EnjoyApp.audios.findOne({
      md5: speech.md5,
    });

    if (!audio) {
      setResourcing(true);
      let title =
        speech.text.length > 20
          ? speech.text.substring(0, 17).trim() + "..."
          : speech.text;

      try {
        title = await summarizeTopic(speech.text);
      } catch (e) {
        console.warn(e);
      }

      EnjoyApp.audios
        .create(speech.filePath, {
          name: title,
          originalText: speech.text,
        })
        .then((audio) => setShadowing(audio))
        .catch((err) => toast.error(t(err.message)))
        .finally(() => {
          setResourcing(false);
        });
    }

    setShadowing(audio);
  };

  const handleDownload = async () => {
    EnjoyApp.dialog
      .showSaveDialog({
        title: t("download"),
        defaultPath: speech.filename,
        filters: [
          {
            name: "Audio",
            extensions: [speech.filename.split(".").pop()],
          },
        ],
      })
      .then((savePath) => {
        if (!savePath) return;

        toast.promise(EnjoyApp.download.start(speech.src, savePath as string), {
          success: () => t("downloadedSuccessfully"),
          error: t("downloadFailed"),
          position: "bottom-right",
        });
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const handleTranslate = async () => {
    if (translating) return;
    if (!llmMessage.response) return;

    const cacheKey = `translate-${md5(llmMessage.response)}`;
    try {
      const cached = await EnjoyApp.cacheObjects.get(cacheKey);

      if (cached && !translation) {
        setTranslation(cached);
      } else {
        setTranslating(true);
        const result = await translate(llmMessage.response, cacheKey);
        setTranslation(result);
        setTranslating(false);
      }
    } catch (err) {
      toast.error(err.message);
      setTranslating(false);
    }
  };

  useEffect(() => {
    findSpeech();
  }, []);

  return (
    <>
      {llmMessage.query && (
        <div id={`llm-message-${llmMessage.id}-query`} className="mb-6">
          <div className="flex items-center space-x-2 justify-end mb-2">
            <div className="text-sm text-muted-foreground">
              {llmMessage.user.name}
            </div>
            <Avatar className="w-8 h-8 bg-background avatar">
              <AvatarImage src={llmMessage.user.avatarUrl}></AvatarImage>
              <AvatarFallback className="bg-background">
                {llmMessage.user.name}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-sky-500/30 border-sky-500 rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.query}
            </MarkdownWrapper>
          </div>
          {llmMessage.createdAt && (
            <div className="flex justify-end text-xs text-muted-foreground timestamp">
              {formatDateTime(llmMessage.createdAt)}
            </div>
          )}
        </div>
      )}
      {llmMessage.response && (
        <div id={`llm-message-${llmMessage.id}-response`} className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="w-8 h-8 bg-background avatar">
              <AvatarImage src={llmMessage.agent.avatarUrl}></AvatarImage>
              <AvatarFallback className="bg-background">
                {llmMessage.agent.name}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {llmMessage.agent.name}
            </div>
          </div>
          <div className="flex flex-col gap-4 px-4 py-2 mb-2 bg-background border rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text max-w-full">
              {llmMessage.response}
            </MarkdownWrapper>
            {translation && (
              <MarkdownWrapper className="select-text max-w-full">
                {translation}
              </MarkdownWrapper>
            )}
            {Boolean(speech) && <SpeechPlayer speech={speech} />}
            <div className="flex items-center space-x-4">
              {translating ? (
                <LoaderIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("creatingSpeech")}
                  className="w-4 h-4 animate-spin"
                />
              ) : (
                <LanguagesIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("translation")}
                  className="w-4 h-4 cursor-pointer"
                  onClick={handleTranslate}
                />
              )}
              {llmMessage.id &&
                !speech &&
                (speeching ? (
                  <LoaderIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("creatingSpeech")}
                    className="w-4 h-4 animate-spin"
                  />
                ) : (
                  <SpeechIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("textToSpeech")}
                    data-testid="message-create-speech"
                    onClick={createSpeech}
                    className="w-4 h-4 cursor-pointer"
                  />
                ))}
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <CopyIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("copyText")}
                  className="w-4 h-4 cursor-pointer"
                  onClick={() => {
                    copyToClipboard(llmMessage.response);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 3000);
                  }}
                />
              )}
              <ConversationShortcuts
                prompt={llmMessage.response}
                excludedIds={[]}
                trigger={
                  <ForwardIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("forward")}
                    className="w-4 h-4 cursor-pointer"
                  />
                }
              />
              {Boolean(speech) &&
                (resourcing ? (
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
                    className="w-4 h-4 cursor-pointer"
                  />
                ))}
              {Boolean(speech) && (
                <DownloadIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("download")}
                  data-testid="llm-message-download-speech"
                  onClick={handleDownload}
                  className="w-4 h-4 cursor-pointer"
                />
              )}
            </div>
          </div>
          {llmMessage.createdAt && (
            <div className="flex justify-start text-xs text-muted-foreground timestamp">
              {formatDateTime(llmMessage.createdAt)}
            </div>
          )}
        </div>
      )}
    </>
  );
};
