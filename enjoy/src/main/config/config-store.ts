import { EventEmitter } from "events";
import fs from "fs-extra";
import path from "path";
import log from "@main/services/logger";
import {
  ConfigSchema,
  ConfigStoreOptions,
  ConfigStorageProvider,
  ConfigStoreEvent,
  ConfigStoreListener,
  ConfigSource,
  ConfigValue,
} from "./types";

const logger = log.scope("ConfigStore");

/**
 * Default file-based storage provider
 */
class FileStorageProvider implements ConfigStorageProvider {
  private filePath: string;
  private cache: Record<string, any> = {};
  private initialized = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(this.filePath));

      // Load data from file if it exists
      if (await fs.pathExists(this.filePath)) {
        const data = await fs.readFile(this.filePath, "utf8");
        this.cache = JSON.parse(data);
      }

      this.initialized = true;
    } catch (error) {
      logger.error("Failed to initialize file storage provider", error);
      // Initialize with empty cache if file can't be read
      this.cache = {};
      this.initialized = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      logger.error("Failed to persist data to file", error);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    await this.initialize();
    return this.cache[key] as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.initialize();
    this.cache[key] = value;
    await this.persist();
  }

  async has(key: string): Promise<boolean> {
    await this.initialize();
    return key in this.cache;
  }

  async delete(key: string): Promise<void> {
    await this.initialize();
    delete this.cache[key];
    await this.persist();
  }

  async clear(): Promise<void> {
    this.cache = {};
    await this.persist();
  }
}

/**
 * Memory-based storage provider (for testing or temporary storage)
 */
class MemoryStorageProvider implements ConfigStorageProvider {
  private store: Record<string, any> = {};

  async get<T>(key: string): Promise<T | undefined> {
    return this.store[key] as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store[key] = value;
  }

  async has(key: string): Promise<boolean> {
    return key in this.store;
  }

  async delete(key: string): Promise<void> {
    delete this.store[key];
  }

  async clear(): Promise<void> {
    this.store = {};
  }
}

/**
 * ConfigStore class for managing configuration values
 */
export class ConfigStore extends EventEmitter {
  private name: string;
  private schema: ConfigSchema;
  private storage: ConfigStorageProvider;
  private defaults: Record<string, any> = {};

  constructor(options: ConfigStoreOptions) {
    super();

    this.name = options.name;
    this.schema = options.schema || {};

    // Set up storage provider
    if (options.storage) {
      this.storage = options.storage;
    } else {
      // Default to file storage in user data directory
      const userDataPath =
        process.env.NODE_ENV === "test"
          ? path.join(process.cwd(), ".test-data")
          : process.env.SETTINGS_PATH ||
            process.env.APPDATA ||
            process.env.HOME ||
            ".";

      const filePath = path.join(userDataPath, `${this.name}.json`);
      this.storage = new FileStorageProvider(filePath);
    }

    // Initialize defaults from schema
    for (const [key, config] of Object.entries(this.schema)) {
      this.defaults[key] = config.default;
    }
  }

  /**
   * Get a configuration value with metadata
   */
  async get<T>(key: string): Promise<ConfigValue<T>> {
    try {
      // Check if value exists in storage
      const exists = await this.storage.has(key);
      logger.debug(`Checking if key "${key}" exists in storage: ${exists}`);

      if (exists) {
        const value = await this.storage.get<T>(key);
        logger.debug(`Retrieved value for key "${key}" from storage`);

        if (value !== undefined) {
          return {
            value: value as T,
            source: ConfigSource.FILE,
            timestamp: Date.now(),
          };
        }
      }

      // Check if there's a default value in schema
      if (key in this.defaults) {
        logger.debug(`Using default value for key "${key}"`);
        return {
          value: this.defaults[key] as T,
          source: ConfigSource.DEFAULT,
          timestamp: Date.now(),
        };
      }

      // No value found
      logger.debug(`No value found for key "${key}"`);
      throw new Error(`Config key "${key}" not found`);
    } catch (error) {
      if (error.message === `Config key "${key}" not found`) {
        throw error;
      }

      logger.warn(`Failed to get config value for key "${key}"`, error);

      // Return default value if available
      if (key in this.defaults) {
        logger.debug(`Using default value for key "${key}" after error`);
        return {
          value: this.defaults[key] as T,
          source: ConfigSource.DEFAULT,
          timestamp: Date.now(),
        };
      }

      throw error;
    }
  }

  /**
   * Get a configuration value directly
   */
  async getValue<T>(key: string): Promise<T> {
    try {
      const result = await this.get<T>(key);
      return result.value;
    } catch (error) {
      logger.warn(`Failed to get value for key "${key}"`, error);

      // Return default value if available
      if (key in this.defaults) {
        logger.debug(`Returning default value for key "${key}"`);
        return this.defaults[key] as T;
      }

      throw error;
    }
  }

  /**
   * Set a configuration value
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      // Validate value against schema if available
      if (this.schema[key] && this.schema[key].validate) {
        const isValid = this.schema[key].validate(value);
        if (!isValid) {
          throw new Error(`Invalid value for config key "${key}"`);
        }
      }

      // Store value
      await this.storage.set(key, value);

      // Emit change event
      this.emit(ConfigStoreEvent.CHANGE, key, value);
    } catch (error) {
      logger.error(`Failed to set config value for key "${key}"`, error);
      this.emit(ConfigStoreEvent.ERROR, error);
      throw error;
    }
  }

  /**
   * Check if a configuration key exists
   */
  async has(key: string): Promise<boolean> {
    return (await this.storage.has(key)) || key in this.defaults;
  }

  /**
   * Delete a configuration value
   */
  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
    this.emit(ConfigStoreEvent.CHANGE, key, undefined);
  }

  /**
   * Reset a configuration value to its default
   */
  async reset(key: string): Promise<void> {
    if (key in this.defaults) {
      await this.storage.delete(key);
      this.emit(ConfigStoreEvent.CHANGE, key, this.defaults[key]);
    } else {
      await this.storage.delete(key);
      this.emit(ConfigStoreEvent.CHANGE, key, undefined);
    }
  }

  /**
   * Clear all configuration values
   */
  async clear(): Promise<void> {
    await this.storage.clear();
    this.emit(ConfigStoreEvent.CHANGE, "*", undefined);
  }

  /**
   * Add a change listener
   */
  onDidChange(listener: ConfigStoreListener): () => void {
    this.on(ConfigStoreEvent.CHANGE, listener);
    return () => this.off(ConfigStoreEvent.CHANGE, listener);
  }

  /**
   * Create a memory-based config store (useful for testing)
   */
  static createMemoryStore(
    options: Omit<ConfigStoreOptions, "storage">
  ): ConfigStore {
    return new ConfigStore({
      ...options,
      storage: new MemoryStorageProvider(),
    });
  }
}
