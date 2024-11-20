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
} from "@renderer/components/ui";
import { useContext, useEffect, useRef, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";
import intlTelInput from "intl-tel-input/intlTelInputWithUtils";
import "intl-tel-input/build/css/intlTelInput.css";
import { REGEXP_ONLY_DIGITS } from "input-otp";

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
      <SheetContent
        side="bottom"
        className="h-content"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle className="sr-only">学升登录</SheetTitle>
        </SheetHeader>
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
              disabled={countdown > 0}
              className="border text-lg py-2 px-4 rounded w-80 dark:bg-background dark:text-foreground"
              ref={ref}
            />
          </div>
          {codeSent && (
            <div className="grid gap-2">
              <Label htmlFor="verrificationCode">{t("verificationCode")}</Label>
              <InputOTP
                id="verrificationCode"
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="w-full px-2"
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
