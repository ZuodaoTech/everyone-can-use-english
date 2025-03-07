import { useContext, useEffect, useRef } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import debounce from "lodash/debounce";
import { DISCUSS_URL, WEB_API_URL } from "@/constants";
import { Button } from "@renderer/components/ui";
import { t } from "i18next";
import { LoaderSpin } from "../components";

export default () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { EnjoyApp, user, webApi, logout } = useContext(
    AppSettingsProviderContext
  );

  const loadCommunity = async () => {
    let url = `${DISCUSS_URL}/login`;
    let ssoUrl = `${WEB_API_URL}/discourse/sso`;
    const accessToken = user?.accessToken;
    if (!accessToken) return;

    try {
      const { discussUrl, discussSsoUrl } = await webApi.config("discuss");
      if (discussUrl) {
        url = discussUrl;
      }
      if (discussSsoUrl) {
        ssoUrl = discussSsoUrl;
      }
    } catch (error) {
      console.error(error);
    }

    const { x, y, width, height } =
      containerRef.current.getBoundingClientRect();
    EnjoyApp.view.loadCommunity(
      { x, y, width, height },
      { navigatable: false, accessToken, url, ssoUrl }
    );
  };

  const resize = debounce(() => {
    const { x, y, width, height } =
      containerRef.current.getBoundingClientRect();
    EnjoyApp.view.resize({ x, y, width, height });
  }, 100);

  useEffect(() => {
    if (!containerRef.current) return;

    loadCommunity();
    const observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      EnjoyApp.view.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {!user?.accessToken && (
        <div className="bg-destructive text-white py-2 px-4 h-10 flex items-center sticky top-0 z-10">
          <span className="text-sm">{t("authorizationExpired")}</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 py-1 px-2 text-xs h-auto w-auto"
            onClick={logout}
          >
            {t("reLogin")}
          </Button>
        </div>
      )}
      <LoaderSpin />
    </div>
  );
};
