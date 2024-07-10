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
  ForwardIcon,
  LoaderIcon,
  SpeechIcon,
} from "lucide-react";
import { t } from "i18next";
import { useConversation } from "@renderer/hooks";
import { AppSettingsProviderContext } from "@/renderer/context";

export const LlmMessage = (props: { llmMessage: LlmMessageType }) => {
  const { llmMessage } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speech, setSpeech] = useState<Partial<SpeechType>>();
  const [speeching, setSpeeching] = useState<boolean>(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const { tts } = useConversation();

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
              <AvatarFallback className="bg-background">AI</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {llmMessage.agent.name}
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-2 mb-2 bg-background border rounded-lg shadow-sm max-w-full">
            <MarkdownWrapper className="select-text prose dark:prose-invert">
              {llmMessage.response}
            </MarkdownWrapper>
            {Boolean(speech) && <SpeechPlayer speech={speech} />}
            <div className="flex items-center space-x-2">
              {!speech &&
                (speeching ? (
                  <LoaderIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("creatingSpeech")}
                    className="w-3 h-3 animate-spin"
                  />
                ) : (
                  <SpeechIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("textToSpeech")}
                    data-testid="message-create-speech"
                    onClick={createSpeech}
                    className="w-3 h-3 cursor-pointer"
                  />
                ))}
              {copied ? (
                <CheckIcon className="w-3 h-3 text-green-500" />
              ) : (
                <CopyIcon
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={t("copyText")}
                  className="w-3 h-3 cursor-pointer"
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
                    className="w-3 h-3 cursor-pointer"
                  />
                }
              />
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
