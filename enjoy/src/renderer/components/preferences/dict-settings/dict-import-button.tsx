import { useState, useContext } from "react";
import {
  AppSettingsProviderContext,
  DictProviderContext,
} from "@/renderer/context";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@/renderer/components/ui";
import { t } from "i18next";
import { LoaderIcon } from "lucide-react";

export const DictImportButton = () => {
  const { reload } = useContext(DictProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);

  const handleOpen = (value: boolean) => {
    setOpen(value);
  };

  const handleAdaptationDictImport = async () => {
    const pathes = await EnjoyApp.dialog.showOpenDialog({
      title: t("selectAdaptionDictTitle"),
      properties: ["openDirectory"],
    });

    if (!pathes[0]) return;

    setLoading(true);
    setTimeout(() => {
      if (loading) {
        setTipVisible(true);
      }
    }, 10000);

    try {
      await EnjoyApp.dict.import(pathes[0]);
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    }

    setLoading(false);
    setTipVisible(false);
    reload();
  };

  const handleOriginDictImport = async () => {
    const pathes = await EnjoyApp.dialog.showOpenDialog({
      title: t("selectMdictFileOrDirTitle"),
      properties: ["multiSelections", "openFile", "openDirectory"],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("import")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importDict")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div>
            <div className="px-4 py-4 flex justify-center items-center">
              <LoaderIcon className="text-muted-foreground animate-spin" />
            </div>
            {tipVisible && (
              <div className="text-xs text-center text-muted-foreground mb-8">
                {t("dictImportSlowTip")}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between py-4">
              <div className="mr-4">
                <div className="mb-2">{t("importAdaptionDict")}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t("adaptionDictTip")}
                  <a
                    className="text-blue-600 cursor-pointer"
                    onClick={() => {
                      EnjoyApp.shell.openExternal(
                        "https://1000h.org/enjoy-app/dicts.html"
                      );
                    }}
                  >
                    {t("howToDownload")}
                  </a>
                </div>
              </div>

              <Button size="sm" onClick={handleAdaptationDictImport}>
                {t("selectDir")}
              </Button>
            </div>

            {/* <div className="flex items-center justify-between py-4">
              <div className="mr-4">
                <div className="mb-2">{t("importMdictFile")}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {t("mdictFileTip")}
                </div>
              </div>

              <Button size="sm" onClick={handleOriginDictImport}>
                {t("selectDir")}
              </Button>
            </div> */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
