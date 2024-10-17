import { t } from "i18next";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  toast,
} from "@renderer/components/ui";
import { AppSettingsProviderContext } from "@renderer/context";
import { useContext, useEffect, useState } from "react";

export const EmailSettings = () => {
  const { user, login, webApi } = useContext(AppSettingsProviderContext);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user?.email);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  const refreshProfile = () => {
    webApi.me().then((profile: UserType) => {
      login(Object.assign({}, user, profile));
    });
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

  if (!user) return null;

  return (
    <div className="flex items-start justify-between py-4">
      <div className="">
        <div className="mb-2">{t("email")}</div>
        <div className="text-sm text-muted-foreground mb-2">
          {user.email || "-"}
        </div>
      </div>

      <Dialog open={editing} onOpenChange={(value) => setEditing(value)}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            {t("edit")}
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editEmail")}</DialogTitle>
          </DialogHeader>

          <div className="w-full max-w-sm mx-auto py-6">
            <div className="grid gap-4 mb-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">{t("verificationCode")}</Label>
                <Input
                  id="code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("verificationCode")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="secondary"
                disabled={!email}
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
                disabled={!code}
                onClick={() => {
                  webApi
                    .updateProfile(user.id, {
                      email,
                      code,
                    })
                    .then(() => {
                      toast.success(t("emailUpdated"));
                      refreshProfile();
                      setEditing(false);
                    })
                    .catch((err) => {
                      toast.error(err.message);
                    });
                }}
              >
                {t("confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
