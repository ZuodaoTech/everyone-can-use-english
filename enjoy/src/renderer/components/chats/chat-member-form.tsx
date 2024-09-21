import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Textarea,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useContext, useState } from "react";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
  ChatProviderContext,
} from "@renderer/context";
import { CHAT_SYSTEM_PROMPT_TEMPLATE, LANGUAGES } from "@/constants";
import Mustache from "mustache";
import { SttEngineOptionEnum } from "@/types/enums";

export const ChatMemberForm = (props: {
  member: Partial<ChatMemberType>;
  onSave: (data: Partial<ChatMemberType>) => void;
}) => {
  const { member, onSave } = props;
  const { learningLanguage } = useContext(AppSettingsProviderContext);
  const { gptProviders, ttsProviders } = useContext(AISettingsProviderContext);
  const chatMemberFormSchema = z.object({
    userId: z.string(),
    userType: z.enum(["User", "ChatAgent"]).default("ChatAgent"),
    config: z.object({
      prompt: z.string().optional(),
      introduction: z.string().optional(),
      gpt: z.object({} as GptConfigType),
      tts: z.object({} as TtsConfigType),
    }),
  });

  const form = useForm<z.infer<typeof chatMemberFormSchema>>({
    resolver: zodResolver(chatMemberFormSchema),
    values: member,
  });

  const onSubmit = form.handleSubmit(
    (data: z.infer<typeof chatMemberFormSchema>) => {
      onSave(data as Partial<ChatMemberType>);
    }
  );

  return (
    <Form {...form}>
      <form onChange={onSubmit} onSubmit={onSubmit}>
        <Accordion defaultValue="gpt" type="single" collapsible>
          <AccordionItem value="gpt">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.gptSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={form.control}
                name="config.gpt.engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gpt.engine")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectAiEngine")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(gptProviders).map((key) => (
                          <SelectItem key={key} value={key}>
                            {gptProviders[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {gptProviders[field.value as string]?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.gpt.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gpt.model")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectAiModel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          gptProviders[
                            form.watch("config.gpt.engine") as string
                          ]?.models || []
                        ).map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.gpt.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("gpt.temperature")}</FormLabel>
                    <div className="flex items-center space-x-1">
                      <Slider
                        className="flex-1"
                        onValueChange={(value) => field.onChange(value[0])}
                        value={[field.value as number]}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                      <span>{field.value as number}</span>
                    </div>
                    <FormDescription>
                      {t("gpt.temperatureDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tts">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.ttsSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={form.control}
                name="config.tts.engine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.engine")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsEngine")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(ttsProviders).map((key) => (
                          <SelectItem key={key} value={key}>
                            {ttsProviders[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.tts.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.model")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsModel")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          ttsProviders[
                            form.watch("config.tts.engine") as string
                          ]?.models || []
                        ).map((model: string) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.tts.language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.language")}</FormLabel>
                    <Select
                      required
                      defaultValue={learningLanguage}
                      value={field.value as string}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue>
                          {
                            LANGUAGES.find((lang) => lang.code === field.value)
                              ?.name
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem
                            className="text-xs"
                            value={lang.code}
                            key={lang.code}
                          >
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="config.tts.voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tts.voice")}</FormLabel>
                    <Select
                      required
                      onValueChange={field.onChange}
                      defaultValue={field.value as string}
                      value={field.value as string}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectTtsVoice")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(
                          (form.watch("config.tts.engine") === "enjoyai"
                            ? ttsProviders.enjoyai.voices[
                                (
                                  form.watch("config.tts.model") as string
                                )?.split("/")?.[0]
                              ]
                            : ttsProviders[
                                form.watch("config.tts.engine") as string
                              ]?.voices) || []
                        ).map((voice: any) => {
                          if (typeof voice === "string") {
                            return (
                              <SelectItem key={voice} value={voice}>
                                <span className="capitalize">{voice}</span>
                              </SelectItem>
                            );
                          } else if (
                            voice.language === form.watch("config.tts.language")
                          ) {
                            return (
                              <SelectItem key={voice.value} value={voice.value}>
                                <span className="capitalize">
                                  {voice.label}
                                </span>
                              </SelectItem>
                            );
                          }
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="more">
            <AccordionTrigger className="text-muted-foreground">
              {t("models.chatMember.moreSettings")}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 px-2">
              <FormField
                control={form.control}
                name="config.prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("models.chatMember.prompt")}</FormLabel>
                    <Textarea required className="max-h-48" {...field} />
                    <FormDescription>
                      {t("models.chatMember.promptDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </Form>
  );
};
