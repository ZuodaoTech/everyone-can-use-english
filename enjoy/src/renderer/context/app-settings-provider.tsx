import { createContext, useEffect, useState } from "react";
import { WEB_API_URL, LANGUAGES } from "@/constants";
import { Client } from "@/api";
import i18n from "@renderer/i18n";
import ahoy from "ahoy.js";
import { type Consumer, createConsumer } from "@rails/actioncable";

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
  EnjoyApp?: EnjoyAppType;
  language?: "en" | "zh-CN";
  switchLanguage?: (language: "en" | "zh-CN") => void;
  nativeLanguage?: string;
  switchNativeLanguage?: (lang: string) => void;
  learningLanguage?: string;
  switchLearningLanguage?: (lang: string) => void;
  proxy?: ProxyConfigType;
  setProxy?: (config: ProxyConfigType) => Promise<void>;
  cable?: Consumer;
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
  const [cable, setCable] = useState<Consumer>();
  const [user, setUser] = useState<UserType | null>(null);
  const [libraryPath, setLibraryPath] = useState("");
  const [language, setLanguage] = useState<"en" | "zh-CN">();
  const [nativeLanguage, setNativeLanguage] = useState<string>("zh-CN");
  const [learningLanguage, setLearningLanguage] = useState<string>("en-US");
  const [proxy, setProxy] = useState<ProxyConfigType>();
  const EnjoyApp = window.__ENJOY_APP__;

  useEffect(() => {
    fetchVersion();
    fetchUser();
    fetchLibraryPath();
    fetchLanguages();
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
  }, [user, apiUrl, language]);

  useEffect(() => {
    if (!apiUrl) return;

    ahoy.configure({
      urlPrefix: apiUrl,
    });
  }, [apiUrl]);

  const fetchLanguages = async () => {
    const language = await EnjoyApp.settings.getLanguage();
    setLanguage(language as "en" | "zh-CN");
    i18n.changeLanguage(language);

    const _nativeLanguage =
      (await EnjoyApp.settings.get("nativeLanguage")) || "zh-CN";
    setNativeLanguage(_nativeLanguage);

    const _learningLanguage =
      (await EnjoyApp.settings.get("learningLanguage")) || "en-US";
    setLearningLanguage(_learningLanguage);
  };

  const switchLanguage = (language: "en" | "zh-CN") => {
    EnjoyApp.settings.switchLanguage(language).then(() => {
      i18n.changeLanguage(language);
      setLanguage(language);
    });
  };

  const switchNativeLanguage = (lang: string) => {
    if (LANGUAGES.findIndex((l) => l.code == lang) < 0) return;
    if (lang == learningLanguage) return;

    setNativeLanguage(lang);
    EnjoyApp.settings.set("nativeLanguage", lang);
  };

  const switchLearningLanguage = (lang: string) => {
    if (LANGUAGES.findIndex((l) => l.code == lang) < 0) return;
    if (lang == nativeLanguage) return;

    EnjoyApp.settings.set("learningLanguage", lang);
    setLearningLanguage(lang);
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
    createCable(user.accessToken);
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

  const createCable = async (token: string) => {
    const wsUrl = await EnjoyApp.app.wsUrl();
    const consumer = createConsumer(wsUrl + "/cable?token=" + token);
    setCable(consumer);
  };

  return (
    <AppSettingsProviderContext.Provider
      value={{
        language,
        switchLanguage,
        nativeLanguage,
        switchNativeLanguage,
        learningLanguage,
        switchLearningLanguage,
        EnjoyApp,
        version,
        webApi,
        apiUrl,
        user,
        login,
        logout,
        libraryPath,
        setLibraryPath: setLibraryPathHandler,
        proxy,
        setProxy: setProxyConfigHandler,
        initialized: Boolean(user && libraryPath),
        ahoy,
        cable,
      }}
    >
      {children}
    </AppSettingsProviderContext.Provider>
  );
};
