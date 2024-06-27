import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PingPoint,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@renderer/components/ui";
import { t } from "i18next";
import { LANGUAGES } from "@/constants";
import { ChevronDownIcon, ChevronUpIcon, LoaderIcon } from "lucide-react";
import { parseText } from "media-captions";

const transcriptionSchema = z.object({
  language: z.string(),
  service: z.string(),
  text: z.string().optional(),
});

export const TranscriptionCreateForm = (props: {
  onSubmit: (data: z.infer<typeof transcriptionSchema>) => void;
  originalText?: string;
  onCancel?: () => void;
  transcribing?: boolean;
  transcribingProgress?: number;
}) => {
  const {
    transcribing = false,
    transcribingProgress = 0,
    onSubmit,
    onCancel,
    originalText,
  } = props;
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);

  const form = useForm<z.infer<typeof transcriptionSchema>>({
    resolver: zodResolver(transcriptionSchema),
    values: {
      language: learningLanguage,
      service: whisperConfig.service,
      text: originalText,
    },
  });

  const parseSubtitle = (file: File) => {
    const fileType = file.name.split(".").pop();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let text = e.target.result;
        if (typeof text !== "string") {
          reject(new Error("Failed to read file"));
        }

        const caption = await parseText(text as string, {
          strict: false,
          type: fileType as "srt" | "vtt",
        });
        if (caption.cues.length === 0) {
          text = cleanSubtitleText(text as string);
        } else {
          text = caption.cues.map((cue) => cue.text).join("\n");
        }

        if (text.length === 0) {
          reject(new Error("No text found in the file"));
        }

        // Remove all content inside `()`
        text = text.replace(/\(.*?\)/g, "").trim();
        resolve(text);
      };

      reader.onerror = (e) => {
        reject(e);
      };

      reader.readAsText(file);
    });
  };

  const cleanSubtitleText = (text: string) => {
    // Remove all line starting with `#`
    // Remove all timestamps like `00:00:00,000` or `00:00:00.000 --> 00:00:00.000`
    // Remove all empty lines
    // Remove all lines with only spaces
    return text
      .replace(
        /(\d{2}:\d{2}:\d{2}[,\.]\d{3}(\s+-->\s+\d{2}:\d{2}:\d{2}[,\.]\d{3})?)\s+/g,
        ""
      )
      .replace(/#.*\n/g, "")
      .replace(/^\s*[\r\n]/gm, "")
      .replace(/^\s+$/gm, "");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="gap-4 grid w-full"
      >
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem className="grid w-full items-center gap-1.5">
              <FormLabel>{t("sttAiService")}</FormLabel>
              <Select
                disabled={transcribing}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">{t("local")}</SelectItem>
                  <SelectItem value="azure">{t("azureAi")}</SelectItem>
                  <SelectItem value="cloudflare">
                    {t("cloudflareAi")}
                  </SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="grid w-full items-center gap-1.5">
              <FormLabel>{t("language")}</FormLabel>
              <Select
                disabled={transcribing}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <CollapsibleContent>
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="grid w-full items-center gap-1.5">
                  <FormLabel>
                    {t("uploadTranscriptFile")}({t("optinal")})
                  </FormLabel>
                  <Input
                    disabled={transcribing}
                    type="file"
                    accept=".txt,.srt,.vtt"
                    onChange={async (event) => {
                      const file = event.target.files[0];

                      if (file) {
                        parseSubtitle(file)
                          .then((text) => {
                            field.onChange(text);
                          })
                          .catch((error) => {
                            toast.error(error.message);
                          });
                      } else {
                        field.onChange("");
                      }
                    }}
                  />
                  {field.value != undefined && (
                    <>
                      <FormLabel>{t("transcript")}</FormLabel>
                      <Textarea
                        className="h-36"
                        {...field}
                        disabled={transcribing}
                      />
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
          <div className="flex justify-center my-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className="">{t("moreOptions")}</span>
                {collapsibleOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </Collapsible>

        {transcribing && form.watch("service") === "local" && (
          <div className="mb-4">
            <div className="flex items-center space-x-4 mb-2">
              <PingPoint colorClassName="bg-yellow-500" />
              <span>{t("transcribing")}</span>
            </div>
            {whisperConfig.service === "local" && (
              <Progress value={transcribingProgress} />
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="reset" variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
          )}
          <Button disabled={transcribing} type="submit" variant="default">
            {transcribing && <LoaderIcon className="animate-spin w-4 mr-2" />}
            {t("transcribe")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
