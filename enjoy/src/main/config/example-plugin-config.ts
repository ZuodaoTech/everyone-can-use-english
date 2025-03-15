import { config } from "./config-instance";
import { PluginConfigOptions, PluginConfigSchema } from "./types";
import log from "@main/services/logger";

const logger = log.scope("ExamplePluginConfig");

/**
 * Example plugin configuration schema
 */
const EXAMPLE_PLUGIN_SCHEMA: PluginConfigSchema = {
  enabled: {
    type: "boolean",
    default: true,
    description: "Whether the example plugin is enabled",
  },
  apiKey: {
    type: "string",
    default: "",
    description: "API key for the example plugin",
  },
  options: {
    type: "object",
    default: {
      theme: "light",
      fontSize: 14,
      showNotifications: true,
    },
    description: "Options for the example plugin",
  },
};

/**
 * Example of how to register a plugin configuration
 */
export function registerExamplePluginConfig() {
  // Register the plugin configuration
  const pluginConfig = config.registerPluginConfig({
    pluginId: "example-plugin",
    schema: EXAMPLE_PLUGIN_SCHEMA,
  });

  // Example of how to get a plugin configuration value
  pluginConfig.getValue("enabled").then((enabled) => {
    logger.info(`Example plugin enabled: ${enabled}`);
  });

  // Example of how to set a plugin configuration value
  pluginConfig.set("apiKey", "example-api-key").then(() => {
    logger.info("Example plugin API key set");
  });

  // Example of how to get a nested configuration value
  pluginConfig.getValue("options").then((options) => {
    logger.info(`Example plugin options: ${JSON.stringify(options)}`);
  });

  // Example of how to set a nested configuration value
  pluginConfig
    .set("options", {
      theme: "dark",
      fontSize: 16,
      showNotifications: false,
    })
    .then(() => {
      logger.info("Example plugin options set");
    });

  // Example of how to listen for configuration changes
  pluginConfig.onDidChange((key, value) => {
    logger.info(
      `Example plugin configuration changed: ${key} = ${JSON.stringify(value)}`
    );
  });

  return pluginConfig;
}
