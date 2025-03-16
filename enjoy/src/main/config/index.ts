import { ConfigManager } from "./config-manager";
export * from "./config-schema";

// Create and export the instance, but don't initialize it yet
export const config = ConfigManager.getInstance();
