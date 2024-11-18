import { t } from "i18next";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WHISPER_MODELS } from "@/constants";

const echogardenSttConfigSchema = z.object({
  engine: z.enum(["whisper", "whisper.cpp"]),
  whisper: z.object({
    model: z.string(),
    temperature: z.number(),
    prompt: z.string(),
    encoderProvider: z.enum(["cpu", "dml", "cuda"]),
    decoderProvider: z.enum(["cpu", "dml", "cuda"]),
  }),
  whisperCpp: z.object({
    model: z.string(),
    temperature: z.number(),
    prompt: z.string(),
    enableGPU: z.boolean(),
  }),
});

export const EchogardenSttSettings = (props: {
  echogardenSttConfig: EchogardenSttConfigType;
  onSave: (data: z.infer<typeof echogardenSttConfigSchema>) => void;
}) => {
  const { echogardenSttConfig, onSave } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [platformInfo, setPlatformInfo] = useState<{
    platform: string;
    arch: string;
    version: string;
  }>();
  const [packagesDir, setPackagesDir] = useState<string>();

  const form = useForm<z.infer<typeof echogardenSttConfigSchema>>({
    resolver: zodResolver(echogardenSttConfigSchema),
    values: {
      engine: echogardenSttConfig?.engine,
      whisper: {
        model: "tiny",
        temperature: 0.1,
        prompt: "",
        encoderProvider: "cpu",
        decoderProvider: "cpu",
        ...echogardenSttConfig?.whisper,
      },
      whisperCpp: {
        model: "tiny",
        temperature: 0.1,
        prompt: "",
        enableGPU: false,
        ...echogardenSttConfig?.whisperCpp,
      },
    },
  });

  const onSubmit = async (data: z.infer<typeof echogardenSttConfigSchema>) => {
    onSave({
      engine: data.engine || "whisper",
      whisper: {
        model: data.whisper.model || "tiny",
        ...data.whisper,
      },
      whisperCpp: {
        model: data.whisperCpp.model || "tiny",
        ...data.whisperCpp,
      },
    });
  };

  const handleOpenPackagesDir = () => {
    if (!packagesDir) return;
    EnjoyApp.shell.openPath(packagesDir);
  };

  useEffect(() => {
    EnjoyApp.app.getPlatformInfo().then(setPlatformInfo);
    EnjoyApp.echogarden.getPackagesDir().then(setPackagesDir);
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="text-sm text-muted-foreground space-y-3 mb-4">
          <FormField
            control={form.control}
            name="engine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("engine")}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="min-w-fit">
                      <SelectValue placeholder="engine"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper">Whisper</SelectItem>
                      <SelectItem
                        value="whisper.cpp"
                      >
                        Whisper.cpp
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  {form.watch("engine") === "whisper"
                    ? t("whisperEngineDescription")
                    : t("whisperCppEngineDescription")}
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whisper.model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("model")}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="min-w-fit">
                      <SelectValue placeholder="model"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {WHISPER_MODELS.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>
                  {t("whisperModelDescription")}
                  {packagesDir && (
                    <Button
                      size="icon"
                      variant="link"
                      className="ml-2"
                      type="button"
                      onClick={handleOpenPackagesDir}
                    >
                      {t("openPackagesDir")}
                    </Button>
                  )}
                </FormDescription>
              </FormItem>
            )}
          />

          {form.watch("engine") === "whisper" && (
            <>
              <FormField
                control={form.control}
                name="whisper.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("temperature")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={1}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whisper.prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("prompt")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("prompt")} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whisper.encoderProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("encoderProvider")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="min-w-fit">
                          <SelectValue placeholder="provider"></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpu">CPU</SelectItem>
                          <SelectItem
                            disabled={platformInfo?.platform !== "win32"}
                            value="dml"
                          >
                            DML
                          </SelectItem>
                          <SelectItem
                            disabled={platformInfo?.platform !== "linux"}
                            value="cuda"
                          >
                            CUDA
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whisper.decoderProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("decoderProvider")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="min-w-fit">
                          <SelectValue placeholder="provider"></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cpu">CPU</SelectItem>
                          <SelectItem
                            disabled={platformInfo?.platform !== "win32"}
                            value="dml"
                          >
                            DML
                          </SelectItem>
                          <SelectItem
                            disabled={platformInfo?.platform !== "linux"}
                            value="cuda"
                          >
                            CUDA
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}

          {form.watch("engine") === "whisper.cpp" && (
            <>
              <FormField
                control={form.control}
                name="whisperCpp.temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("temperature")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={1}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whisperCpp.prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("prompt")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("prompt")} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whisperCpp.enableGPU"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>{t("enableGPU")}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button size="sm" type="submit">
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
