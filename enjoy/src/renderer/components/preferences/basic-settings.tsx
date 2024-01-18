import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  FormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Label,
  Separator,
  toast,
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@renderer/components/ui";
import { WhisperModelOptions, LLM_PROVIDERS } from "@renderer/components";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext, useState, useRef, useEffect } from "react";
import { redirect } from "react-router-dom";
import { InfoIcon, EditIcon } from "lucide-react";

export const BasicSettings = () => {
  return (
    <div className="">
      <div className="font-semibold mb-4 capitilized">{t("basicSettings")}</div>
      <UserSettings />
      <Separator />
      <LanguageSettings />
      <Separator />
      <LibraryPathSettings />
      <Separator />
      <FfmpegSettings />
      <Separator />
      <WhisperSettings />
      <Separator />
      <OpenaiSettings />
      <Separator />
      <GoogleGenerativeAiSettings />
      <Separator />
    </div>
  );
};

export const UserSettings = () => {
  const { user, logout } = useContext(AppSettingsProviderContext);

  if (!user) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="text-xl">
              {user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.id}</div>
          </div>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="text-destructive" size="sm">
            {t("logout")}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logout")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {t("logoutConfirmation")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive-hover"
              onClick={() => {
                logout();
                redirect("/");
              }}
            >
              {t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const LanguageSettings = () => {
  const { language, switchLanguage } = useContext(AppSettingsProviderContext);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("language")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {language === "en" ? "English" : "简体中文"}
        </div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Select
            value={language}
            onValueChange={(value: "en" | "zh-CN") => {
              switchLanguage(value);
            }}
          >
            <SelectTrigger className="text-xs">
              <SelectValue>
                {language === "en" ? "English" : "简体中文"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-xs" value="en">
                English
              </SelectItem>
              <SelectItem className="text-xs" value="zh-CN">
                简体中文
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const LibraryPathSettings = () => {
  const { libraryPath, EnjoyApp } = useContext(AppSettingsProviderContext);

  const handleChooseLibraryPath = async () => {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (filePaths) {
      EnjoyApp.settings.setLibrary(filePaths[0]);
      const _library = await EnjoyApp.settings.getLibrary();
      if (_library !== libraryPath) {
        EnjoyApp.app.relaunch();
      }
    }
  };

  const openLibraryPath = async () => {
    if (libraryPath) {
      await EnjoyApp.shell.openPath(libraryPath);
    }
  };

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("libraryPath")}</div>
        <div className="text-sm text-muted-foreground mb-2">{libraryPath}</div>
      </div>

      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          <Button variant="secondary" size="sm" onClick={openLibraryPath}>
            {t("open")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleChooseLibraryPath}
          >
            {t("edit")}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          <InfoIcon className="mr-1 w-3 h-3 inline" />
          <span>{t("relaunchIsNeededAfterChanged")}</span>
        </div>
      </div>
    </div>
  );
};

const FfmpegSettings = () => {
  const { EnjoyApp, setFfmegConfig, ffmpegConfig } = useContext(
    AppSettingsProviderContext
  );
  const [editing, setEditing] = useState(false);

  const refreshFfmpegConfig = async () => {
    EnjoyApp.settings.getFfmpegConfig().then((config) => {
      setFfmegConfig(config);
    });
  };

  const handleChooseFfmpeg = async () => {
    const filePaths = await EnjoyApp.dialog.showOpenDialog({
      properties: ["openFile"],
    });

    const path = filePaths?.[0];
    if (!path) return;

    if (path.includes("ffmpeg")) {
      EnjoyApp.settings.setFfmpegConfig({
        ...ffmpegConfig,
        ffmpegPath: path,
      });
      refreshFfmpegConfig();
    } else if (path.includes("ffprobe")) {
      EnjoyApp.settings.setFfmpegConfig({
        ...ffmpegConfig,
        ffprobePath: path,
      });
      refreshFfmpegConfig();
    } else {
      toast.error(t("invalidFfmpegPath"));
    }
  };

  return (
    <>
      <div className="flex items-start justify-between py-4">
        <div className="">
          <div className="mb-2">FFmpeg</div>
          <div className="flex items-center space-x-4">
            <span className=" text-sm text-muted-foreground">
              <b>ffmpeg</b>: {ffmpegConfig?.ffmpegPath || ""}
            </span>
            {editing && (
              <Button onClick={handleChooseFfmpeg} variant="ghost" size="icon">
                <EditIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className=" text-sm text-muted-foreground">
              <b>ffprobe</b>: {ffmpegConfig?.ffprobePath || ""}
            </span>
            {editing && (
              <Button onClick={handleChooseFfmpeg} variant="ghost" size="icon">
                <EditIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
        <div className="">
          <div className="flex items-center justify-end space-x-2 mb-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                EnjoyApp.ffmpeg
                  .discover()
                  .then(({ ffmpegPath, ffprobePath }) => {
                    if (ffmpegPath && ffprobePath) {
                      toast.success(
                        t("ffmpegFoundAt", {
                          path: ffmpegPath + ", " + ffprobePath,
                        })
                      );
                    } else {
                      toast.warning(t("ffmpegNotFound"));
                    }
                    refreshFfmpegConfig();
                  });
              }}
            >
              {t("scan")}
            </Button>
            <Button
              variant={editing ? "outline" : "secondary"}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? t("cancel") : t("edit")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const WhisperSettings = () => {
  const { whisperModel, whisperModelsPath, EnjoyApp } = useContext(
    AppSettingsProviderContext
  );

  const handleCheck = async () => {
    toast.promise(EnjoyApp.whisper.check(), {
      loading: t("checkingWhisper"),
      success: t("whisperIsWorkingGood"),
      error: t("whisperIsNotWorking"),
    });
  };

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("sttAiModel")}</div>
        <div className="text-sm text-muted-foreground">{whisperModel}</div>
      </div>

      <div className="flex items-center space-x-2">
        <Button onClick={handleCheck} variant="secondary" size="sm">
          {t("check")}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm">
              {t("edit")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>{t("sttAiModel")}</DialogHeader>
            <DialogDescription>
              {t("chooseAIModelDependingOnYourHardware")}
            </DialogDescription>

            <WhisperModelOptions />

            <DialogFooter>
              <div className="text-xs opacity-70 flex items-start">
                <InfoIcon className="mr-1.5 w-4 h-4" />
                <span className="flex-1">
                  {t("yourModelsWillBeDownloadedTo", {
                    path: whisperModelsPath,
                  })}
                </span>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const OpenaiSettings = () => {
  const { openai, setOpenai } = useContext(AISettingsProviderContext);
  const [editing, setEditing] = useState(false);

  const openAiConfigSchema = z.object({
    key: z.string().optional(),
    model: z.enum(LLM_PROVIDERS.openai.models),
    baseUrl: z.string().optional(),
  });

  const form = useForm<z.infer<typeof openAiConfigSchema>>({
    resolver: zodResolver(openAiConfigSchema),
    values: {
      key: openai?.key,
      model: openai?.model,
      baseUrl: openai?.baseUrl,
    },
  });

  const onSubmit = async (data: z.infer<typeof openAiConfigSchema>) => {
    setOpenai({
      ...data,
    });
    setEditing(false);
    toast.success(t("openaiConfigSaved"));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="mb-2">Open AI</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>{t("key")}:</FormLabel>
                      <Input
                        disabled={!editing}
                        type="password"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>{t("model")}:</FormLabel>
                      <Select
                        disabled={!editing}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectAiModel")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(LLM_PROVIDERS.openai.models || []).map(
                            (option: string) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>{t("baseUrl")}:</FormLabel>
                      <Input
                        disabled={!editing}
                        placeholder={t("leaveEmptyToUseDefault")}
                        defaultValue=""
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                    <FormMessage />
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

const GoogleGenerativeAiSettings = () => {
  const { googleGenerativeAi, setGoogleGenerativeAi } = useContext(
    AISettingsProviderContext
  );
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>();

  const handleSave = () => {
    if (!ref.current) return;

    setGoogleGenerativeAi({
      key: ref.current.value,
    });
    setEditing(false);

    toast.success(t("googleGenerativeAiKeySaved"));
  };

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
    }
  }, [editing]);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">Google Generative AI</div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <Label>{t("key")}:</Label>
            <Input
              ref={ref}
              type="password"
              defaultValue={googleGenerativeAi?.key}
              placeholder="*********"
              disabled={!editing}
              className="focus-visible:outline-0 focus-visible:ring-0 shadow-none"
            />
            {editing && (
              <Button
                size="sm"
                className="min-w-max text-md"
                onClick={handleSave}
              >
                {t("save")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="">
        <Button
          variant={editing ? "outline" : "secondary"}
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? t("cancel") : t("edit")}
        </Button>
      </div>
    </div>
  );
};
