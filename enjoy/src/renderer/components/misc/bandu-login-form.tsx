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
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";

export const BanduLoginButton = () => {
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
            src="assets/bandu-logo.svg"
            className="w-full h-full"
            alt="bandu-logo"
          />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-screen">
        <div className="w-full h-full flex">
          <div className="m-auto">{open && <BanduLoginForm />}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const BanduLoginForm = () => {
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
      iti?.getNumberType() === (intlTelInput.utils.numberType as any)?.MOBILE
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
        "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.10/build/js/utils.js",
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
    <div className="w-80">
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
              className="border text-lg py-2 px-4 rounded w-80 dark:bg-background dark:text-foreground"
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
