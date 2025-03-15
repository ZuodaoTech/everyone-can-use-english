import electronSettings from "electron-settings";
import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs-extra";
import { UserSettingKeyEnum, SttEngineOptionEnum } from "@shared/types/enums";
import log from "@main/services/logger";
import {
  LIBRARY_PATH_SUFFIX,
  DATABASE_NAME,
  WEB_API_URL,
} from "@shared/constants";
import {
  AppSettings,
  UserSettings,
  Config,
  ConfigSource,
  ConfigValue,
} from "./types";
import * as i18n from "i18next";

const logger = log.scope("ConfigManager");

// Default configurations
const DEFAULT_APP_SETTINGS: AppSettings = {
  library: path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX),
  apiUrl: WEB_API_URL,
  wsUrl: "",
  proxy: null,
  user: null,
  file: "",
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  language: "zh-CN",
  nativeLanguage: "zh-CN",
  learningLanguage: "en-US",
  sttEngine: SttEngineOptionEnum.ENJOY_AZURE,
  whisper: "whisper-1",
  openai: {},
  gptEngine: {
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  },
  recorder: {
    sampleRate: 44100,
    channels: 1,
    autoStop: true,
    autoStopTime: 2000,
  },
  hotkeys: {},
  profile: null,
};

export class ConfigManager {
  private appSettings: AppSettings;
  private userSettings: UserSettings | null = null;
  private isUserSettingsLoaded = false;

  constructor() {
    // Configure electron-settings
    if (process.env.SETTINGS_PATH) {
      electronSettings.configure({
        dir: process.env.SETTINGS_PATH,
        prettify: true,
      });
    }

    // Initialize with defaults
    this.appSettings = { ...DEFAULT_APP_SETTINGS };

    // Load app settings from file
    this.loadAppSettings();

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Initialize user settings from database
   * This should be called after the database is connected
   */
  async initialize(): Promise<void> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }
  }

  /**
   * Get app setting value
   */
  getAppSetting<K extends keyof AppSettings>(
    key: K
  ): ConfigValue<AppSettings[K]> {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = this.appSettings;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }

      return {
        value: value ?? this.getDefaultAppSetting(key),
        source: value !== undefined ? ConfigSource.FILE : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    return {
      value: this.appSettings[key] ?? this.getDefaultAppSetting(key),
      source:
        this.appSettings[key] !== undefined
          ? ConfigSource.FILE
          : ConfigSource.DEFAULT,
      timestamp: Date.now(),
    };
  }

  /**
   * Set app setting value
   */
  setAppSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): void {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const lastPart = parts.pop()!;
      let target: any = this.appSettings;

      for (const part of parts) {
        if (target[part] === undefined) {
          target[part] = {};
        }
        target = target[part];
      }

      target[lastPart] = value;
      electronSettings.setSync(key, value);
      return;
    }

    this.appSettings[key] = value;
    electronSettings.setSync(key, value);

    // Special handling for certain settings
    if (key === "library") {
      this.ensureDirectories();
    }
  }

  /**
   * Get user setting value
   */
  async getUserSetting<K extends keyof UserSettings>(
    key: K
  ): Promise<ConfigValue<UserSettings[K]>> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    if (!this.userSettings) {
      return {
        value: this.getDefaultUserSetting(key),
        source: ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = this.userSettings;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }

      return {
        value: value ?? this.getDefaultUserSetting(key),
        source:
          value !== undefined ? ConfigSource.DATABASE : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }

    return {
      value: this.userSettings[key] ?? this.getDefaultUserSetting(key),
      source:
        this.userSettings[key] !== undefined
          ? ConfigSource.DATABASE
          : ConfigSource.DEFAULT,
      timestamp: Date.now(),
    };
  }

  /**
   * Set user setting value
   */
  async setUserSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    if (!this.userSettings) {
      this.userSettings = { ...DEFAULT_USER_SETTINGS };
    }

    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const lastPart = parts.pop()!;
      let target: any = this.userSettings;

      for (const part of parts) {
        if (target[part] === undefined) {
          target[part] = {};
        }
        target = target[part];
      }

      target[lastPart] = value;
    } else {
      this.userSettings[key] = value;
    }

    // Map to UserSettingKeyEnum
    const dbKey = this.mapKeyToUserSettingEnum(key);
    if (dbKey) {
      // Import UserSetting dynamically to avoid circular dependency
      const { UserSetting } = await import("@main/db/models");
      await UserSetting.set(dbKey, value);
    }

    // Special handling for language setting
    if (key === "language") {
      try {
        await i18n.changeLanguage(value as string);
      } catch (error) {
        logger.error("Failed to change language", error);
      }
    }
  }

  /**
   * Get the full configuration
   */
  async getConfig(): Promise<Config> {
    if (!this.isUserSettingsLoaded) {
      await this.loadUserSettings();
    }

    return {
      ...this.appSettings,
      user: this.userSettings
        ? {
            ...this.userSettings,
            id: this.appSettings.user?.id,
          }
        : null,
      paths: {
        userData: this.userDataPath(),
        library: this.libraryPath(),
        cache: this.cachePath(),
        db: this.dbPath(),
      },
    };
  }

  /**
   * Get the library path
   */
  libraryPath(): string {
    return this.appSettings.library;
  }

  /**
   * Get the cache path
   */
  cachePath(): string {
    const tmpDir = path.join(this.libraryPath(), "cache");
    fs.ensureDirSync(tmpDir);
    return tmpDir;
  }

  /**
   * Get the user data path
   */
  userDataPath(): string | null {
    const userId = this.appSettings.user?.id;
    if (!userId) return null;

    const userData = path.join(this.libraryPath(), userId.toString());
    fs.ensureDirSync(userData);
    return userData;
  }

  /**
   * Get the database path
   */
  dbPath(): string | null {
    if (!this.userDataPath()) return null;

    const dbName = app.isPackaged
      ? `${DATABASE_NAME}.sqlite`
      : `${DATABASE_NAME}_dev.sqlite`;
    return path.join(this.userDataPath()!, dbName);
  }

  /**
   * Get the API URL
   */
  apiUrl(): string {
    return process.env.WEB_API_URL || this.appSettings.apiUrl;
  }

  /**
   * Get all user sessions
   */
  sessions(): { id: number; name: string }[] {
    const library = this.libraryPath();
    const sessions = fs.readdirSync(library).filter((dir) => {
      return dir.match(/^\d{8}$/);
    });
    return sessions.map((id) => ({ id: parseInt(id), name: id }));
  }

  /**
   * Load app settings from electron-settings
   */
  private loadAppSettings(): void {
    // Load library path
    const libraryFromSettings = electronSettings.getSync("library");
    if (libraryFromSettings && typeof libraryFromSettings === "string") {
      let libraryPath = libraryFromSettings;

      // Ensure library path ends with the correct suffix
      if (path.parse(libraryPath).base !== LIBRARY_PATH_SUFFIX) {
        libraryPath = path.join(libraryPath, LIBRARY_PATH_SUFFIX);
        electronSettings.setSync("library", libraryPath);
      }

      this.appSettings.library = libraryPath;
    } else {
      // Set default library path
      const defaultLibrary =
        process.env.LIBRARY_PATH ||
        path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX);

      electronSettings.setSync("library", defaultLibrary);
      this.appSettings.library = defaultLibrary;
    }

    // Load API URL
    const apiUrlFromSettings = electronSettings.getSync("apiUrl");
    if (apiUrlFromSettings && typeof apiUrlFromSettings === "string") {
      this.appSettings.apiUrl = apiUrlFromSettings;
    } else {
      electronSettings.setSync("apiUrl", DEFAULT_APP_SETTINGS.apiUrl);
    }

    // Load user
    const userFromSettings = electronSettings.getSync("user");
    if (userFromSettings && typeof userFromSettings === "object") {
      this.appSettings.user = userFromSettings as AppSettings["user"];
    }
  }

  /**
   * Load user settings from database
   */
  private async loadUserSettings(): Promise<void> {
    try {
      // Initialize with defaults
      this.userSettings = { ...DEFAULT_USER_SETTINGS };

      // Import UserSetting dynamically to avoid circular dependency
      const { UserSetting } = await import("@main/db/models");

      // Load settings from database
      for (const key of Object.values(UserSettingKeyEnum)) {
        const value = await UserSetting.get(key);
        if (value !== null) {
          this.setUserSettingFromDb(key, value);
        }
      }

      this.isUserSettingsLoaded = true;
      logger.info("User settings loaded");
    } catch (error) {
      logger.error("Failed to load user settings", error);
    }
  }

  /**
   * Set user setting from database value
   */
  private setUserSettingFromDb(key: UserSettingKeyEnum, value: any): void {
    if (!this.userSettings) {
      this.userSettings = { ...DEFAULT_USER_SETTINGS };
    }

    switch (key) {
      case UserSettingKeyEnum.LANGUAGE:
        this.userSettings.language = value;
        break;
      case UserSettingKeyEnum.NATIVE_LANGUAGE:
        this.userSettings.nativeLanguage = value;
        break;
      case UserSettingKeyEnum.LEARNING_LANGUAGE:
        this.userSettings.learningLanguage = value;
        break;
      case UserSettingKeyEnum.STT_ENGINE:
        this.userSettings.sttEngine = value;
        break;
      case UserSettingKeyEnum.WHISPER:
        this.userSettings.whisper = value;
        break;
      case UserSettingKeyEnum.OPENAI:
        this.userSettings.openai = value;
        break;
      case UserSettingKeyEnum.GPT_ENGINE:
        this.userSettings.gptEngine = value;
        break;
      case UserSettingKeyEnum.RECORDER:
        this.userSettings.recorder = value;
        break;
      case UserSettingKeyEnum.HOTKEYS:
        this.userSettings.hotkeys = value;
        break;
      case UserSettingKeyEnum.PROFILE:
        this.userSettings.profile = value;
        break;
    }
  }

  /**
   * Map a user setting key to UserSettingKeyEnum
   */
  private mapKeyToUserSettingEnum(key: string): UserSettingKeyEnum | null {
    // Handle nested properties
    const baseKey = key.split(".")[0];

    switch (baseKey) {
      case "language":
        return UserSettingKeyEnum.LANGUAGE;
      case "nativeLanguage":
        return UserSettingKeyEnum.NATIVE_LANGUAGE;
      case "learningLanguage":
        return UserSettingKeyEnum.LEARNING_LANGUAGE;
      case "sttEngine":
        return UserSettingKeyEnum.STT_ENGINE;
      case "whisper":
        return UserSettingKeyEnum.WHISPER;
      case "openai":
        return UserSettingKeyEnum.OPENAI;
      case "gptEngine":
        return UserSettingKeyEnum.GPT_ENGINE;
      case "recorder":
        return UserSettingKeyEnum.RECORDER;
      case "hotkeys":
        return UserSettingKeyEnum.HOTKEYS;
      case "profile":
        return UserSettingKeyEnum.PROFILE;
      default:
        return null;
    }
  }

  /**
   * Get default app setting value
   */
  private getDefaultAppSetting<K extends keyof AppSettings>(
    key: K
  ): AppSettings[K] {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = DEFAULT_APP_SETTINGS;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }

    return DEFAULT_APP_SETTINGS[key];
  }

  /**
   * Get default user setting value
   */
  private getDefaultUserSetting<K extends keyof UserSettings>(
    key: K
  ): UserSettings[K] {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      let value: any = DEFAULT_USER_SETTINGS;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      return value;
    }

    return DEFAULT_USER_SETTINGS[key];
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    try {
      // Use direct property access instead of method calls to avoid circular dependencies
      fs.ensureDirSync(this.appSettings.library);

      // Create cache directory
      const cacheDir = path.join(this.appSettings.library, "cache");
      fs.ensureDirSync(cacheDir);

      // Create user data directories if user is set
      const userId = this.appSettings.user?.id;
      if (userId) {
        const userData = path.join(this.appSettings.library, userId.toString());
        fs.ensureDirSync(userData);
        fs.ensureDirSync(path.join(userData, "backup"));
        fs.ensureDirSync(path.join(userData, "speeches"));
        fs.ensureDirSync(path.join(userData, "recordings"));
      }
    } catch (error) {
      logger.error("Failed to ensure directories", error);
    }
  }

  /**
   * Register IPC handlers for configuration
   */
  registerIpcHandlers(): void {
    // Import ipcMain dynamically to avoid circular dependency
    ipcMain.handle("config-get-library", () => {
      return this.getAppSetting("library").value;
    });

    ipcMain.handle("config-get-user", () => {
      return this.getAppSetting("user").value;
    });

    ipcMain.handle(
      "config-set-user",
      (_event: any, user: AppSettings["user"]) => {
        this.setAppSetting("user", user);
      }
    );

    ipcMain.handle("config-get-user-data-path", () => {
      return this.userDataPath();
    });

    ipcMain.handle("config-get-api-url", () => {
      return this.getAppSetting("apiUrl").value;
    });

    ipcMain.handle("config-set-api-url", (_event: any, url: string) => {
      this.setAppSetting("apiUrl", url);
    });

    ipcMain.handle("config-get-sessions", () => {
      return this.sessions();
    });

    // User settings
    ipcMain.handle(
      "config-get-user-setting",
      async (_event: any, key: string) => {
        return (await this.getUserSetting(key as any)).value;
      }
    );

    ipcMain.handle(
      "config-set-user-setting",
      async (_event: any, key: string, value: any) => {
        await this.setUserSetting(key as any, value);
      }
    );

    // Full config
    ipcMain.handle("config-get", async () => {
      return this.getConfig();
    });

    // Add backward compatibility handlers for old IPC channels
    ipcMain.handle("app-settings-get-library", () => {
      return this.getAppSetting("library").value;
    });

    ipcMain.handle("app-settings-get-user", () => {
      return this.getAppSetting("user").value;
    });

    ipcMain.handle("app-settings-set-user", (_event: any, user: any) => {
      this.setAppSetting("user", user);
    });

    ipcMain.handle("app-settings-get-user-data-path", () => {
      return this.userDataPath();
    });

    ipcMain.handle("app-settings-get-api-url", () => {
      return this.getAppSetting("apiUrl").value;
    });

    ipcMain.handle("app-settings-set-api-url", (_event: any, url: string) => {
      this.setAppSetting("apiUrl", url);
    });

    ipcMain.handle("app-settings-get-sessions", () => {
      return this.sessions();
    });
  }
}
