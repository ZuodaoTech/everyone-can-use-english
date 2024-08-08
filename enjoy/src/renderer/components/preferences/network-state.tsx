import { Client } from "@/api";
import { t } from "i18next";
import { useState, useContext, useEffect, useMemo } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderIcon } from "lucide-react";

export const NetworkState = () => {
  const { apiUrl, EnjoyApp } = useContext(AppSettingsProviderContext);

  let timeoutId: ReturnType<typeof setTimeout | null> = null;

  const [apiConnected, setApiConnected] = useState(false);
  const [apiConnecting, setApiConnecting] = useState(false);
  const [apiConnectError, setApiConnectError] = useState(false);
  const [apiConnectTime, setApiConnectTime] = useState<number>(null);

  const [ipInfoError, setIpInfoError] = useState(false);
  const [ipInfo, setIpInfo] = useState(null);

  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(null);

  const items = useMemo(() => {
    const apiStateColor =
      apiConnectTime < 200
        ? "text-green-500"
        : apiConnectTime < 800
        ? "text-yellow-500"
        : "text-red-500";

    return [
      {
        title: t("apiConnectTime", { apiUrl }),
        loading: !apiConnected && apiConnecting,
        error: apiConnectError,
        value: <span className={apiStateColor}>{apiConnectTime}ms</span>,
      },
      {
        title: t("ipInfo"),
        loading: false,
        error: ipInfoError,
        value: (
          <span>
            {ipInfo
              ? `${ipInfo.ip} (${ipInfo.city}, ${ipInfo.country_name})`
              : "-"}
          </span>
        ),
      },
      {
        title: t("platformInfo"),
        loading: false,
        error: false,
        value: (
          <span>
            {platformInfo
              ? `${platformInfo.platform} ${platformInfo.arch} ${platformInfo.version}`
              : "-"}
          </span>
        ),
      },
    ];
  }, [
    apiConnectTime,
    apiConnecting,
    apiConnected,
    apiConnectError,
    ipInfo,
    ipInfoError,
    platformInfo,
  ]);

  useEffect(() => {
    pollingAction();
    getPlatformInfo();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  async function pollingAction() {
    await Promise.all([getApiConnectTime(), getIpInfo()]);

    timeoutId = setTimeout(() => pollingAction(), 10000);
  }

  async function getApiConnectTime() {
    setApiConnecting(true);
    try {
      const client = new Client({ baseUrl: apiUrl });
      const startTime = new Date().getTime();
      await client.up();
      const endTime = new Date().getTime();

      setApiConnectTime(endTime - startTime);
      setApiConnected(true);
    } catch (error) {
      setApiConnectError(true);
      setApiConnected(false);
    }
    setApiConnecting(false);
  }

  async function getIpInfo() {
    try {
      await fetch("https://ipapi.co/json")
        .then((resp) => resp.json())
        .then((info) => setIpInfo(info));
    } catch (error) {
      setIpInfoError(true);
    }
  }

  async function getPlatformInfo() {
    const info = await EnjoyApp.app.getPlatformInfo();
    setPlatformInfo(info);
  }

  return (
    <div className="py-4">
      <div className="flex items-start justify-between">
        <div className="mb-2">{t("networkState")}</div>
      </div>

      <div>
        {items.map((item, index) => {
          return (
            <div
              key={index}
              className="text-sm text-muted-foreground flex justify-between my-2"
            >
              <div className="">{item.title}</div>
              <div className="">
                {item.loading ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : item.error ? (
                  <span className="text-red-500">{t("connectError")}</span>
                ) : (
                  item.value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
