import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";
import {
  Button,
  Form,
  FormField,
  FormItem,
  FormControl,
  Switch,
  Input,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";

export const ProxySettings = () => {
  const { proxy, setProxy } = useContext(AppSettingsProviderContext);
  const [editing, setEditing] = useState(false);

  const proxyConfigSchema = z.object({
    enabled: z.boolean(),
    url: z.string().url(),
  });
  const form = useForm({
    mode: "onBlur",
    resolver: zodResolver(proxyConfigSchema),
    values: {
      enabled: proxy?.enabled,
      url: proxy?.url,
    },
  });

  const onSubmit = async (data: z.infer<typeof proxyConfigSchema>) => {
    if (!data.url) {
      data.enabled = false;
    }

    setProxy({
      enabled: data.enabled,
      url: data.url,
    })
      .then(() => {
        toast.success(t("proxyConfigUpdated"));
      })
      .finally(() => {
        setEditing(false);
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="mb-2">{t("proxySettings")}</div>
            <div className="text-sm text-muted-foreground mb-2 ml-1">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="http://proxy:port"
                        disabled={!editing}
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            {editing ? (
              <>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    setEditing(!editing);
                    e.preventDefault();
                  }}
                  size="sm"
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="default"
                  onClick={() => onSubmit(form.getValues())}
                  size="sm"
                >
                  {t("save")}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={(e) => {
                  setEditing(!editing);
                  e.preventDefault();
                }}
                size="sm"
              >
                {t("edit")}
              </Button>
            )}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      disabled={!form.getValues("url")}
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e);
                        onSubmit(form.getValues());
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
