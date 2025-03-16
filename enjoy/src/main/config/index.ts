// Export singleton config instance (for backward compatibility)
export { config } from "./config-instance";

// Export types
export * from "./types";

// Export config manager and events
export { ConfigManager, ConfigEvent } from "./config-manager";
export { configLifecycle } from "./config-lifecycle";
