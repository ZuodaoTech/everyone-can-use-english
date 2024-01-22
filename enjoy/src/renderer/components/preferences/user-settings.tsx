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
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext } from "react";
import { redirect } from "react-router-dom";

export const UserSettings = () => {
  const { user, logout } = useContext(AppSettingsProviderContext);

  if (!user) return null;
  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage crossOrigin="anonymous" src={user.avatarUrl} />
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
