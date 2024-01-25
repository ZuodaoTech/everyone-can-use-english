import {
  Button,
  toast,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { UserSettings, LanguageSettings } from "@renderer/components";
import { ChevronLeftIcon } from "lucide-react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

export const LoginForm = () => {
  const { EnjoyApp, login, webApi, user } = useContext(
    AppSettingsProviderContext
  );
  const [webviewVisible, setWebviewVisible] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogin = (provider: "mixin" | "github") => {
    const url = `${webApi.baseUrl}/sessions/new?provider=${provider}`;
    setWebviewVisible(true);

    const rect = containerRef.current.getBoundingClientRect();
    EnjoyApp.view.load(
      url,
      {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      {
        navigatable: true,
      }
    );
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
      setWebviewVisible(false);
      return;
    }

    if (state === "will-navigate" || state === "will-redirect") {
      if (!url.startsWith(webApi.baseUrl)) {
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
            setWebviewVisible(false);
          });
      } else {
        toast.error(t("failedToLogin"));
        setWebviewVisible(false);
      }
    }
  };

  useEffect(() => {
    if (!webviewVisible) return;

    EnjoyApp.view.onViewState((_event, state) => onViewState(state));

    return () => {
      EnjoyApp.view.removeViewStateListeners();
      EnjoyApp.view.remove();
    };
  }, [webApi, webviewVisible]);

  useEffect(() => {
    if (!webviewVisible) return;

    const rect = containerRef.current.getBoundingClientRect();
    EnjoyApp.view.show({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }, [webviewVisible]);

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
      <div className="w-full max-w-sm px-6 flex flex-col space-y-4">
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 relative rounded-full"
          onClick={() => handleLogin("github")}
        >
          <img
            src="assets/github-mark.png"
            className="w-8 h-8 absolute left-4"
            alt="github-logo"
          />
          <span className="text-lg">GitHub</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12 relative rounded-full"
          onClick={() => handleLogin("mixin")}
        >
          <img
            src="assets/mixin-logo.png"
            className="w-8 h-8 absolute left-4"
            alt="mixin-logo"
          />
          <span className="text-lg">Mixin Messenger</span>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 relative rounded-full"
            >
              <img
                src="assets/bandu-logo.svg"
                className="w-10 h-10 absolute left-4"
                alt="bandu-logo"
              />
              <span className="text-lg">学升</span>
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

      <div
        className={`absolute top-0 left-0 w-screen h-screen z-10 flex flex-col overflow-hidden ${
          webviewVisible ? "" : "hidden"
        }`}
      >
        <div className="flex items-center py-2 px-6">
          <Button variant="ghost" onClick={() => setWebviewVisible(false)}>
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="ml-2">{t("goBack")}</span>
          </Button>
        </div>
        <div ref={containerRef} className="w-full flex-1"></div>
      </div>
    </>
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
    if (countdown > 0) {
      setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
  }, [countdown]);

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <img src="assets/bandu-logo.svg" className="w-20 h-20" alt="bandu" />
      </div>

      <div className="mb-12">
        <div className="mb-2">
          <input
            onInput={validatePhone}
            onBlur={validatePhone}
            className="border text-lg py-2 px-4 rounded"
            ref={ref}
          />
        </div>

        {phoneNumber && (
          <div className="mb-8">
            <Button
              variant="default"
              size="lg"
              className="w-full"
              disabled={countdown > 0}
              onClick={() => {
                webApi
                  .loginCode({ phoneNumber })
                  .then(() => {
                    toast.success(t("codeSent"));
                    setCodeSent(true);
                    setCountdown(60);
                  })
                  .catch((err) => {
                    toast.error(err.message);
                  });
              }}
            >
              {countdown > 0 && <span className="mr-2">{countdown}</span>}
              <span>{codeSent ? t("resend") : t("sendCode")}</span>
            </Button>
          </div>
        )}

        {codeSent && (
          <div className="mb-2 w-full">
            <Input
              className="border py-2 h-10 px-4 rounded"
              type="text"
              minLength={5}
              maxLength={5}
              placeholder={t("verificationCode")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        )}

        {code && (
          <div>
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
        )}
      </div>
    </div>
  );
};
