import electronSettings from "electron-settings";
import { app, ipcMain } from "electron";
import path from "path";
import fs from "fs-extra";
import log from "@main/services/logger";
import { DATABASE_NAME, LIBRARY_PATH_SUFFIX } from "@shared/constants";
import {
  AppConfigType,
  UserConfigType,
  ConfigType,
  ConfigSource,
  ConfigValue,
} from "@shared/types/config";
import * as i18n from "i18next";
import snakeCase from "lodash/snakeCase";
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_USER_SETTINGS,
  USER_SETTINGS_SCHEMA,
} from "./config-schema";
import { EventEmitter } from "events";
import { type UserSetting } from "@main/db/models";
import { UserSettingKeyEnum } from "@/shared/types/enums";

const logger = log.scope("ConfigManager");

// Add this new enum for config events
export enum ConfigEvent {
  USER_SETTINGS_LOADED = "userSettingsLoaded",
  USER_SETTINGS_UNLOADED = "userSettingsUnloaded",
  APP_SETTINGS_CHANGED = "appSettingsChanged",
  USER_SETTINGS_CHANGED = "userSettingsChanged",
}

export class ConfigManager extends EventEmitter {
  private static instance: ConfigManager;

  // Core properties
  private appSettings: AppConfigType;
  private userSettings: UserConfigType | null = null;
  private isUserSettingsLoaded = false;
  private db: typeof UserSetting | null = null;

  constructor() {
    super(); // Initialize EventEmitter

    // Initialize with defaults
    this.appSettings = { ...DEFAULT_APP_SETTINGS };

    // Load app settings from file
    this.loadAppSettings();

    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get app setting value
   */
  getAppSetting<K extends keyof AppConfigType>(
    key: K
  ): ConfigValue<AppConfigType[K]> {
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
  setAppSetting<K extends keyof AppConfigType>(
    key: K,
    value: AppConfigType[K]
  ): void {
    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0] as keyof AppConfigType;
      const childKey = parts.slice(1).join(".");

      // Get parent value
      let parentValue = this.appSettings[parentKey];
      if (!parentValue || typeof parentValue !== "object") {
        parentValue = {} as any;
      }

      // Set nested property
      let current: any = parentValue;
      const childParts = childKey.split(".");
      for (let i = 0; i < childParts.length - 1; i++) {
        const part = childParts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[childParts[childParts.length - 1]] = value;

      // Update app settings
      this.appSettings[parentKey] = parentValue as any;

      // Save to electron-settings
      electronSettings.setSync(parentKey, parentValue);

      // Emit event that app settings changed
      this.emit(ConfigEvent.APP_SETTINGS_CHANGED, key, value);

      return;
    }

    // Update app settings
    this.appSettings[key] = value;

    // Save to electron-settings
    electronSettings.setSync(key, value);

    // Emit event that app settings changed
    this.emit(ConfigEvent.APP_SETTINGS_CHANGED, key, value);
  }

  /**
   * Get user setting value
   */
  async getUserSetting<K extends keyof UserConfigType>(
    key: K
  ): Promise<ConfigValue<UserConfigType[K]>> {
    logger.debug(`getUserSetting: ${key}`);
    if (!this.isUserSettingsLoaded) {
      throw new Error("User settings not loaded");
    }

    try {
      // Try to get the value from the database first
      if (this.db) {
        // Convert camelCase to snake_case for database lookup
        const dbKey = snakeCase(key);
        logger.debug(`Looking up setting in database with key: ${dbKey}`);
        const dbValue = await this.db.get(dbKey);

        if (dbValue !== undefined) {
          logger.debug(`Found value in database for ${key}:`, dbValue);
          return {
            value: dbValue as UserConfigType[K],
            source: ConfigSource.DATABASE,
            timestamp: Date.now(),
          };
        }
      }

      // Handle nested properties
      if (key.toString().includes(".")) {
        const parts = key.toString().split(".");
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

      // Return from in-memory cache or default
      logger.debug(
        `Using in-memory value for ${key}:`,
        this.userSettings?.[key]
      );
      return {
        value: this.userSettings?.[key] ?? this.getDefaultUserSetting(key),
        source:
          this.userSettings?.[key] !== undefined
            ? ConfigSource.DATABASE
            : ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error(`Error getting user setting ${key}:`, error);
      return {
        value: this.getDefaultUserSetting(key),
        source: ConfigSource.DEFAULT,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Set user setting value
   */
  async setUserSetting<K extends keyof UserConfigType>(
    key: K,
    value: UserConfigType[K]
  ): Promise<void> {
    logger.debug(`setUserSetting: ${key}`, value);
    if (!this.isUserSettingsLoaded) {
      throw new Error("User settings not loaded");
    }

    // Initialize user settings if null
    if (!this.userSettings) {
      this.userSettings = { ...DEFAULT_USER_SETTINGS };
    }

    try {
      // Handle nested properties
      if (key.toString().includes(".")) {
        const parts = key.toString().split(".");
        const parentKey = parts[0] as keyof UserConfigType;
        const childKey = parts.slice(1).join(".");

        // Get parent value
        let parentValue = this.userSettings[parentKey];
        if (!parentValue || typeof parentValue !== "object") {
          parentValue = {} as any;
        }

        // Set nested property
        let current: any = parentValue;
        const childParts = childKey.split(".");
        for (let i = 0; i < childParts.length - 1; i++) {
          const part = childParts[i];
          if (!current[part] || typeof current[part] !== "object") {
            current[part] = {};
          }
          current = current[part];
        }
        current[childParts[childParts.length - 1]] = value;

        // Update user settings
        this.userSettings[parentKey] = parentValue as any;

        // Save to database directly
        if (this.db) {
          // Convert camelCase to snake_case for database storage
          const dbKey = snakeCase(parentKey);
          logger.debug(
            `Saving nested property to database with key: ${dbKey}`,
            parentValue
          );
          await this.db.set(dbKey as UserSettingKeyEnum, parentValue);
        }

        // Emit event that user settings changed
        this.emit(ConfigEvent.USER_SETTINGS_CHANGED, key, value);

        return;
      }

      // Update user settings in memory
      this.userSettings[key] = value;

      // Save to database directly
      if (this.db) {
        // Convert camelCase to snake_case for database storage
        const dbKey = snakeCase(key);

        logger.debug(`Saving to database with key: ${dbKey}`);
        await this.db.set(dbKey as UserSettingKeyEnum, value);
      }

      // Special handling for language change
      if (key === "language") {
        await i18n.changeLanguage(value as string);
      }

      // Emit event that user settings changed
      this.emit(ConfigEvent.USER_SETTINGS_CHANGED, key, value);
    } catch (error) {
      logger.error(`Error setting user setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get the full configuration
   */
  async getConfig(): Promise<ConfigType> {
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
      electronSettings.setSync("library", this.appSettings.library);
    }

    // Load API URL
    const apiUrl = electronSettings.getSync("apiUrl");
    if (apiUrl && typeof apiUrl === "string") {
      this.appSettings.apiUrl = apiUrl;
    } else {
      // Set default API URL
      electronSettings.setSync("apiUrl", this.appSettings.apiUrl);
    }

    // Load WebSocket URL
    const wsUrl = electronSettings.getSync("wsUrl");
    if (wsUrl && typeof wsUrl === "string") {
      this.appSettings.wsUrl = wsUrl;
    }

    // Load proxy settings
    const proxy = electronSettings.getSync("proxy");
    if (proxy) {
      this.appSettings.proxy = proxy as any;
    }

    // Load user settings
    const user = electronSettings.getSync("user");
    if (user) {
      this.appSettings.user = user as any;
    }
  }

  /**
   * Load user settings from database
   */
  async loadUserSettings(db: typeof UserSetting): Promise<void> {
    logger.info("Loading user settings from database");

    // Store database reference
    this.db = db;

    // Initialize user settings with defaults
    this.userSettings = { ...DEFAULT_USER_SETTINGS };

    try {
      // Load each user setting
      for (const key of Object.keys(USER_SETTINGS_SCHEMA)) {
        logger.debug(`Loading user setting: ${key}`);

        // Convert camelCase to snake_case for database lookup
        const dbKey = snakeCase(key);

        const value = await this.db.get(dbKey);
        logger.debug(`Loaded value for ${key}`);

        if (value !== undefined) {
          logger.debug(`Setting value for ${key}`);
          this.setUserSettingFromValue(key as keyof UserConfigType, value);
        } else {
          logger.debug(`No value found for ${key}, using default`);
        }
      }

      this.isUserSettingsLoaded = true;

      // Emit event that user settings are loaded
      this.emit(ConfigEvent.USER_SETTINGS_LOADED, this.userSettings);
    } catch (error) {
      logger.error("Failed to load user settings from database", error);
      this.isUserSettingsLoaded = false;
    }
  }

  /**
   * Set user setting from database value
   */
  private setUserSettingFromValue(key: keyof UserConfigType, value: any): void {
    // Handle nested properties
    if (key.toString().includes(".")) {
      const parts = key.toString().split(".");
      const parentKey = parts[0] as keyof UserConfigType;
      const childKey = parts.slice(1).join(".");

      // Get parent value
      let parentValue = this.userSettings?.[parentKey];
      if (!parentValue || typeof parentValue !== "object") {
        parentValue = {} as any;
      }

      // Set nested property
      let current: any = parentValue;
      const childParts = childKey.split(".");
      for (let i = 0; i < childParts.length - 1; i++) {
        const part = childParts[i];
        if (!current[part] || typeof current[part] !== "object") {
          current[part] = {};
        }
        current = current[part];
      }
      current[childParts[childParts.length - 1]] = value;

      // Update user settings
      if (this.userSettings) {
        this.userSettings[parentKey] = parentValue as any;
      }

      return;
    }

    // Update user settings
    if (this.userSettings) {
      // Use type assertion to ensure type safety
      this.userSettings[key] = value as any;
    }
  }

  /**
   * Get default app setting value
   */
  private getDefaultAppSetting<K extends keyof AppConfigType>(
    key: K
  ): AppConfigType[K] {
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
  private getDefaultUserSetting<K extends keyof UserConfigType>(
    key: K
  ): UserConfigType[K] {
    // Handle nested properties
    if (key.toString().includes(".")) {
      const parts = key.toString().split(".");
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
   * Unload user settings (e.g., when user logs out)
   */
  unloadUserSettings(): void {
    logger.info("Unloading user settings");
    this.userSettings = null;
    this.db = null;
    this.isUserSettingsLoaded = false;

    // Emit event that user settings are unloaded
    this.emit(ConfigEvent.USER_SETTINGS_UNLOADED);
  }

  /**
   * Register IPC handlers for configuration
   */
  registerIpcHandlers(): void {
    ipcMain.handle("config-get-library", () => {
      return this.getAppSetting("library").value;
    });

    ipcMain.handle("config-get-user", () => {
      return this.getAppSetting("user").value;
    });

    ipcMain.handle(
      "config-set-user",
      (_event: any, user: AppConfigType["user"]) => {
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
  }
}

export const config = ConfigManager.getInstance();
