import {
  DictProviderContext,
  AppSettingsProviderContext,
} from "@/renderer/context";
import { useContext, useEffect, useState } from "react";
import {
  Button,
  toast,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@renderer/components/ui";
import { t } from "i18next";

export const InstalledDictList = function () {
  const { installedDicts, downloadingDicts, reload } =
    useContext(DictProviderContext);

  useEffect(() => {
    reload();
  }, []);

  if (installedDicts.length === 0 && downloadingDicts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">{t("dictEmpty")}</div>
    );
  }

  return (
    <>
      {installedDicts.map((item) => (
        <InstalledDictItem key={item.name} dict={item} />
      ))}
    </>
  );
};

const InstalledDictItem = function ({ dict }: { dict: Dict }) {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { settings, setDefault, reload, remove, removed } =
    useContext(DictProviderContext);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (settings.removing?.find((v) => v === dict.name)) {
      handleRemove();
    }
  }, []);

  async function handleSetDefault() {
    try {
      await setDefault(dict);
      toast.success(t("dictFileSetDefaultSuccess"));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRemove() {
    setRemoving(true);

    try {
      remove(dict);
      await EnjoyApp.dict.remove(dict);
      removed(dict);
      toast.success(t("dictRemoved"));
    } catch (err) {
      toast.error(err.message);
    }

    setRemoving(false);
    reload();
  }

  function renderActions() {
    if (removing) {
      return (
        <span className="text-sm text-muted-foreground">{t("removing")}</span>
      );
    }

    if (dict.state === "installed") {
      return (
        <div className="hidden group-hover:inline-flex ">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="text-destructive mr-2"
              >
                {t("remove")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("removeDictTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("removeDictDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    size="sm"
                    className="text-destructive mr-2"
                    onClick={handleRemove}
                  >
                    {t("remove")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button size="sm" variant="secondary" onClick={handleSetDefault}>
            {t("setDefault")}
          </Button>
        </div>
      );
    }
  }

  return (
    <div
      key={dict.name}
      className="flex justify-between items-center group cursor-pointer"
    >
      <div className="flex items-center text-sm text-left h-8 hover:opacity-80">
        <span className="mr-2">{dict.title}</span>
        {settings.default === dict.name && (
          <span className="text-indigo bg-secondary text-xs py-1 px-2 rounded">
            {t("default")}
          </span>
        )}
      </div>

      {renderActions()}
    </div>
  );
};
