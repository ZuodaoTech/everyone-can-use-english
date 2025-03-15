// Export singleton config instance (for backward compatibility)
export { config } from "./config-instance";

// Export types
export * from "./types";

// Export new config system components
export { ConfigStore } from "./config-store";
export { ElectronSettingsProvider } from "./electron-settings-provider";
export { DatabaseProvider } from "./database-provider";
export { ConfigManager } from "./config-manager";
export { PluginConfigManager } from "./plugin-config-manager";
export { PluginConfigRegistry } from "./plugin-config-registry";
