import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@renderer/components/ui";
import { SpeechPlayer, AudioDetail } from "@renderer/components";
import { useState, useEffect, useContext } from "react";
import {
  LoaderIcon,
  CopyIcon,
  CheckIcon,
  SpeechIcon,
  MicIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { t } from "i18next";
import { AppSettingsProviderContext } from "@renderer/context";
import Markdown from "react-markdown";

export const AssistantMessageComponent = (props: {
  message: MessageType;
  configuration: { [key: string]: any };
}) => {
  const { message, configuration } = props;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState<boolean>(false);
  const [speech, setSpeech] = useState<Partial<SpeechType>>(
    message.speeches?.[0]
  );
  const [speeching, setSpeeching] = useState<boolean>(false);
  const [resourcing, setResourcing] = useState<boolean>(false);
  const [shadowing, setShadowing] = useState<boolean>(false);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    if (speech) return;
    if (!configuration?.autoSpeech) return;

    createSpeech();
  }, [message, configuration]);

  const createSpeech = () => {
    if (speeching) return;

    setSpeeching(true);

    EnjoyApp.messages
      .createSpeech(message.id, {
        engine: configuration?.tts?.engine,
        model: configuration?.tts?.model,
        voice: configuration?.tts?.voice,
        baseUrl: configuration?.tts?.baseUrl,
      })
      .then((speech) => {
        setSpeech(speech);
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
      await EnjoyApp.audios.create(speech.filePath, {
        name:
          speech.text.length > 20
            ? speech.text.substring(0, 17).trim() + "..."
            : speech.text,
      });
      setResourcing(false);
    }

    setShadowing(true);
  };

  return (
    <div
      id={`message-${message.id}`}
      className="flex items-end space-x-2 pr-10"
    >
      <Avatar className="w-8 h-8 bg-background avatar">
        <AvatarImage></AvatarImage>
        <AvatarFallback className="bg-background">AI</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2 px-4 py-2 bg-background border rounded-lg shadow-sm w-full">
        {configuration?.autoSpeech && speeching ? (
          <div className="p-4">
            <LoaderIcon className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <Markdown
            className="select-text prose"
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

        <div className="flex items-center justify-start space-x-2">
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

          {!speech &&
            !configuration?.autoSpeech &&
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
                onClick={createSpeech}
                className="w-3 h-3 cursor-pointer"
              />
            ))}

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
                onClick={startShadow}
                className="w-3 h-3 cursor-pointer"
              />
            ))}
        </div>
      </div>

      <Sheet open={shadowing} onOpenChange={(value) => setShadowing(value)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl shadow-lg"
          displayClose={false}
        >
          <SheetHeader className="flex items-center justify-center -mt-4 mb-2">
            <SheetClose>
              <ChevronDownIcon />
            </SheetClose>
          </SheetHeader>

          {Boolean(speech) && <AudioDetail md5={speech.md5} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};
