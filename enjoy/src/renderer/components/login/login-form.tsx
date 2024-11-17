import {
  Separator,
  Card,
  CardContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
  ProxySettings,
  ApiUrlSettings,
  NetworkState,
} from "@renderer/components";
import { EmailLoginForm } from "./email-login-form";

export const LoginForm = () => {
  const { user, EnjoyApp, login } = useContext(AppSettingsProviderContext);
  const [rememberedUsers, setRememberedUsers] = useState<{ id: string }[]>([]);

  useEffect(() => {
    EnjoyApp.appSettings.getSessions().then((sessions) => {
      setRememberedUsers(sessions);
    });
  }, []);

  if (user) {
    return (
      <div className="px-4 py-2 border rounded-lg w-full max-w-sm m-auto">
        <UserSettings />
        <Separator />
        <LanguageSettings />
      </div>
    );
  }

  return (
    <Tabs
      className="w-full max-w-md"
      defaultValue={rememberedUsers.length > 0 ? "selectUser" : "login"}
    >
      <TabsList
        className={`w-full grid grid-cols-${
          rememberedUsers.length > 0 ? 3 : 2
        }`}
      >
        {rememberedUsers.length > 0 && (
          <TabsTrigger value="selectUser">{t("selectUser")}</TabsTrigger>
        )}
        <TabsTrigger value="login">{t("login")}</TabsTrigger>
        <TabsTrigger value="advanced">{t("advanced")}</TabsTrigger>
      </TabsList>
      {rememberedUsers.length > 0 && (
        <TabsContent value="selectUser">
          <div className="grid gap-4 border rounded-lg">
            {rememberedUsers.map((rememberedUser) => (
              <div
                key={rememberedUser.id}
                className="px-4 border-b last:border-b-0 w-full max-w-md"
              >
                <div className="flex items-center justify-between py-2">
                  <div className="">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage
                          crossOrigin="anonymous"
                          src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${rememberedUser.id}`}
                        />
                        <AvatarFallback className="text-xl"></AvatarFallback>
                      </Avatar>
                      <div className="">
                        <div className="text-sm font-semibold"></div>
                        <div className="text-xs text-muted-foreground">
                          {rememberedUser.id}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="">
                    <Button
                      variant="default"
                      data-testid="login-with-remembered-user-button"
                      size="sm"
                      onClick={async () => {
                        await EnjoyApp.appSettings.setUser(rememberedUser);
                        login(rememberedUser);
                      }}
                    >
                      {t("select")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      )}
      <TabsContent value="login">
        <Card className="w-full max-w-md">
          <CardContent className="mt-6">
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
      </TabsContent>
      <TabsContent value="advanced">
        <Card className="w-full max-w-md">
          <CardContent className="mt-6">
            <ApiUrlSettings />
            <Separator />
            <ProxySettings />
            <Separator />
            <NetworkState />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
