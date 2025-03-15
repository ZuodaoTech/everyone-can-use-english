import { EventEmitter } from "events";
import log from "@main/services/logger";
import { PluginConfigManager } from "./plugin-config-manager";
import { PluginConfigOptions, ConfigStoreEvent } from "./types";
import { type Sequelize } from "sequelize-typescript";

const logger = log.scope("PluginConfigRegistry");

/**
 * Plugin configuration registry
 * Manages configuration for all plugins
 */
export class PluginConfigRegistry extends EventEmitter {
  private plugins: Map<string, PluginConfigManager> = new Map();
  private db: Sequelize | null = null;
  private isInitialized = false;

  /**
   * Initialize the plugin configuration registry with a database connection
   */
  async initialize(db: Sequelize): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.db = db;
    this.isInitialized = true;
    logger.info("Plugin config registry initialized");

    // Initialize all registered plugins
    for (const plugin of this.plugins.values()) {
      await plugin.initialize(db);
    }
  }

  /**
   * Register a plugin configuration manager
   */
  register(options: PluginConfigOptions): PluginConfigManager {
    const { pluginId } = options;

    // Check if plugin is already registered
    if (this.plugins.has(pluginId)) {
      logger.warn(`Plugin ${pluginId} is already registered`);
      return this.plugins.get(pluginId)!;
    }

    // Create a new plugin configuration manager
    const plugin = new PluginConfigManager(options);

    // Forward events from the plugin
    plugin.on(ConfigStoreEvent.CHANGE, (key, value) => {
      this.emit(ConfigStoreEvent.CHANGE, pluginId, key, value);
    });

    plugin.on(ConfigStoreEvent.ERROR, (error) => {
      this.emit(ConfigStoreEvent.ERROR, pluginId, error);
    });

    // Initialize the plugin if the registry is already initialized
    if (this.isInitialized && this.db) {
      plugin.initialize(this.db).catch((error) => {
        logger.error(`Failed to initialize plugin ${pluginId}`, error);
      });
    }

    // Add to registry
    this.plugins.set(pluginId, plugin);
    logger.info(`Plugin ${pluginId} registered`);

    return plugin;
  }

  /**
   * Unregister a plugin configuration manager
   */
  unregister(pluginId: string): void {
    if (!this.plugins.has(pluginId)) {
      logger.warn(`Plugin ${pluginId} is not registered`);
      return;
    }

    this.plugins.delete(pluginId);
    logger.info(`Plugin ${pluginId} unregistered`);
  }

  /**
   * Get a plugin configuration manager
   */
  getPlugin(pluginId: string): PluginConfigManager | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugin IDs
   */
  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Add a change listener for all plugins
   */
  onDidChange(
    listener: (pluginId: string, key: string, value: any) => void
  ): () => void {
    this.on(ConfigStoreEvent.CHANGE, listener);
    return () => this.off(ConfigStoreEvent.ERROR, listener);
  }

  /**
   * Add an error listener for all plugins
   */
  onDidError(listener: (pluginId: string, error: Error) => void): () => void {
    this.on(ConfigStoreEvent.ERROR, listener);
    return () => this.off(ConfigStoreEvent.ERROR, listener);
  }
}
