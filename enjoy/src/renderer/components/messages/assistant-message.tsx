import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
  toast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@renderer/components/ui";
import {
  SpeechPlayer,
  AudioPlayer,
  ConversationShortcuts,
} from "@renderer/components";
import { useState, useEffect, useContext } from "react";
import {
  LoaderIcon,
  CopyIcon,
  CheckIcon,
  SpeechIcon,
  MicIcon,
  ChevronDownIcon,
  ForwardIcon,
  AlertCircleIcon,
  MoreVerticalIcon,
  DownloadIcon,
} from "lucide-react";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import Markdown from "react-markdown";
import { useConversation, useAiCommand } from "@renderer/hooks";

export const AssistantMessageComponent = (props: {
  message: MessageType;
  configuration: { [key: string]: any };
  onRemove: () => void;
}) => {
  const { message, configuration, onRemove } = props;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speech, setSpeech] = useState<Partial<SpeechType>>(
    message.speeches?.[0]
  );
  const [speeching, setSpeeching] = useState<boolean>(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const [shadowing, setShadowing] = useState<boolean>(false);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { tts } = useConversation();
  const { summarizeTopic } = useAiCommand();

  useEffect(() => {
    if (speech) return;
    if (configuration?.type !== "tts") return;

    findOrCreateSpeech();
  }, [message]);

  const findOrCreateSpeech = async () => {
    const msg = await EnjoyApp.messages.findOne({ id: message.id });
    if (msg && msg.speeches.length > 0) {
      setSpeech(msg.speeches[0]);
    } else {
      createSpeech();
    }
  };

  const createSpeech = () => {
    if (speeching) return;

    setSpeeching(true);

    tts({
      sourceType: "Message",
      sourceId: message.id,
      text: message.content,
      configuration: configuration.tts,
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

      await EnjoyApp.audios.create(speech.filePath, {
        name: title,
        originalText: speech.text,
      });
      setResourcing(false);
    }

    setShadowing(true);
  };

  const handleDownload = async () => {
    if (!speech) return;

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
          loading: t("downloading", { file: speech.filename }),
          success: () => t("downloadedSuccessfully"),
          error: t("downloadFailed"),
          position: "bottom-right",
        });
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  return (
    <div
      id={`message-${message.id}`}
      className="ai-message flex items-end space-x-2 pr-10"
    >
      <Avatar className="w-8 h-8 bg-background avatar">
        <AvatarImage></AvatarImage>
        <AvatarFallback className="bg-background">AI</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm w-full">
        {configuration.type === "tts" &&
          (speeching ? (
            <div className="text-muted-foreground text-sm py-2">
              <span>{t("creatingSpeech")}</span>
            </div>
          ) : (
            !speech && (
              <div className="text-muted-foreground text-sm py-2 flex items-center">
                <AlertCircleIcon className="w-4 h-4 mr-2 text-yellow-600" />
                <span>{t("speechNotCreatedYet")}</span>
              </div>
            )
          ))}

        {configuration.type === "gpt" && (
          <Markdown
            className="message-content select-text prose dark:prose-invert"
            data-source-type="Message"
            data-source-id={message.id}
            components={{
              a({ node, children, ...props }) {
                try {
                  new URL(props.href ?? "");
                  props.target = "_blank";
                  props.rel = "noopener noreferrer";
                } catch (e) {}

                return <a {...props}>{children}</a>;
              },
            }}
          >
            {message.content}
          </Markdown>
        )}

        {Boolean(speech) && <SpeechPlayer speech={speech} />}

        <DropdownMenu>
          <div className="flex items-center justify-start space-x-2">
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

            {configuration.type === "gpt" && (
              <>
                {copied ? (
                  <CheckIcon className="w-3 h-3 text-green-500" />
                ) : (
                  <CopyIcon
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("copyText")}
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => {
                      copyToClipboard(message.content);
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                      }, 3000);
                    }}
                  />
                )}
                <ConversationShortcuts
                  prompt={message.content}
                  excludedIds={[message.conversationId]}
                  trigger={
                    <ForwardIcon
                      data-tooltip-id="global-tooltip"
                      data-tooltip-content={t("forward")}
                      className="w-3 h-3 cursor-pointer"
                    />
                  }
                />
              </>
            )}

            {Boolean(speech) &&
              (resourcing ? (
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
                  className="w-3 h-3 cursor-pointer"
                />
              ))}
            {Boolean(speech) && (
              <DownloadIcon
                data-tooltip-id="global-tooltip"
                data-tooltip-content={t("download")}
                data-testid="message-download-speech"
                onClick={handleDownload}
                className="w-3 h-3 cursor-pointer"
              />
            )}

            <DropdownMenuTrigger>
              <MoreVerticalIcon className="w-3 h-3" />
            </DropdownMenuTrigger>
          </div>

          <DropdownMenuContent>
            <DropdownMenuItem className="cursor-pointer" onClick={onRemove}>
              <span className="mr-auto text-destructive capitalize">
                {t("delete")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet
        modal={false}
        open={shadowing}
        onOpenChange={(value) => setShadowing(value)}
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

          {Boolean(speech) && shadowing && <AudioPlayer md5={speech.md5} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};
