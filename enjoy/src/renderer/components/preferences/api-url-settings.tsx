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
  Input,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState, useEffect } from "react";
import { InfoIcon } from "lucide-react";

export const ApiUrlSettings = () => {
  const { apiUrl, setApiUrl } = useContext(AppSettingsProviderContext);
  const [editing, setEditing] = useState(false);

  const apiConfigSchema = z.object({
    url: z.string().url(),
  });
  const form = useForm({
    mode: "onBlur",
    resolver: zodResolver(apiConfigSchema),
    values: {
      url: apiUrl,
    },
  });

  const onSubmit = async (data: z.infer<typeof apiConfigSchema>) => {
    setApiUrl(data.url).then(() => {
      toast.success(t("apiUrlUpdated"));
      setEditing(false);
    });
  };

  useEffect(() => {}, [apiUrl]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between space-x-2 py-4">
          <div className="">
            <div className="mb-2">{t("apiSettings")}</div>
            <div className="text-sm text-muted-foreground mb-2 ml-1">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        disabled={!editing}
                        placeholder="https://enjoy.bot"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="">
            <div className="flex items-center space-x-2 justify-end mb-2">
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
            </div>
            <div className="text-xs text-muted-foreground text-right">
              <InfoIcon className="mr-1 w-3 h-3 inline" />
              <span>{t("reloadIsNeededAfterChanged")}</span>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};
