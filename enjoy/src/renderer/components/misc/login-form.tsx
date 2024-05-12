import {
  Separator,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui";
import { useContext } from "react";
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

export const LoginForm = () => {
  const { user } = useContext(AppSettingsProviderContext);

  if (user) {
    return (
      <div className="px-4 py-2 border rounded-lg w-full max-w-sm">
        <UserSettings />
        <Separator />
        <LanguageSettings />
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
