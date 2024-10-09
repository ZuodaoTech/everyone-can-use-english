import { useContext, useEffect } from "react";
import { DbProviderContext } from "@renderer/context";
import { CheckCircle2Icon, LoaderIcon, AlertCircleIcon } from "lucide-react";
import { ResetAllButton } from "@renderer/components";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";

export const DbState = () => {
  const db = useContext(DbProviderContext);

  if (db.state === "connected") {
    return (
      <div className="">
        <div className="flex justify-center mb-2">
          <CheckCircle2Icon className="text-green-500 w-24 h-24" />
        </div>
        <p className="text-xs text-muted-foreground">{db.path}</p>
      </div>
    );
  }

  if (db.state === "error") {
    return (
      <div className="">
        <div className="flex justify-center mb-2">
          <AlertCircleIcon className="text-destructive w-24 h-24" />
        </div>
        <div className="text-center mb-4">
          <ResetAllButton>
            <Button>{t("resetAll")}</Button>
          </ResetAllButton>
        </div>
        <p className="text-xs text-muted-foreground">{db.error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <LoaderIcon className="animate-spin w-6 h-6" />
    </div>
  );
};
