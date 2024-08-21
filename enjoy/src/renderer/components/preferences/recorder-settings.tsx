import { t } from "i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input,
  Switch,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const RecorderSettings = () => {
  const [editing, setEditing] = useState(false);
  const { recorderConfig, setRecorderConfig } = useContext(
    AppSettingsProviderContext
  );

  const recorderConfigSchema = z.object({
    autoGainControl: z.boolean(),
    echoCancellation: z.boolean(),
    noiseSuppression: z.boolean(),
    sampleRate: z.number(),
    sampleSize: z.number(),
  });

  const form = useForm<z.infer<typeof recorderConfigSchema>>({
    resolver: zodResolver(recorderConfigSchema),
    values: recorderConfig,
  });

  const onSubmit = async (data: z.infer<typeof recorderConfigSchema>) => {
    setRecorderConfig({
      ...recorderConfig,
      ...data,
    })
      .then(() => toast.success(t("recorderConfigSaved")))
      .finally(() => setEditing(false));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="mb-4">{t("recorderConfig")}</div>
            <div className="text-sm text-muted-foreground mb-3">
              {t("recorderConfigDescription")}
            </div>
            <div
              className={`text-sm text-muted-foreground space-y-3 ${
                editing ? "" : "hidden"
              }`}
            >
              <FormField
                control={form.control}
                name="autoGainControl"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">
                        autoGainControl
                      </FormLabel>
                      <FormControl>
                        <Switch
                          disabled={!editing}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="echoCancellation"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">
                        echoCancellation
                      </FormLabel>
                      <FormControl>
                        <Switch
                          disabled={!editing}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="noiseSuppression"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">
                        noiseSuppression
                      </FormLabel>
                      <FormControl>
                        <Switch
                          disabled={!editing}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sampleRate"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">sampleRate</FormLabel>
                      <FormControl>
                        <Input disabled={!editing} {...field} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sampleSize"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel className="min-w-max">sampleSize</FormLabel>
                      <FormControl>
                        <Input disabled={!editing} {...field} />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
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
