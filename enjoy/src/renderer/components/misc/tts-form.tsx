import { useForm } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@renderer/components/ui";
import { LANGUAGES } from "@/constants";
import { t } from "i18next";
import { useContext } from "react";
import { AISettingsProviderContext } from "@renderer/context";

export const TTSForm = (props: { form: ReturnType<typeof useForm> }) => {
  const { form } = props;
  const { ttsProviders } = useContext(AISettingsProviderContext);

  return (
    <>
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
                  ttsProviders[form.watch("config.tts.engine") as string]
                    ?.models || []
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
              value={field.value as string}
              onValueChange={field.onChange}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder={t("selectTtsLanguage")} />
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
                        (form.watch("config.tts.model") as string)?.split(
                          "/"
                        )?.[0]
                      ]
                    : ttsProviders[form.watch("config.tts.engine") as string]
                        ?.voices) || []
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
                        <span className="capitalize">{voice.label}</span>
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
    </>
  );
};
