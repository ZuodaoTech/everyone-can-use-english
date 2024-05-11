import { Button, toast, Input, Label } from "@renderer/components/ui";
import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { t } from "i18next";

export const EmailLoginForm = () => {
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
