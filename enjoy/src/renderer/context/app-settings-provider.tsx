import { createContext, useContext, useEffect, useState } from "react";
import { WEB_API_URL, LANGUAGES, IPA_MAPPINGS } from "@/constants";
import { Client } from "@/api";
import i18n from "@renderer/i18n";
import ahoy from "ahoy.js";
import { type Consumer, createConsumer } from "@rails/actioncable";
import * as Sentry from "@sentry/electron/renderer";
import { SENTRY_DSN } from "@/constants";
import { DbProviderContext } from "@renderer/context";
import { UserSettingKeyEnum } from "@/types/enums";

type AppSettingsProviderState = {
  webApi: Client;
  apiUrl?: string;
  setApiUrl?: (url: string) => Promise<void>;
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
  vocabularyConfig?: VocabularyConfigType;
  setVocabularyConfig?: (config: VocabularyConfigType) => Promise<void>;
  cable?: Consumer;
  ahoy?: typeof ahoy;
  recorderConfig?: RecorderConfigType;
  setRecorderConfig?: (config: RecorderConfigType) => Promise<void>;
  // remote config
  ipaMappings?: { [key: string]: string };
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
  const [vocabularyConfig, setVocabularyConfig] =
    useState<VocabularyConfigType>(null);
  const [proxy, setProxy] = useState<ProxyConfigType>();
  const EnjoyApp = window.__ENJOY_APP__;
  const [recorderConfig, setRecorderConfig] = useState<RecorderConfigType>();
  const [ipaMappings, setIpaMappings] = useState<{ [key: string]: string }>(
    IPA_MAPPINGS
  );
  const { state: dbState } = useContext(DbProviderContext);

  const initSentry = () => {
    EnjoyApp.app.isPackaged().then((isPackaged) => {
      if (isPackaged) {
        Sentry.init({
          dsn: SENTRY_DSN,
        });
      }
    });
  };

  const fetchLanguages = async () => {
    const language = await EnjoyApp.userSettings.get(
      UserSettingKeyEnum.LANGUAGE
    );
    setLanguage((language as "en" | "zh-CN") || "en");
    i18n.changeLanguage(language);

    const _nativeLanguage =
      (await EnjoyApp.userSettings.get(UserSettingKeyEnum.NATIVE_LANGUAGE)) ||
      "zh-CN";
    setNativeLanguage(_nativeLanguage);

    const _learningLanguage =
      (await EnjoyApp.userSettings.get(UserSettingKeyEnum.LEARNING_LANGUAGE)) ||
      "en-US";
    setLearningLanguage(_learningLanguage);
  };

  const switchLanguage = (language: "en" | "zh-CN") => {
    EnjoyApp.userSettings
      .set(UserSettingKeyEnum.LANGUAGE, language)
      .then(() => {
        i18n.changeLanguage(language);
        setLanguage(language);
      });
  };

  const switchNativeLanguage = (lang: string) => {
    if (LANGUAGES.findIndex((l) => l.code == lang) < 0) return;
    if (lang == learningLanguage) return;

    setNativeLanguage(lang);
    EnjoyApp.userSettings.set(UserSettingKeyEnum.NATIVE_LANGUAGE, lang);
  };

  const switchLearningLanguage = (lang: string) => {
    if (LANGUAGES.findIndex((l) => l.code == lang) < 0) return;
    if (lang == nativeLanguage) return;

    EnjoyApp.userSettings.set(UserSettingKeyEnum.LEARNING_LANGUAGE, lang);
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

  const setApiUrlHandler = async (url: string) => {
    EnjoyApp.settings.setApiUrl(url).then(() => {
      EnjoyApp.app.reload();
    });
  };

  const createCable = async (token: string) => {
    const wsUrl = await EnjoyApp.app.wsUrl();
    const consumer = createConsumer(wsUrl + "/cable?token=" + token);
    setCable(consumer);
  };

  const fetchRecorderConfig = async () => {
    const config = await EnjoyApp.settings.get("recorderConfig");
    if (config) {
      setRecorderConfig(config);
    } else {
      const defaultConfig: RecorderConfigType = {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
        sampleSize: 16,
      };
      setRecorderConfigHandler(defaultConfig);
    }
  };

  const setRecorderConfigHandler = async (config: RecorderConfigType) => {
    return EnjoyApp.settings.set("recorderConfig", config).then(() => {
      setRecorderConfig(config);
    });
  };

  const fetchVocabularyConfig = async () => {
    EnjoyApp.userSettings
      .get(UserSettingKeyEnum.VOCABULARY)
      .then((config) => {
        setVocabularyConfig(config || { lookupOnMouseOver: true });
      })
      .catch((err) => {
        console.error(err);
        setVocabularyConfig({ lookupOnMouseOver: true });
      });
  };

  const setVocabularyConfigHandler = async (config: VocabularyConfigType) => {
    await EnjoyApp.userSettings.set(UserSettingKeyEnum.VOCABULARY, config);
    setVocabularyConfig(config);
  };

  useEffect(() => {
    if (dbState !== "connected") return;

    fetchLanguages();
    fetchProxyConfig();
    fetchVocabularyConfig();
    initSentry();
    fetchRecorderConfig();
  }, [dbState]);

  useEffect(() => {
    fetchVersion();
    fetchUser();
    fetchLibraryPath();
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

  useEffect(() => {
    if (!webApi) return;

    webApi.config("ipa_mappings").then((mappings) => {
      if (mappings) setIpaMappings(mappings);
    });
  }, [webApi]);

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
        setApiUrl: setApiUrlHandler,
        user,
        login,
        logout,
        libraryPath,
        setLibraryPath: setLibraryPathHandler,
        proxy,
        setProxy: setProxyConfigHandler,
        vocabularyConfig,
        setVocabularyConfig: setVocabularyConfigHandler,
        initialized: Boolean(user && libraryPath),
        ahoy,
        cable,
        recorderConfig,
        setRecorderConfig: setRecorderConfigHandler,
        ipaMappings,
      }}
    >
      {children}
    </AppSettingsProviderContext.Provider>
  );
};
