import {
  Button,
  toast,
  Input,
  Label,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Separator,
} from "@renderer/components/ui";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import { LoaderIcon } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { v4 as uuidv4 } from "uuid";

export const MixinLoginButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Mixin Messenger"
          className="w-10 h-10 rounded-full"
        >
          <img
            src="assets/mixin-logo.png"
            className="w-full h-full p-1"
            alt="mixin-logo"
          />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-content"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle className="sr-only">Mixin Messenger Login</SheetTitle>
        </SheetHeader>
        <div className="w-full h-full flex">
          <div className="m-auto">{open && <MixinLoginForm />}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const MixinLoginForm = () => {
  const [mixinId, setMixinId] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { login, webApi, EnjoyApp, apiUrl } = useContext(
    AppSettingsProviderContext
  );
  const [state, setState] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);

  const validateMixinId = (id: string) => {
    setInput(id);

    if (id?.match(/^[1-9]\d{4,9}$/)) {
      setMixinId(id);
    } else {
      setMixinId("");
    }
  };

  const handleScanToLogin = () => {
    const uuid = uuidv4();
    setState(uuid);
    EnjoyApp.shell.openExternal(
      `${apiUrl}/sessions/new?provider=mixin&state=${uuid}`
    );
    setScanning(true);
  };

  const pollingOAuthState = () => {
    if (!state) return;

    webApi.oauthState(state).then((user) => {
      if (user?.id && user?.accessToken) {
        login(user);
      }
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!scanning) return;

    interval = setInterval(() => {
      pollingOAuthState();
    }, 1500);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanning]);

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

  if (scanning) {
    return (
      <div className="w-80">
        <div className="flex items-center justify-center mb-4">
          <img src="assets/mixin-logo.png" className="w-20 h-20" alt="mixin" />
        </div>
        <div className="flex items-center justify-center mb-4">
          <LoaderIcon className="w-5 h-5 animate-spin" />
        </div>
        <div className="text-center text-sm text-muted-foreground mb-6">
          {t("scanMixinQRCodeDescription")}
        </div>
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant="default"
            onClick={() =>
              EnjoyApp.shell.openExternal(
                `${apiUrl}/sessions/new?provider=mixin&state=${state}`
              )
            }
          >
            {t("open")}
          </Button>
          <Button variant="secondary" onClick={() => setScanning(false)}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80">
      <div className="flex items-center justify-center mb-4">
        <img src="assets/mixin-logo.png" className="w-20 h-20" alt="mixin" />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mixinId">{t("mixinId")}</Label>
            <input
              id="mixinId"
              value={input}
              disabled={countdown > 0}
              placeholder={t("inputMixinId")}
              onInput={(event) => validateMixinId(event.currentTarget.value)}
              onBlur={(event) => validateMixinId(event.currentTarget.value)}
              className="border py-2 px-4 rounded dark:bg-background dark:text-foreground"
            />
          </div>
          {codeSent && (
            <div className="grid gap-2">
              <Label htmlFor="verificationCode">{t("verificationCode")}</Label>
              <InputOTP
                id="verificationCode"
                maxLength={5}
                value={code}
                pattern={REGEXP_ONLY_DIGITS}
                onChange={(value) => setCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <div
              onClick={() =>
                EnjoyApp.shell.openExternal("https://mixin.one/messenger")
              }
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("createMixinAccount")}
            </div>
            <Separator orientation="vertical" />
            <div
              onClick={handleScanToLogin}
              className="text-xs text-muted-foreground cursor-pointer"
            >
              {t("scanToLogin")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="w-full px-2"
            disabled={!mixinId || countdown > 0 || loading}
            onClick={() => {
              if (!mixinId) return;
              if (loading) return;
              if (countdown > 0) return;

              setLoading(true);
              webApi
                .loginCode({ mixinId })
                .then(() => {
                  toast.success(t("codeSent"));
                  setCodeSent(true);
                  setCountdown(120);
                })
                .catch((err) => {
                  toast.error(err.response?.data || err.message);
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
          >
            {loading && <LoaderIcon className="w-5 h-5 mr-2 animate-spin" />}
            {countdown > 0 && <span className="mr-2">{countdown}</span>}
            <span>{codeSent ? t("resend") : t("sendCode")}</span>
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-full px-2"
            disabled={!code || code.length < 5 || !mixinId}
            onClick={() => {
              webApi
                .auth({ provider: "mixin", code, mixinId })
                .then((user) => {
                  if (user?.id && user?.accessToken) login(user);
                })
                .catch((err) => {
                  toast.error(err.response?.data || err.message);
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
