import { createContext, useContext, useEffect, useState } from "react";
import { WEB_API_URL, LANGUAGES, IPA_MAPPINGS } from "@/constants";
import { Client } from "@/api";
import i18n from "@renderer/i18n";
import ahoy from "ahoy.js";
import { type Consumer, createConsumer } from "@rails/actioncable";
import { DbProviderContext } from "@renderer/context";
import { UserSettingKeyEnum } from "@/types/enums";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
} from "@renderer/components/ui";
import { t } from "i18next";
import { redirect } from "react-router-dom";
import { Deposit } from "@renderer/components";

type AppSettingsProviderState = {
  webApi: Client;
  apiUrl?: string;
  setApiUrl?: (url: string) => Promise<void>;
  user: UserType | null;
  initialized: boolean;
  version?: string;
  latestVersion?: string;
  libraryPath?: string;
  login?: (user: UserType) => void;
  logout?: () => void;
  refreshAccount?: () => Promise<void>;
  setLibraryPath?: (path: string) => Promise<void>;
  EnjoyApp: EnjoyAppType;
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
  displayPreferences?: boolean;
  setDisplayPreferences?: (display: boolean) => void;
  displayDepositDialog?: boolean;
  setDisplayDepositDialog?: (display: boolean) => void;
};

const EnjoyApp = window.__ENJOY_APP__;

const initialState: AppSettingsProviderState = {
  webApi: null,
  user: null,
  initialized: false,
  EnjoyApp: EnjoyApp,
};

export const AppSettingsProviderContext =
  createContext<AppSettingsProviderState>(initialState);

export const AppSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [version, setVersion] = useState<string>("");
  const [latestVersion, setLatestVersion] = useState<string>("");
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
  const [recorderConfig, setRecorderConfig] = useState<RecorderConfigType>();
  const [ipaMappings, setIpaMappings] = useState<{ [key: string]: string }>(
    IPA_MAPPINGS
  );
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [displayDepositDialog, setDisplayDepositDialog] =
    useState<boolean>(false);
  const [displayPreferences, setDisplayPreferences] = useState<boolean>(false);

  const db = useContext(DbProviderContext);

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

  const fetchApiUrl = async () => {
    const apiUrl = await EnjoyApp.app.apiUrl();
    setApiUrl(apiUrl);
  };

  const autoLogin = async () => {
    const currentUser = await EnjoyApp.appSettings.getUser();
    if (!currentUser) return;

    setUser(currentUser);
  };

  const login = async (user: UserType) => {
    if (!user?.id) return;

    setUser(user);
    if (user.accessToken) {
      // Set current user to App settings
      EnjoyApp.appSettings.setUser({ id: user.id, name: user.name });
    }
  };

  const logout = () => {
    setUser(null);
    EnjoyApp.appSettings.setUser(null);
  };

  const fetchLibraryPath = async () => {
    const dir = await EnjoyApp.appSettings.getLibrary();
    setLibraryPath(dir);
  };

  const setLibraryPathHandler = async (dir: string) => {
    await EnjoyApp.appSettings.setLibrary(dir);
    setLibraryPath(dir);
  };

  const fetchProxyConfig = async () => {
    const config = await EnjoyApp.system.proxy.get();
    setProxy(config);
    EnjoyApp.system.proxy.refresh();
  };

  const setProxyConfigHandler = async (config: ProxyConfigType) => {
    EnjoyApp.system.proxy.set(config).then(() => {
      setProxy(config);
      EnjoyApp.system.proxy.refresh();
    });
  };

  const setApiUrlHandler = async (url: string) => {
    EnjoyApp.appSettings.setApiUrl(url).then(() => {
      EnjoyApp.app.reload();
    });
  };

  const createCable = async (token: string) => {
    if (!token) return;

    const wsUrl = await EnjoyApp.app.wsUrl();
    const consumer = createConsumer(wsUrl + "/cable?token=" + token);
    setCable(consumer);
  };

  const fetchRecorderConfig = async () => {
    const config = await EnjoyApp.userSettings.get(UserSettingKeyEnum.RECORDER);
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
    return EnjoyApp.userSettings
      .set(UserSettingKeyEnum.RECORDER, config)
      .then(() => {
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

  const refreshAccount = async () => {
    webApi.me().then((u) => {
      setUser({
        ...user,
        ...u,
      });
    });
  };

  useEffect(() => {
    if (db.state === "connected") {
      fetchLanguages();
      fetchVocabularyConfig();
      fetchRecorderConfig();
    }
  }, [db.state]);

  useEffect(() => {
    autoLogin();
    fetchVersion();
    fetchLibraryPath();
    fetchProxyConfig();
    fetchApiUrl();
  }, []);

  useEffect(() => {
    if (!apiUrl) return;

    setWebApi(
      new Client({
        baseUrl: apiUrl,
        accessToken: user?.accessToken,
        locale: language,
        onError: (err) => {
          if (user && user.accessToken && err.status == 401) {
            setUser({ ...user, accessToken: null });
          }
        },
      })
    );
  }, [user?.accessToken, apiUrl, language]);

  useEffect(() => {
    if (!apiUrl) return;

    ahoy.configure({
      urlPrefix: apiUrl,
    });
  }, [apiUrl]);

  useEffect(() => {
    if (!webApi) return;
    if (ipaMappings && latestVersion) return;

    webApi.config("ipa_mappings").then((mappings) => {
      if (mappings) setIpaMappings(mappings);
    });

    webApi.config("app_version").then((config) => {
      if (config.version) setLatestVersion(config.version);
    });
  }, [webApi]);

  useEffect(() => {
    if (!user) return;

    db.connect().then(async () => {
      // Login via API, update profile to DB
      if (user.accessToken) {
        EnjoyApp.userSettings.set(UserSettingKeyEnum.PROFILE, user);
        createCable(user.accessToken);
      } else {
        // Auto login from local settings, get full profile from DB
        const profile = await EnjoyApp.userSettings.get(
          UserSettingKeyEnum.PROFILE
        );
        setUser(profile);
        EnjoyApp.appSettings.setUser({ id: profile.id, name: profile.name });
      }
    });
    return () => {
      db.disconnect();
      setUser(null);
    };
  }, [user?.id]);

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
        latestVersion,
        webApi,
        apiUrl,
        setApiUrl: setApiUrlHandler,
        user,
        login,
        logout: () => setLoggingOut(true),
        refreshAccount,
        libraryPath,
        setLibraryPath: setLibraryPathHandler,
        proxy,
        setProxy: setProxyConfigHandler,
        vocabularyConfig,
        setVocabularyConfig: setVocabularyConfigHandler,
        initialized: Boolean(user && db.state === "connected" && libraryPath),
        ahoy,
        cable,
        recorderConfig,
        setRecorderConfig: setRecorderConfigHandler,
        ipaMappings,
        displayPreferences,
        setDisplayPreferences,
        displayDepositDialog,
        setDisplayDepositDialog,
      }}
    >
      {children}

      <AlertDialog open={loggingOut} onOpenChange={setLoggingOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("logout")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {t("logoutConfirmation")}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive-hover"
              onClick={() => {
                logout();
                redirect("/landing");
              }}
            >
              {t("logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={displayDepositDialog}
        onOpenChange={setDisplayDepositDialog}
      >
        <DialogContent className="max-h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("deposit")}</DialogTitle>
            <DialogDescription>{t("depositDescription")}</DialogDescription>
          </DialogHeader>

          {displayDepositDialog && <Deposit />}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t("close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppSettingsProviderContext.Provider>
  );
};
