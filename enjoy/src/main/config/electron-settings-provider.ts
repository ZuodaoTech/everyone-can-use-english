import electronSettings from "electron-settings";
import { ConfigStorageProvider } from "./types";
import log from "@main/services/logger";

const logger = log.scope("ElectronSettingsProvider");

// Type definition for electron-settings values
type SettingsValuePrimitive = string | number | boolean | null | undefined;
type SettingsValueObject = { [key: string]: SettingsValue };
type SettingsValueArray = SettingsValue[];
type SettingsValue =
  | SettingsValuePrimitive
  | SettingsValueObject
  | SettingsValueArray;

/**
 * Storage provider that uses electron-settings
 */
export class ElectronSettingsProvider implements ConfigStorageProvider {
  private prefix: string;
  private initialized = false;

  constructor(prefix: string = "") {
    this.prefix = prefix;
  }

  /**
   * Initialize electron-settings with custom path if provided
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (process.env.SETTINGS_PATH) {
      electronSettings.configure({
        dir: process.env.SETTINGS_PATH,
        prettify: true,
      });
    }

    this.initialized = true;
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}.${key}` : key;
  }

  /**
   * Get a value from electron-settings
   */
  async get<T>(key: string): Promise<T | undefined> {
    await this.initialize();
    try {
      const fullKey = this.getFullKey(key);
      const value = electronSettings.getSync(fullKey);
      return value as T;
    } catch (error) {
      logger.error(`Failed to get value for key "${key}"`, error);
      return undefined;
    }
  }

  /**
   * Set a value in electron-settings
   */
  async set<T>(key: string, value: T): Promise<void> {
    await this.initialize();
    try {
      const fullKey = this.getFullKey(key);
      // Cast to any to bypass type checking since we can't guarantee T matches SettingsValue
      // This is safe because electron-settings will handle the validation internally
      electronSettings.setSync(fullKey, value as any);
    } catch (error) {
      logger.error(`Failed to set value for key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in electron-settings
   */
  async has(key: string): Promise<boolean> {
    await this.initialize();
    try {
      const fullKey = this.getFullKey(key);
      return electronSettings.hasSync(fullKey);
    } catch (error) {
      logger.error(`Failed to check if key "${key}" exists`, error);
      return false;
    }
  }

  /**
   * Delete a key from electron-settings
   */
  async delete(key: string): Promise<void> {
    await this.initialize();
    try {
      const fullKey = this.getFullKey(key);
      electronSettings.unsetSync(fullKey);
    } catch (error) {
      logger.error(`Failed to delete key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Clear all keys from electron-settings
   * Note: This only clears keys with the current prefix
   */
  async clear(): Promise<void> {
    await this.initialize();
    try {
      if (this.prefix) {
        // Only clear keys with the current prefix
        electronSettings.unsetSync(this.prefix);
      } else {
        // Clear all keys
        const allSettings = electronSettings.getSync();
        if (typeof allSettings === "object" && allSettings !== null) {
          for (const key of Object.keys(allSettings)) {
            electronSettings.unsetSync(key);
          }
        }
      }
    } catch (error) {
      logger.error("Failed to clear all keys", error);
      throw error;
    }
  }
}
