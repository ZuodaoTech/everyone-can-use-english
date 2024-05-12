import {
  Button,
  toast,
  Input,
  Label,
  Sheet,
  SheetTrigger,
  SheetContent,
} from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export const MixinLoginButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="学升"
          className="w-10 h-10 rounded-full"
        >
          <img
            src="assets/mixin-logo.png"
            className="w-full h-full p-1"
            alt="mixin-logo"
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-screen">
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
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const { login, webApi } = useContext(AppSettingsProviderContext);

  const validateMixinId = (id: string) => {
    setInput(id);

    if (id?.match(/^[1-9]\d{5,10}$/)) {
      setMixinId(id);
    } else {
      setMixinId("");
    }
  };

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
        <img src="assets/mixin-logo.png" className="w-20 h-20" alt="bandu" />
      </div>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="mixinId">{t("mixinID")}</Label>
            <input
              id="mixinId"
              value={input}
              placeholder={t("inputMixinId")}
              onInput={(event) => validateMixinId(event.currentTarget.value)}
              onBlur={(event) => validateMixinId(event.currentTarget.value)}
              className="border py-2 px-4 rounded"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="verificationCode">{t("verificationCode")}</Label>
            <Input
              id="verificationCode"
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
            disabled={!mixinId || countdown > 0}
            onClick={() => {
              webApi
                .loginCode({ mixinId })
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
            disabled={!code || code.length < 5 || !mixinId}
            onClick={() => {
              webApi
                .auth({ provider: "mixin", code, mixinId })
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
