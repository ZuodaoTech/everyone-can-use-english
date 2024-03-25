import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "@renderer/components/ui";
import { WEB_API_URL } from "@/constants";
import { Client } from "@/api";
import i18n from "@renderer/i18n";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import ahoy from "ahoy.js";

type AppSettingsProviderState = {
  webApi: Client;
  apiUrl?: string;
  user: UserType | null;
  initialized: boolean;
  version?: string;
  libraryPath?: string;
  login?: (user: UserType) => void;
  logout?: () => void;
  setLibraryPath?: (path: string) => Promise<void>;
  ffmpegWasm?: FFmpeg;
  ffmpegValid?: boolean;
  EnjoyApp?: EnjoyAppType;
  language?: "en" | "zh-CN";
  switchLanguage?: (language: "en" | "zh-CN") => void;
  proxy?: ProxyConfigType;
  setProxy?: (config: ProxyConfigType) => Promise<void>;
  ahoy?: typeof ahoy;
};

const initialState: AppSettingsProviderState = {
  webApi: null,
  user: null,
  initialized: false,
};

export const AppSettingsProviderContext =
  createContext<AppSettingsProviderState>(initialState);

export const AppSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [version, setVersion] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>(WEB_API_URL);
  const [webApi, setWebApi] = useState<Client>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [libraryPath, setLibraryPath] = useState("");
  const [ffmpegWasm, setFfmpegWasm] = useState<FFmpeg>(null);
  const [ffmpegValid, setFfmpegValid] = useState<boolean>(false);
  const [language, setLanguage] = useState<"en" | "zh-CN">();
  const [proxy, setProxy] = useState<ProxyConfigType>();
  const EnjoyApp = window.__ENJOY_APP__;

  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    fetchVersion();
    fetchUser();
    fetchLibraryPath();
    fetchLanguage();
    prepareFfmpeg();
    fetchProxyConfig();
  }, []);

  useEffect(() => {
    if (!apiUrl) return;

    setWebApi(
      new Client({
        baseUrl: apiUrl,
        accessToken: user?.accessToken,
        locale: language,
      })
    );

    if (user) {
      ahoy.configure({
        urlPrefix: apiUrl,
      });
      ahoy.debug();
      ahoy.track("logged in", { user: user.id });
    }
  }, [user, apiUrl, language]);

  const prepareFfmpeg = async () => {
    try {
      const valid = await EnjoyApp.ffmpeg.check();
      setFfmpegValid(valid);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }

    loadFfmpegWASM();
  };

  const loadFfmpegWASM = async () => {
    const baseURL = "assets/libs";
    ffmpegRef.current.on("log", ({ message }) => {
      console.log(message);
    });

    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    );
    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    );
    const workerURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.worker.js`,
      "text/javascript"
    );

    try {
      await ffmpegRef.current.load({
        coreURL,
        wasmURL,
        workerURL,
      });
      setFfmpegWasm(ffmpegRef.current);
      (window as any).ffmpeg = ffmpegRef.current;
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchLanguage = async () => {
    const language = await EnjoyApp.settings.getLanguage();
    setLanguage(language as "en" | "zh-CN");
    i18n.changeLanguage(language);
  };

  const switchLanguage = (language: "en" | "zh-CN") => {
    EnjoyApp.settings.switchLanguage(language).then(() => {
      i18n.changeLanguage(language);
      setLanguage(language);
    });
  };

  const fetchVersion = async () => {
    const version = EnjoyApp.app.version;
    setVersion(version);
  };

  const fetchUser = async () => {
    const apiUrl = await EnjoyApp.app.apiUrl();
    setApiUrl(apiUrl);

    const currentUser = await EnjoyApp.settings.getUser();
    if (!currentUser) return;

    const client = new Client({
      baseUrl: apiUrl,
      accessToken: currentUser.accessToken,
    });

    client.me().then((user) => {
      if (user?.id) {
        login(Object.assign({}, currentUser, user));
      } else {
        logout();
      }
    });
  };

  const login = (user: UserType) => {
    setUser(user);
    EnjoyApp.settings.setUser(user);
  };

  const logout = () => {
    setUser(null);
    EnjoyApp.settings.setUser(null);
  };

  const fetchLibraryPath = async () => {
    const dir = await EnjoyApp.settings.getLibrary();
    setLibraryPath(dir);
  };

  const setLibraryPathHandler = async (dir: string) => {
    await EnjoyApp.settings.setLibrary(dir);
    setLibraryPath(dir);
  };

  const fetchProxyConfig = async () => {
    const config = await EnjoyApp.system.proxy.get();
    setProxy(config);
  };

  const setProxyConfigHandler = async (config: ProxyConfigType) => {
    EnjoyApp.system.proxy.set(config).then(() => {
      setProxy(config);
    });
  };

  return (
    <AppSettingsProviderContext.Provider
      value={{
        language,
        switchLanguage,
        EnjoyApp,
        version,
        webApi,
        apiUrl,
        user,
        login,
        logout,
        libraryPath,
        setLibraryPath: setLibraryPathHandler,
        ffmpegValid,
        ffmpegWasm,
        proxy,
        setProxy: setProxyConfigHandler,
        initialized: Boolean(user && libraryPath),
        ahoy,
      }}
    >
      {children}
    </AppSettingsProviderContext.Provider>
  );
};
