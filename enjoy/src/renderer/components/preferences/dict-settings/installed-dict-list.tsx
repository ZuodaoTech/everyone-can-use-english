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
import { LoaderIcon } from "lucide-react";

export const InstalledDictList = function () {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { installedDicts, reload } = useContext(DictProviderContext);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    reload();

    EnjoyApp.decompress.dashboard().then((_tasks) => {
      setTasks(_tasks.filter((_task) => _task.type === "dict"));
    });

    EnjoyApp.decompress.onComplete((_, task) => {
      if (task.type === "dict") reload();
    });

    EnjoyApp.decompress.onUpdate((_, _tasks) => {
      setTasks(_tasks.filter((_task) => _task.type === "dict"));
    });

    return () => {
      EnjoyApp.decompress.removeAllListeners();
    };
  }, []);

  if (installedDicts.length === 0 && tasks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">{t("dictEmpty")}</div>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <DecompressDictItem key={task.id} task={task} />
      ))}

      {installedDicts.map((item) => (
        <InstalledDictItem key={item.value} dict={item} />
      ))}
    </>
  );
};

const DecompressDictItem = function ({ task }: { task: DecompressTask }) {
  return (
    <div key={task.id} className="flex justify-between items-center group">
      <div className="flex items-center text-sm text-left h-8 hover:opacity-80">
        <span className="mr-2">{task.title}</span>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t("decompressing")}</span>
        <span>{task.progress || 0}%</span>
        <LoaderIcon className="w-4 h-4 text-muted-foreground animate-spin" />
      </div>
    </div>
  );
};

const InstalledDictItem = function ({ dict }: { dict: DictItem }) {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { settings, setDefault, reload, remove } =
    useContext(DictProviderContext);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (settings.removing?.find((v) => v === dict.value)) {
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

  async function handleRemoveDefault() {
    try {
      await setDefault(null);
      toast.success(t("dictFileRemoveDefaultSuccess"));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRemove() {
    setRemoving(true);

    try {
      await remove(dict);
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("removing")}</span>
          <LoaderIcon className="w-4 h-4 text-muted-foreground animate-spin" />
        </div>
      );
    }

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
                  variant="secondary"
                  className="text-destructive mr-2"
                  onClick={handleRemove}
                >
                  {t("remove")}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {settings.default === dict.value ? (
          <Button size="sm" variant="secondary" onClick={handleRemoveDefault}>
            {t("removeDefault")}
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={handleSetDefault}>
            {t("setDefault")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      key={dict.value}
      className="flex justify-between items-center group cursor-pointer"
    >
      <div className="flex items-center text-sm text-left h-8 hover:opacity-80">
        <span className="mr-2">{dict.text}</span>
        {settings.default === dict.value && (
          <span className="text-indigo bg-secondary text-xs py-1 px-2 rounded">
            {t("default")}
          </span>
        )}
      </div>

      {renderActions()}
    </div>
  );
};
