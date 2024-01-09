import * as z from "zod";
import { t } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  FormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Textarea,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";

const videoFormSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: t("form.lengthMustBeAtLeast", {
        field: t("models.video.name"),
        length: 3,
      }),
    })
    .max(50, {
      message: t("form.lengthMustBeLessThan", {
        field: t("models.video.name"),
        length: 50,
      }),
    }),
  description: z.string().optional(),
});

export const VideoEditForm = (props: {
  video: Partial<VideoType>;
  onCancel: () => void;
  onFinish: () => void;
}) => {
  const { video, onCancel, onFinish } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  if (!video) return null;

  const form = useForm<z.infer<typeof videoFormSchema>>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      name: video.name,
      description: video.description || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof videoFormSchema>) => {
    const { name, description } = data;
    await EnjoyApp.videos.update(video.id, {
      name,
      description,
    });
    onFinish();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.video.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("models.video.namePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("models.video.description")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("models.video.descriptionPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
};
