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
  toast,
} from "@renderer/components/ui";
import { useContext } from "react";
import { AppSettingsProviderContext } from "../../context";
import { t } from "i18next";

export const ResetAllButton = (props: { children: React.ReactNode }) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const reset = () => {
    EnjoyApp.app.reset();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("resetAll")}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {t("resetAllConfirmation")}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive-hover"
            onClick={reset}
          >
            {t("resetAll")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const ResetSettingsButton = (props: { children: React.ReactNode }) => {
  const { EnjoyApp } = useContext(AppSettingsProviderContext);

  const reset = async () => {
    try {
      await EnjoyApp.app.resetSettings();
      toast.success(t("settingsReseted"));
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("resetSettings")}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {t("resetSettingsConfirmation")}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive-hover"
            onClick={reset}
          >
            {t("resetSettings")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
