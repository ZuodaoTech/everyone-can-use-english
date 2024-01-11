import { Button, useToast } from "@renderer/components/ui";
import { useContext, useEffect } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export const LoginForm = () => {
  const { toast } = useToast();
  const { EnjoyApp, login, apiUrl } = useContext(AppSettingsProviderContext);

  const handleMixinLogin = () => {
    const url = `${apiUrl}/sessions/new?provider=mixin`;
    EnjoyApp.view.load(url, { x: 0, y: 0 });
  };

  const onViewState = (event: {
    state: string;
    error?: string;
    url?: string;
    html?: string;
  }) => {
    const { state, url, error } = event;

    if (error) {
      toast({
        title: t("error"),
        description: error,
        variant: "destructive",
      });
      EnjoyApp.view.hide();
      return;
    }

    if (state === "will-navigate") {
      const provider = new URL(url).pathname.split("/")[2];
      const code = new URL(url).searchParams.get("code");

      if (!url.startsWith(apiUrl)) {
        toast({
          title: t("error"),
          description: t("invalidRedirectUrl"),
          variant: "destructive",
        });
        EnjoyApp.view.hide();
      }

      if (provider && code) {
        EnjoyApp.webApi
          .auth({ provider, code })
          .then((user) => {
            login(user);
          })
          .finally(() => {
            EnjoyApp.view.hide();
          });
      } else {
        toast({
          title: t("error"),
          description: t("failedToLogin"),
          variant: "destructive",
        });
        EnjoyApp.view.hide();
      }
    }
  };

  useEffect(() => {
    EnjoyApp.view.onViewState((_event, state) => onViewState(state));

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, [apiUrl]);

  return (
    <div className="w-full max-w-sm px-6 flex flex-col space-y-4">
      <Button
        variant="secondary"
        size="lg"
        className="w-full h-12 relative"
        onClick={handleMixinLogin}
      >
        <img
          src="assets/mixin-logo.png"
          className="w-8 h-8 absolute left-4"
          alt="mixin-logo"
        />
        <span className="text-lg">Mixin Messenger</span>
      </Button>
    </div>
  );
};
