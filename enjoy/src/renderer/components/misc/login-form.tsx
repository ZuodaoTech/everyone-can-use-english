import {
  Separator,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  toast,
} from "@renderer/components/ui";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import {
  UserSettings,
  LanguageSettings,
  GithubLoginButton,
  BanduLoginButton,
  MixinLoginButton,
} from "@renderer/components";
import { EmailLoginForm } from "./email-login-form";
import { Client } from "@/api";

export const LoginForm = () => {
  const { user, EnjoyApp, login, apiUrl } = useContext(
    AppSettingsProviderContext
  );
  const [rememberedUser, setRememberedUser] = useState(null);

  const loginWithRememberedUser = async () => {
    if (!rememberedUser) return;
    const client = new Client({
      baseUrl: apiUrl,
      accessToken: rememberedUser.accessToken,
    });

    client
      .me()
      .then((user) => {
        if (user?.id) {
          login(Object.assign({}, rememberedUser, user));
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  useEffect(() => {
    if (user) return;

    EnjoyApp.settings.getUser().then((user) => {
      setRememberedUser(user);
    });
  }, [user]);

  if (user) {
    return (
      <div className="px-4 py-2 border rounded-lg w-full max-w-sm">
        <UserSettings />
        <Separator />
        <LanguageSettings />
      </div>
    );
  }

  if (rememberedUser) {
    return (
      <div className="px-4 py-2 border rounded-lg w-full max-w-sm">
        <div className="flex items-start justify-between py-4">
          <div className="">
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage
                  crossOrigin="anonymous"
                  src={rememberedUser.avatarUrl}
                />
                <AvatarFallback className="text-xl">
                  {rememberedUser.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="">
                <div className="text-sm font-semibold">
                  {rememberedUser.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {rememberedUser.id}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRememberedUser(null)}
            >
              {t("reLogin")}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={loginWithRememberedUser}
            >
              {t("login")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("login")}</CardTitle>
      </CardHeader>

      <CardContent>
        <EmailLoginForm />

        <div className="">
          <Separator className="my-4" />
          <div className="flex items-center justify-center text-xs text-muted-foreground mb-4">
            {t("youCanAlsoLoginWith")}
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <GithubLoginButton />
            <MixinLoginButton />
            <BanduLoginButton />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
