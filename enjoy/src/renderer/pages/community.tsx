import { useContext, useEffect, useRef } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import debounce from "lodash/debounce";
import { DISCUSS_URL, WEB_API_URL } from "@/constants";

export default () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { EnjoyApp, user, webApi } = useContext(AppSettingsProviderContext);

  const loadCommunity = async () => {
    let url = `${DISCUSS_URL}/login`;
    let ssoUrl = `${WEB_API_URL}/discourse/sso`;

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
      { navigatable: false, accessToken: user?.accessToken, url, ssoUrl }
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

  return <div ref={containerRef} className="w-full h-full"></div>;
};
