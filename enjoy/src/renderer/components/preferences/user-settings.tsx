import { t } from "i18next";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useState } from "react";
import { redirect } from "react-router-dom";

export const UserSettings = () => {
  const { user, login, logout, webApi } = useContext(
    AppSettingsProviderContext
  );
  const [name, setName] = useState(user?.name);
  const [editing, setEditing] = useState(false);

  const refreshProfile = () => {
    webApi.me().then((profile: UserType) => {
      login(Object.assign({}, user, profile));
    });
  };

  if (!user) return null;
  return (
    <>
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

        <div className="grid grid-cols-2 gap-2">
          <Dialog open={editing} onOpenChange={(value) => setEditing(value)}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                {t("edit")}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editUserName")}</DialogTitle>
              </DialogHeader>

              <div className="w-full max-w-sm mx-auto py-6">
                <div className="grid gap-2 mb-6">
                  <Label htmlFor="name">{t("userName")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="">
                  <Button
                    className="w-full"
                    onClick={() => {
                      webApi
                        .updateProfile(user.id, { name })
                        .then(() => {
                          toast.success("profileUpdated");
                          setEditing(false);
                          refreshProfile();
                        })
                        .catch((err) => {
                          toast.error(err.message);
                        });
                    }}
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            className="text-destructive"
            size="sm"
            onClick={logout}
          >
            {t("logout")}
          </Button>
        </div>
      </div>
    </>
  );
};
