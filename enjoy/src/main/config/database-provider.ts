import { ConfigStorageProvider } from "./types";
import log from "@main/services/logger";
import { UserSettingKeyEnum } from "@shared/types/enums";
import { type Sequelize } from "sequelize-typescript";
const logger = log.scope("DatabaseProvider");

/**
 * Storage provider that uses the database for user settings
 * This is a placeholder implementation that will be connected to the actual database
 * when the ConfigManager is initialized
 */
export class DatabaseProvider implements ConfigStorageProvider {
  private db: any = null;

  /**
   * Set the database instance
   */
  setDatabase(db: Sequelize | null): void {
    this.db = db;
    if (this.db) {
      logger.info("DatabaseProvider db setup");
    } else {
      logger.warn("DatabaseProvider db not setup");
    }
  }

  /**
   * Map a key to a UserSettingKeyEnum
   */
  private mapKeyToEnum(key: string): UserSettingKeyEnum | null {
    // Convert camelCase to SNAKE_CASE
    const snakeCase = key
      .replace(/([A-Z])/g, "_$1")
      .toUpperCase()
      .replace(/^_/, "");

    // Check if the key exists in UserSettingKeyEnum
    if (
      Object.values(UserSettingKeyEnum).includes(
        snakeCase as UserSettingKeyEnum
      )
    ) {
      return snakeCase as UserSettingKeyEnum;
    }

    // Handle nested properties
    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0];
      const parentEnum = this.mapKeyToEnum(parentKey);

      if (parentEnum) {
        return parentEnum;
      }
    }

    return null;
  }

  /**
   * Get a value from the database
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (!this.db) {
      logger.warn(`Cannot get value for key "${key}" - database not set`);
      return undefined;
    }
    logger.debug(`Getting value for key "${key}"`);

    try {
      const settingKey = this.mapKeyToEnum(key);
      if (!settingKey) {
        logger.warn(`Unknown setting key: ${key}`);
        return undefined;
      }

      // Get the setting from the database
      const setting = await this.db.models.UserSetting.get(settingKey);
      if (!setting) {
        return undefined;
      }

      // Handle nested properties
      if (key.includes(".")) {
        const parts = key.split(".");
        const parentKey = parts[0];
        const childKey = parts.slice(1).join(".");

        if (parentKey && childKey && setting.value) {
          try {
            const parentValue = JSON.parse(setting.value);
            return this.getNestedProperty(parentValue, childKey) as T;
          } catch (error) {
            logger.error(`Failed to parse JSON for key "${key}"`, error);
            return undefined;
          }
        }
      }

      // Parse JSON value if needed
      if (
        setting.value &&
        typeof setting.value === "string" &&
        (setting.value.startsWith("{") ||
          setting.value.startsWith("[") ||
          setting.value === "true" ||
          setting.value === "false" ||
          !isNaN(Number(setting.value)))
      ) {
        try {
          return JSON.parse(setting.value) as T;
        } catch (error) {
          // If parsing fails, return the raw value
          return setting.value as unknown as T;
        }
      }

      return setting.value as unknown as T;
    } catch (error) {
      logger.error(`Failed to get value for key "${key}"`, error);
      return undefined;
    }
  }

  /**
   * Set a value in the database
   */
  async set<T>(key: string, value: T): Promise<void> {
    if (!this.db) {
      logger.warn(`Cannot set value for key "${key}" - database not set`);
      return;
    }
    logger.debug(`Setting value for key "${key}"`);

    try {
      const settingKey = this.mapKeyToEnum(key);
      if (!settingKey) {
        logger.warn(`Unknown setting key: ${key}`);
        return;
      }

      // Handle nested properties
      if (key.includes(".")) {
        const parts = key.split(".");
        const parentKey = parts[0];
        const childKey = parts.slice(1).join(".");

        const parentEnum = this.mapKeyToEnum(parentKey);
        if (parentEnum) {
          // Get the current parent value
          const currentParentValue = await this.get(parentKey);
          const parentValue = currentParentValue || {};

          // Update the nested property
          this.setNestedProperty(parentValue, childKey, value);

          // Save the updated parent value
          await this.db.models.UserSetting.set(
            parentEnum,
            JSON.stringify(parentValue)
          );
          return;
        }
      }

      // Convert value to string if it's an object or array
      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      // Save to database
      await this.db.models.UserSetting.set(settingKey, stringValue);
    } catch (error) {
      logger.error(`Failed to set value for key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in the database
   */
  async has(key: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      const settingKey = this.mapKeyToEnum(key);
      if (!settingKey) {
        return false;
      }

      const setting = await this.db.models.UserSetting.get(settingKey);

      // Handle nested properties
      if (key.includes(".") && setting?.value) {
        const parts = key.split(".");
        const parentKey = parts[0];
        const childKey = parts.slice(1).join(".");

        try {
          const parentValue = JSON.parse(setting.value);
          return this.hasNestedProperty(parentValue, childKey);
        } catch (error) {
          return false;
        }
      }

      return !!setting;
    } catch (error) {
      logger.error(`Failed to check if key "${key}" exists`, error);
      return false;
    }
  }

  /**
   * Delete a key from the database
   */
  async delete(key: string): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      const settingKey = this.mapKeyToEnum(key);
      if (!settingKey) {
        return;
      }

      // Handle nested properties
      if (key.includes(".")) {
        const parts = key.split(".");
        const parentKey = parts[0];
        const childKey = parts.slice(1).join(".");

        const parentEnum = this.mapKeyToEnum(parentKey);
        if (parentEnum) {
          // Get the current parent value
          const currentParentValue = await this.get(parentKey);
          if (currentParentValue && typeof currentParentValue === "object") {
            // Delete the nested property
            this.deleteNestedProperty(currentParentValue, childKey);

            // Save the updated parent value
            await this.db.models.UserSetting.set(
              parentEnum,
              JSON.stringify(currentParentValue)
            );
          }
          return;
        }
      }

      // Delete from database
      await this.db.models.UserSetting.destroy({
        where: {
          key: settingKey,
        },
      });
    } catch (error) {
      logger.error(`Failed to delete key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Clear all keys from the database for the current user
   */
  async clear(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.models.UserSetting.clear();
    } catch (error) {
      logger.error("Failed to clear all keys", error);
      throw error;
    }
  }

  /**
   * Get a nested property from an object
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set a nested property in an object
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Check if a nested property exists in an object
   */
  private hasNestedProperty(obj: any, path: string): boolean {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined || !(part in current)) {
        return false;
      }
      current = current[part];
    }

    return true;
  }

  /**
   * Delete a nested property from an object
   */
  private deleteNestedProperty(obj: any, path: string): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        return;
      }
      current = current[part];
    }

    delete current[parts[parts.length - 1]];
  }
}
