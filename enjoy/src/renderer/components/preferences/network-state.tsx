import { t } from "i18next";
import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import { LoaderIcon } from "lucide-react";
import { STORAGE_WORKER_ENDPOINT } from "@/constants";
import { Button } from "@/renderer/components/ui";

export const NetworkState = () => {
  const { apiUrl, EnjoyApp, proxy } = useContext(AppSettingsProviderContext);
  const [refreshing, setRefreshing] = useState(false);
  const apiStateRef = useRef(null);
  const storeageStateRef = useRef(null);
  const ipStateRef = useRef(null);

  const items = useMemo(() => {
    return [
      {
        title: t("apiConnectTime", { apiUrl }),
        ref: apiStateRef,
        refresh: true,
        action: () => getConnectDelayTime(apiUrl + "/up"),
      },
      {
        title: t("storageConnectTime"),
        refresh: true,
        ref: storeageStateRef,
        action: () => getConnectDelayTime(STORAGE_WORKER_ENDPOINT),
      },
      {
        title: t("ipInfo"),
        ref: ipStateRef,
        refresh: true,
        action: async () =>
          await fetch("https://ipapi.co/json")
            .then((resp) => resp.json())
            .then((info) => ({
              text: `${info.ip} (${info.city}, ${info.country_name})`,
            })),
      },
      {
        title: t("platformInfo"),
        refresh: false,
        action: async () =>
          await EnjoyApp.app.getPlatformInfo().then((info) => ({
            text: `${info.platform} ${info.arch} ${info.version}`,
          })),
      },
    ];
  }, [apiUrl]);

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);

    await Promise.all([
      apiStateRef?.current.getConnectState({ force: true }),
      storeageStateRef?.current.getConnectState({ force: true }),
      ipStateRef?.current.getConnectState({ force: true }),
    ]);

    setRefreshing(false);
  }

  async function getConnectDelayTime(url: string) {
    const startTime = new Date().getTime();
    await fetch(url);
    const duration = new Date().getTime() - startTime;

    return {
      color:
        duration < 200
          ? "text-green-500"
          : duration < 800
          ? "text-yellow-500"
          : "text-red-500",
      text: `${duration}ms`,
    };
  }

  useEffect(() => {
    handleRefresh();
  }, [proxy]);

  return (
    <div className="py-4">
      <div className="flex items-start justify-between">
        <div className="mb-2">{t("networkState")}</div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          {t("refresh")}
        </Button>
      </div>

      <div>
        {items.map((item, index) => (
          <NetworkStateItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

const NetworkStateItem = React.forwardRef(function (
  {
    title,
    action,
    refresh,
  }: {
    title: string;
    refresh: boolean;
    action: () => Promise<{ color?: string; text: string }>;
  },
  ref
) {
  useImperativeHandle(ref, () => {
    return { getConnectState };
  });

  let timeoutId: ReturnType<typeof setTimeout | null> = null;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(false);
  const [color, setColor] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    startPolling();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  async function startPolling() {
    await getConnectState();

    if (refresh) {
      timeoutId = setTimeout(() => startPolling(), 10000);
    }
  }

  async function getConnectState(
    { force }: { force?: boolean } = { force: false }
  ) {
    if (force) setConnected(false);

    setConnecting(true);
    try {
      const { color, text } = await action();

      setColor(color);
      setText(text);
      setConnected(true);
      setConnectError(false);
    } catch (error) {
      setConnectError(true);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="text-sm text-muted-foreground flex justify-between my-2">
      <div className="">{title}</div>
      <div className="">
        {!connected && connecting ? (
          <LoaderIcon className="w-4 h-4 animate-spin" />
        ) : connectError ? (
          <span className="text-red-500">{t("connectError")}</span>
        ) : (
          <span className={color}>{text}</span>
        )}
      </div>
    </div>
  );
});
