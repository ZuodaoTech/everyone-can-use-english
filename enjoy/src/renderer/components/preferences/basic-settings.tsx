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
import { WhisperModelOptions } from "@renderer/components";
import {
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";
import { useContext, useState, useRef, useEffect } from "react";
import { redirect } from "react-router-dom";
import { InfoIcon } from "lucide-react";

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

const UserSettings = () => {
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

const LanguageSettings = () => {
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
          <Button variant="default" size="sm" onClick={handleChooseLibraryPath}>
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
  const { libraryPath, EnjoyApp } = useContext(AppSettingsProviderContext);
  const [config, setConfig] = useState<FfmpegConfigType>();

  useEffect(() => {
    EnjoyApp.settings.getFfmpegConfig().then((_config) => {
      setConfig(_config);
    });
  }, []);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">FFmpeg</div>
        <div className="text-sm text-muted-foreground mb-2">
          {config?.commandExists && t("usingInstalledFFmpeg")}
          {!config?.commandExists &&
            `${t("usingDownloadedFFmpeg")}: ${config?.ffmpegPath}`}
        </div>
      </div>
      <div className="">
        <div className="flex items-center justify-end space-x-2 mb-2">
          {config?.ffmpegPath && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                EnjoyApp.shell.openPath(libraryPath);
              }}
            >
              {t("open")}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              EnjoyApp.ffmpeg.check();
            }}
          >
            {t("check")}
          </Button>
        </div>
      </div>
    </div>
  );
};

const WhisperSettings = () => {
  const { whisperModel, whisperModelsPath } = useContext(
    AppSettingsProviderContext
  );

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("sttAiModel")}</div>
        <div className="text-sm text-muted-foreground">{whisperModel}</div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm">{t("edit")}</Button>
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
  );
};

const OpenaiSettings = () => {
  const { openai, setOpenai } = useContext(AISettingsProviderContext);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>();

  const handleSave = () => {
    if (!ref.current) return;

    setOpenai({
      key: ref.current.value,
    });
    setEditing(false);

    toast.success(t("openaiKeySaved"));
  };

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
    }
  }, [editing]);

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">Open AI</div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <Label>{t("key")}:</Label>
            <Input
              ref={ref}
              type="password"
              defaultValue={openai?.key}
              placeholder="sk-*********"
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
          variant={editing ? "secondary" : "default"}
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? t("cancel") : t("edit")}
        </Button>
      </div>
    </div>
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
          variant={editing ? "secondary" : "default"}
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          {editing ? t("cancel") : t("edit")}
        </Button>
      </div>
    </div>
  );
};
