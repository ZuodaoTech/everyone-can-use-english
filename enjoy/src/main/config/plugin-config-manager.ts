import { EventEmitter } from "events";
import log from "@main/services/logger";
import {
  ConfigSchema,
  ConfigSource,
  ConfigValue,
  PluginConfigOptions,
  PluginConfigSchema,
  ConfigStoreEvent,
} from "./types";
import { ConfigStore } from "./config-store";
import { DatabaseProvider } from "./database-provider";
import { type Sequelize } from "sequelize-typescript";

const logger = log.scope("PluginConfigManager");

/**
 * Plugin configuration manager
 * Manages configuration for a single plugin
 */
export class PluginConfigManager extends EventEmitter {
  private pluginId: string;
  private schema: PluginConfigSchema;
  private store: ConfigStore | null = null;
  private defaults: Record<string, any> = {};
  private isInitialized = false;

  constructor(options: PluginConfigOptions) {
    super();
    this.pluginId = options.pluginId;
    this.schema = options.schema;

    // Initialize defaults from schema
    for (const [key, config] of Object.entries(this.schema)) {
      this.defaults[key] = config.default;
    }
  }

  /**
   * Initialize the plugin configuration manager with a database connection
   */
  async initialize(db: Sequelize): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create a config store with a database provider
      this.store = new ConfigStore({
        name: `plugin-${this.pluginId}`,
        schema: this.schema,
        storage: new DatabaseProvider(db, "UserSetting", this.schema),
      });

      // Forward events from the store
      this.store.on(ConfigStoreEvent.CHANGE, (key, value) => {
        this.emit(ConfigStoreEvent.CHANGE, key, value);
      });

      this.store.on(ConfigStoreEvent.ERROR, (error) => {
        this.emit(ConfigStoreEvent.ERROR, error);
      });

      this.isInitialized = true;
      logger.info(
        `Plugin config manager initialized for plugin ${this.pluginId}`
      );
    } catch (error) {
      logger.error(
        `Failed to initialize plugin config manager for plugin ${this.pluginId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get a configuration value with metadata
   */
  async get<T>(key: string): Promise<ConfigValue<T>> {
    this.ensureInitialized();

    try {
      // Get value from store
      const result = await this.store!.get<T>(key);
      return {
        ...result,
        source: ConfigSource.PLUGIN,
      };
    } catch (error) {
      // Check if there's a default value in schema
      if (key in this.defaults) {
        return {
          value: this.defaults[key] as T,
          source: ConfigSource.DEFAULT,
          timestamp: Date.now(),
        };
      }

      logger.error(
        `Failed to get config value for key "${key}" in plugin ${this.pluginId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Get a configuration value directly
   */
  async getValue<T>(key: string): Promise<T> {
    const result = await this.get<T>(key);
    return result.value;
  }

  /**
   * Set a configuration value
   */
  async set<T>(key: string, value: T): Promise<void> {
    this.ensureInitialized();

    try {
      // Validate value against schema if available
      if (this.schema[key] && this.schema[key].validate) {
        const isValid = this.schema[key].validate(value);
        if (!isValid) {
          throw new Error(
            `Invalid value for config key "${key}" in plugin ${this.pluginId}`
          );
        }
      }

      // Store value
      await this.store!.set(key, value);
    } catch (error) {
      logger.error(
        `Failed to set config value for key "${key}" in plugin ${this.pluginId}`,
        error
      );
      throw error;
    }
  }

  /**
   * Check if a configuration key exists
   */
  async has(key: string): Promise<boolean> {
    this.ensureInitialized();
    return this.store!.has(key);
  }

  /**
   * Delete a configuration value
   */
  async delete(key: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.delete(key);
  }

  /**
   * Reset a configuration value to its default
   */
  async reset(key: string): Promise<void> {
    this.ensureInitialized();
    await this.store!.reset(key);
  }

  /**
   * Clear all configuration values
   */
  async clear(): Promise<void> {
    this.ensureInitialized();
    await this.store!.clear();
  }

  /**
   * Add a change listener
   */
  onDidChange(listener: (key: string, value: any) => void): () => void {
    this.on(ConfigStoreEvent.CHANGE, listener);
    return () => this.off(ConfigStoreEvent.CHANGE, listener);
  }

  /**
   * Ensure the plugin configuration manager is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.store) {
      throw new Error(
        `Plugin config manager for plugin ${this.pluginId} is not initialized`
      );
    }
  }
}
