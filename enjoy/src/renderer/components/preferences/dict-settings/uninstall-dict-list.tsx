import {
  DictProviderContext,
  AppSettingsProviderContext,
} from "@/renderer/context";
import { useContext, useState } from "react";
import { Button, toast } from "@renderer/components/ui";
import { LoaderIcon } from "lucide-react";
import { t } from "i18next";

export const UninstallDictList = function ({
  onDownload,
}: {
  onDownload: () => void;
}) {
  const { uninstallDicts } = useContext(DictProviderContext);

  return (
    <>
      {uninstallDicts.map((item) => (
        <UninstallDictItem
          key={item.name}
          dict={item}
          onDownload={onDownload}
        />
      ))}
    </>
  );
};

const UninstallDictItem = function ({
  dict,
  onDownload,
}: {
  dict: Dict;
  onDownload: () => void;
}) {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const { reload, removed } = useContext(DictProviderContext);
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);

    try {
      removed(dict);
      await EnjoyApp.dict.download(dict);
      reload();
      onDownload();
    } catch (err) {
      toast.error(err);
    }

    setLoading(false);
  }

  return (
    <div key={dict.name} className="flex items-center py-2">
      <div className="flex-grow">
        <div>{dict.title}</div>
        <div className="text-sm mt-1 text-muted-foreground">
          <span className="mr-2">{dict.lang}</span>
          <span>{dict.size}</span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={loading}
        onClick={handleDownload}
      >
        {loading && <LoaderIcon className="animate-spin w-4 mr-2" />}
        {t("download")}
      </Button>
    </div>
  );
};
