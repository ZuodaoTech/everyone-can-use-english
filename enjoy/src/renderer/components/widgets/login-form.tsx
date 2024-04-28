import {
  Button,
  toast,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
  Label,
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
} from "@renderer/components";
import { ChevronLeftIcon } from "lucide-react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { WEB_API_URLS } from "@/constants";

export const LoginForm = () => {
  const { EnjoyApp, login, webApi, user } = useContext(
    AppSettingsProviderContext
  );
  const [webviewUrl, setWebviewUrl] = useState<string>();

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
    if (!containerRef?.current) return;

    EnjoyApp.view.onViewState((_event, state) => onViewState(state));

    const rect = containerRef.current.getBoundingClientRect();
    EnjoyApp.view.load(
      webviewUrl,
      {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      {
        navigatable: true,
      }
    );

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, [webApi, webviewUrl]);

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
              <Button
                variant="outline"
                size="icon"
                data-tooltip-id="global-tooltip"
                data-tooltip-content="GitHub"
                className="w-10 h-10 rounded-full"
                onClick={() => handleLogin("github")}
              >
                <img
                  src="assets/github-mark.png"
                  className="w-full h-full"
                  alt="github-logo"
                />
              </Button>

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
                      <PandoLoginForm />
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

const EmailLoginForm = () => {
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { login, webApi } = useContext(AppSettingsProviderContext);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (countdown > 0) {
      timeout = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [countdown]);

  return (
    <div className="w-full">
      <div className="w-full grid gap-4 mb-6">
        <div className="grid gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            className="h-10"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            disabled={countdown > 0}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="code">{t("verificationCode")}</Label>
          <Input
            id="code"
            className="h-10"
            type="text"
            required
            minLength={5}
            maxLength={5}
            placeholder={t("verificationCode")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={!email || countdown > 0}
          onClick={() => {
            webApi
              .loginCode({ email })
              .then(() => {
                toast.success(t("codeSent"));
                setCodeSent(true);
                setCountdown(120);
              })
              .catch((err) => {
                toast.error(err.message);
              });
          }}
        >
          {countdown > 0 && <span className="mr-2">{countdown}</span>}
          <span>{codeSent ? t("resend") : t("sendCode")}</span>
        </Button>

        <Button
          variant="default"
          size="lg"
          className="w-full"
          disabled={!code || code.length < 5 || !email}
          onClick={() => {
            webApi
              .auth({ provider: "email", code, email })
              .then((user) => {
                if (user?.id && user?.accessToken) login(user);
              })
              .catch((err) => {
                toast.error(err.message);
              });
          }}
        >
          {t("login")}
        </Button>
      </div>
    </div>
  );
};

const PandoLoginForm = () => {
  const ref = useRef<HTMLInputElement>(null);
  const [iti, setIti] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { login, webApi } = useContext(AppSettingsProviderContext);

  const validatePhone = () => {
    if (
      iti?.isValidNumber() &&
      iti?.getNumberType() === intlTelInputUtils.numberType.MOBILE
    ) {
      setPhoneNumber(iti.getNumber());
    } else {
      setPhoneNumber("");
    }
  };

  useEffect(() => {
    if (!ref.current) return;

    intlTelInput(ref.current, {
      initialCountry: "cn",
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@19.2.12/build/js/utils.js",
    });
    setIti(intlTelInput(ref.current));

    return () => {
      iti?.destroy();
    };
  }, [ref]);

  useEffect(() => {
    iti?.setCountry("cn");
  }, [iti]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (countdown > 0) {
      timeout = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [countdown]);

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <img src="assets/bandu-logo.svg" className="w-20 h-20" alt="bandu" />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("phoneNumber")}</Label>
            <input
              id="phone"
              value={phoneNumber}
              onInput={validatePhone}
              onBlur={validatePhone}
              className="border text-lg py-2 px-4 rounded"
              ref={ref}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="verrificationCode">{t("verificationCode")}</Label>
            <Input
              id="verrificationCode"
              className="border py-2 h-10 px-4 rounded"
              type="text"
              minLength={5}
              maxLength={5}
              placeholder={t("verificationCode")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={!phoneNumber || countdown > 0}
            onClick={() => {
              webApi
                .loginCode({ phoneNumber })
                .then(() => {
                  toast.success(t("codeSent"));
                  setCodeSent(true);
                  setCountdown(120);
                })
                .catch((err) => {
                  toast.error(err.message);
                });
            }}
          >
            {countdown > 0 && <span className="mr-2">{countdown}</span>}
            <span>{codeSent ? t("resend") : t("sendCode")}</span>
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            disabled={!code || code.length < 5 || !phoneNumber}
            onClick={() => {
              webApi
                .auth({ provider: "bandu", code, phoneNumber })
                .then((user) => {
                  if (user?.id && user?.accessToken) login(user);
                })
                .catch((err) => {
                  toast.error(err.message);
                });
            }}
          >
            {t("login")}
          </Button>
        </div>
      </div>
    </div>
  );
};
