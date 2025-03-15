import { ConfigSchema, ConfigStorageProvider } from "./types";
import log from "@main/services/logger";
import { UserSettingKeyEnum } from "@shared/types/enums";
import { type Sequelize } from "sequelize-typescript";
import snakeCase from "lodash/snakeCase";

const logger = log.scope("DatabaseProvider");

/**
 * Storage provider that uses the database for user settings
 * This is a placeholder implementation that will be connected to the actual database
 * when the ConfigManager is initialized
 */
export class DatabaseProvider implements ConfigStorageProvider {
  private db: any = null;
  private model: string;
  private schema: ConfigSchema;
  private prefix: string;

  constructor(
    db: Sequelize,
    model: string,
    schema: ConfigSchema,
    prefix: string = ""
  ) {
    this.db = db;
    this.model = model;
    this.schema = schema;
    this.prefix = prefix;
  }

  /**
   * Get the full key with prefix
   */
  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}.${key}` : key;
  }

  /**
   * Map a key to a UserSettingKeyEnum
   */
  private mapKeyToEnum(key: string): UserSettingKeyEnum | string | null {
    // If we have a prefix, this is a plugin setting
    if (this.prefix) {
      // Store plugin settings with a prefix to avoid conflicts
      return `plugin.${this.prefix}.${key}`;
    }

    // First, check if the key directly matches a UserSettingKeyEnum value
    // This handles keys that are already in snake_case format
    const directMatch = Object.values(UserSettingKeyEnum).find(
      (enumValue) => enumValue === key
    );
    if (directMatch) {
      return directMatch;
    }

    // Convert camelCase to snake_case
    const snakeCaseKey = snakeCase(key);

    // Check if the snake_case version matches a UserSettingKeyEnum value
    const snakeCaseMatch = Object.values(UserSettingKeyEnum).find(
      (enumValue) => enumValue === snakeCaseKey
    );
    if (snakeCaseMatch) {
      return snakeCaseMatch;
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

    // If no match is found, check if the key exists in the schema
    if (Object.keys(this.schema).includes(key)) {
      return key;
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
      logger.debug(`Mapped key "${key}" to enum "${settingKey}"`);

      if (!settingKey) {
        logger.warn(`Unknown setting key: ${key}`);
        return undefined;
      }

      // Get the setting from the database
      const setting = await this.db.models[this.model].get(settingKey);
      logger.debug(`Retrieved setting for key "${settingKey}":`, setting);

      if (!setting) {
        logger.debug(`No setting found for key "${settingKey}"`);
        return undefined;
      }

      // Handle nested properties
      if (key.includes(".")) {
        const parts = key.split(".");
        const parentKey = parts[0];
        const childKey = parts.slice(1).join(".");

        if (parentKey && childKey && setting) {
          try {
            // The setting is already parsed by the UserSetting.get method
            const result = this.getNestedProperty(setting, childKey) as T;
            logger.debug(`Retrieved nested property "${childKey}":`, result);
            return result;
          } catch (error) {
            logger.error(
              `Failed to get nested property for key "${key}"`,
              error
            );
            return undefined;
          }
        }
      }

      // The setting is already parsed by the UserSetting.get method
      // Just return it directly
      return setting as T;
    } catch (error) {
      logger.warn(`Failed to get value for key "${key}"`, error);
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
    logger.debug(`Setting value for key "${key}"`, value);

    try {
      const settingKey = this.mapKeyToEnum(key);
      logger.debug(`Mapped key "${key}" to enum "${settingKey}"`);

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
          logger.debug(
            `Saving nested property to database with key: ${parentEnum}`,
            parentValue
          );
          await this.db.models[this.model].set(parentEnum, parentValue);
          return;
        }
      }

      // Save to database
      logger.debug(`Saving to database with key: ${settingKey}`, value);
      await this.db.models[this.model].set(settingKey, value);
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

      const setting = await this.db.models[this.model].get(settingKey);

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
            await this.db.models[this.model].set(
              parentEnum,
              JSON.stringify(currentParentValue)
            );
          }
          return;
        }
      }

      // Delete from database
      await this.db.models[this.model].destroy({
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
      if (this.prefix) {
        // Only clear keys with the current prefix
        const allSettings = await this.db.models[this.model].findAll();
        for (const setting of allSettings) {
          if (setting.key.startsWith(`plugin.${this.prefix}.`)) {
            await setting.destroy();
          }
        }
      } else {
        await this.db.models[this.model].clear();
      }
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
