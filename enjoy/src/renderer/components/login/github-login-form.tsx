import { useContext, useEffect, useState } from "react";
import { LoaderSpin } from "@renderer/components";
import { AppSettingsProviderContext } from "@/renderer/context";
import { toast } from "sonner";
import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@renderer/components/ui";
import { t } from "i18next";
import { useCopyToClipboard } from "@uidotdev/usehooks";

export const GithubLoginButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Github"
          className="w-10 h-10 rounded-full"
        >
          <img
            src="assets/github-mark.png"
            className="w-full h-full"
            alt="github-logo"
          />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-content"
        aria-describedby={undefined}
      >
        <div className="w-full h-full flex">
          <div className="m-auto">{open && <GithubLoginForm />}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const GithubLoginForm = () => {
  const [oauthInfo, setOauthInfo] = useState<{
    deviceCode: string;
    expiresIn: number;
    interval: number;
    userCode: string;
    verificationUri: string;
  }>();
  const { webApi, EnjoyApp, login } = useContext(AppSettingsProviderContext);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [error, setError] = useState<string>();
  let timeoutId: NodeJS.Timeout;

  const fetchDeviceCode = async () => {
    try {
      const info = await webApi.deviceCode();
      setOauthInfo(info);

      const { deviceCode, interval, verificationUri } = info;
      EnjoyApp.shell.openExternal(verificationUri);

      timeoutId = setTimeout(() => {
        auth(deviceCode);
      }, (interval || 5) * 1000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const auth = async (deviceCode: string) => {
    if (!deviceCode) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    let res: any = {};
    try {
      res = await webApi.auth({
        provider: "github",
        deviceCode,
      });
    } catch (error) {
      toast.error(error.message);
    }

    if (res.id && res.accessToken) {
      login(res);
    } else if (
      res.error === "authorization_pending" ||
      res.error === "slow_down"
    ) {
      const interval = res.interval || oauthInfo?.interval || 5;
      setError(res.errorDescription);
      timeoutId = setTimeout(() => {
        auth(deviceCode);
      }, interval * 1000);
    } else {
      toast.error(res.errorDescription || t("error"));
    }
  };

  useEffect(() => {
    fetchDeviceCode();
    return () => {
      setOauthInfo(null);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex">
      <div className="m-auto">
        <div className="flex items-center justify-center mb-12">
          <img
            src="assets/github-mark.png"
            className="w-20 h-20"
            alt="github"
          />
        </div>
        {oauthInfo?.userCode ? (
          <div className="grid gap-8">
            <div className="flex items-center justify-center gap-2 text-5xl">
              {oauthInfo.userCode.split("").map((char, index) => {
                if (char === "-") {
                  return (
                    <span key={index} className="text-muted-foreground">
                      {char}
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={index}
                      className="font-mono font-bold border px-3 py-2 rounded"
                    >
                      {char}
                    </span>
                  );
                }
              })}
            </div>

            <LoaderSpin />

            <div className="text-center text-muted-foreground">{error}</div>

            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={() => {
                  copyToClipboard(oauthInfo.userCode);
                  toast.success(t("copied"));
                }}
                variant="secondary"
              >
                {t("copy")}
              </Button>
              <Button
                onClick={() =>
                  EnjoyApp.shell.openExternal(oauthInfo.verificationUri)
                }
              >
                {t("continue")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            <LoaderSpin />
          </div>
        )}
      </div>
    </div>
  );
};
