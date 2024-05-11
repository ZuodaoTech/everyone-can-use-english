import {
  Button,
  toast,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import {
  UserSettings,
  LanguageSettings,
  LoaderSpin,
  BanduLoginForm,
  GithubLoginForm,
  GithubLoginButton,
} from "@renderer/components";
import { ChevronLeftIcon } from "lucide-react";
import { WEB_API_URLS } from "@/constants";
import { useDebounce } from "@uidotdev/usehooks";
import { EmailLoginForm } from "./email-login-form";

export const LoginForm = () => {
  const { EnjoyApp, login, webApi, user } = useContext(
    AppSettingsProviderContext
  );
  const [webviewUrl, setWebviewUrl] = useState<string>();
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>(null);
  const debounceWindowSize = useDebounce(windowSize, 500);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogin = (provider: "mixin" | "github") => {
    const url = `${webApi.baseUrl}/sessions/new?provider=${provider}`;
    setWebviewUrl(url);
  };

  const onViewState = (event: {
    state: string;
    error?: string;
    url?: string;
    html?: string;
  }) => {
    const { state, url, error } = event;

    if (error) {
      toast.error(error);
      setWebviewUrl(null);
      return;
    }

    const BASE_URL_REGEX = new RegExp(
      `^(${[webApi.baseUrl, ...WEB_API_URLS].join("|")})`
    );
    if (state === "will-navigate" || state === "will-redirect") {
      if (!url.match(BASE_URL_REGEX)) {
        return;
      }

      const provider = new URL(url).pathname.split("/")[2] as
        | "mixin"
        | "github";
      const code = new URL(url).searchParams.get("code");

      if (provider && code) {
        webApi
          .auth({ provider, code })
          .then((user) => {
            if (user?.id && user?.accessToken) login(user);
          })
          .catch((err) => {
            toast.error(err.message);
          })
          .finally(() => {
            setWebviewUrl(null);
          });
      }
    }
  };

  useEffect(() => {
    if (!webviewUrl) return;
    if (!debounceWindowSize) return;

    EnjoyApp.view.onViewState((_event, state) => onViewState(state));
    const rect = containerRef.current.getBoundingClientRect();
    const { x, y, width, height } = rect;

    EnjoyApp.view.load(
      webviewUrl,
      {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      },
      {
        navigatable: true,
      }
    );

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, [webApi, webviewUrl, debounceWindowSize]);

  useEffect(() => {
    if (!containerRef?.current) return;

    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
    EnjoyApp.window.onResize(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });

    return () => {
      EnjoyApp.window.removeListeners();
    };
  }, [containerRef]);

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
    <>
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

              <Button
                variant="outline"
                size="icon"
                data-tooltip-id="global-tooltip"
                data-tooltip-content="Mixin"
                className="w-10 h-10 rounded-full p-1"
                onClick={() => handleLogin("mixin")}
              >
                <img
                  src="assets/mixin-logo.png"
                  className="w-full h-full"
                  alt="mixin-logo"
                />
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content="学升"
                    className="w-10 h-10 rounded-full"
                  >
                    <img
                      src="assets/bandu-logo.svg"
                      className="w-full h-full"
                      alt="bandu-logo"
                    />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-screen">
                  <div className="w-full h-full flex">
                    <div className="m-auto">
                      <BanduLoginForm />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className={`absolute top-0 left-0 w-screen h-screen z-10 flex flex-col overflow-hidden ${
          webviewUrl ? "" : "hidden"
        }`}
      >
        <div className="flex items-center py-2 px-6">
          <Button variant="ghost" onClick={() => setWebviewUrl(null)}>
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="ml-2">{t("goBack")}</span>
          </Button>
        </div>
        <div ref={containerRef} className="w-full h-full flex-1 bg-muted">
          <LoaderSpin />
        </div>
      </div>
    </>
  );
};
