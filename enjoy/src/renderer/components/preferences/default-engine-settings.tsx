import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  toast,
  Form,
  Button,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@renderer/components/ui";
import {
  AISettingsProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { GPT_PROVIDERS } from "@renderer/components";

export const DefaultEngineSettings = () => {
  const { currentGptEngine, setGptEngine, openai } = useContext(
    AISettingsProviderContext
  );
  const { webApi } = useContext(AppSettingsProviderContext);
  const [providers, setProviders] = useState<any>(GPT_PROVIDERS);
  const [editing, setEditing] = useState(false);

  const gptEngineSchema = z
    .object({
      name: z.enum(["enjoyai", "openai"]),
      models: z.object({
        default: z.string(),
        lookup: z.string().optional(),
        translate: z.string().optional(),
        analyze: z.string().optional(),
        extractStory: z.string().optional(),
      }),
    })
    .required();

  const form = useForm<z.infer<typeof gptEngineSchema>>({
    resolver: zodResolver(gptEngineSchema),
    values: {
      name: currentGptEngine.name as "enjoyai" | "openai",
      models: currentGptEngine.models || {},
    },
  });

  const modelOptions = () => {
    if (form.watch("name") === "openai") {
      const customModels = openai?.models?.split(",")?.filter(Boolean);

      return customModels?.length ? customModels : providers.openai.models;
    } else {
      return providers.enjoyai.models;
    }
  };

  const onSubmit = async (data: z.infer<typeof gptEngineSchema>) => {
    const { name, models } = data;

    let options = [...providers[name].models];
    if (name === "openai" && openai?.models) {
      options = openai.models.split(",");
    }

    models.default ||= options[0];
    Object.keys(models).forEach((key: keyof typeof models) => {
      if (!options.includes(models[key])) {
        if (key === "default") {
          models[key] = options[0];
        } else {
          delete models[key];
        }
      }
    });

    setGptEngine(data as GptEngineSettingType);
    setEditing(false);
  };

  useEffect(() => {
    webApi
      .config("gpt_providers")
      .then((data) => {
        setProviders(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="flex items-center mb-2">
              <span>{t("defaultAiEngine")}</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">
                        {t("aiEngine")}:
                      </FormLabel>
                      <Select
                        value={field.value}
                        disabled={!editing}
                        onValueChange={(value) => {
                          if (value === "openai" && !openai?.key) {
                            toast.warning(t("openaiKeyRequired"));
                          } else {
                            field.onChange(value);
                          }
                        }}
                      >
                        <SelectTrigger className="min-w-fit">
                          <SelectValue
                            placeholder={t("defaultAiEngine")}
                          ></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enjoyai">EnjoyAI</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground">
                      {form.watch("name") === "openai" && t("openAiEngineTips")}
                      {form.watch("name") === "enjoyai" &&
                        t("enjoyAiEngineTips")}
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="models.default"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">
                        {t("defaultAiModel")}:
                      </FormLabel>
                      <Select
                        value={field.value}
                        disabled={!editing}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="min-w-fit">
                          <SelectValue
                            placeholder={t("defaultAiModel")}
                          ></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions().map((model: string) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
              />
              {editing && (
                <>
                  <FormField
                    control={form.control}
                    name="models.lookup"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormLabel className="min-w-max">
                            {t("lookupAiModel")}:
                          </FormLabel>
                          <Select
                            value={field.value}
                            disabled={!editing}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="min-w-fit">
                              <SelectValue
                                placeholder={t("leaveEmptyToUseDefault")}
                              ></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelOptions().map((model: string) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="models.translate"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormLabel className="min-w-max">
                            {t("translateAiModel")}:
                          </FormLabel>
                          <Select
                            value={field.value}
                            disabled={!editing}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="min-w-fit">
                              <SelectValue
                                placeholder={t("leaveEmptyToUseDefault")}
                              ></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelOptions().map((model: string) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="models.analyze"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormLabel className="min-w-max">
                            {t("analyzeAiModel")}:
                          </FormLabel>
                          <Select
                            value={field.value}
                            disabled={!editing}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="min-w-fit">
                              <SelectValue
                                placeholder={t("leaveEmptyToUseDefault")}
                              ></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelOptions().map((model: string) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="models.extractStory"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-2">
                          <FormLabel className="min-w-max">
                            {t("extractStoryAiModel")}:
                          </FormLabel>
                          <Select
                            value={field.value}
                            disabled={!editing}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="min-w-fit">
                              <SelectValue
                                placeholder={t("leaveEmptyToUseDefault")}
                              ></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {modelOptions().map((model: string) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={editing ? "outline" : "secondary"}
              size="sm"
              type="reset"
              onClick={(event) => {
                event.preventDefault();
                form.reset();
                setEditing(!editing);
              }}
            >
              {editing ? t("cancel") : t("edit")}
            </Button>
            <Button className={editing ? "" : "hidden"} size="sm" type="submit">
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
