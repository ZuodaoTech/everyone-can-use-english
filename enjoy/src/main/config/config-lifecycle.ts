import { app } from "electron";
import { config, ConfigEvent } from "./config-manager";
import db from "@main/db";
import log from "@main/services/logger";
import { i18n } from "@main/services/i18n";

const logger = log.scope("ConfigLifecycle");

/**
 * Config lifecycle manager
 * Handles initialization, user login/logout, and cleanup
 */
export class ConfigLifecycle {
  private static instance: ConfigLifecycle;
  private initialized = false;

  private constructor() {
    // Register event listeners
    config.on(
      ConfigEvent.USER_SETTINGS_LOADED,
      this.handleUserSettingsLoaded.bind(this)
    );
    config.on(
      ConfigEvent.USER_SETTINGS_UNLOADED,
      this.handleUserSettingsUnloaded.bind(this)
    );

    // Handle app quit
    app.on("before-quit", this.handleAppQuit.bind(this));
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigLifecycle {
    if (!ConfigLifecycle.instance) {
      ConfigLifecycle.instance = new ConfigLifecycle();
    }
    return ConfigLifecycle.instance;
  }

  /**
   * Initialize the config system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn("Config system already initialized");
      return;
    }

    logger.info("Initializing config system");

    try {
      // Connect to database
      await db.connect();

      // Try to initialize i18n with user language preference
      try {
        const language = (await config.getUserSetting("language")).value;
        await i18n(language);
      } catch (error) {
        logger.warn(
          "Failed to load user language preference, using default",
          error
        );
        await i18n("zh-CN"); // Default language
      }

      this.initialized = true;
      logger.info("Config system initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize config system", error);
      throw error;
    }
  }

  /**
   * Handle user login
   * @param userId User ID
   */
  public async handleUserLogin(
    userId: string,
    userName?: string
  ): Promise<void> {
    logger.info(`User login: ${userId}`);

    // Set user in app settings
    config.setAppSetting("user", { id: userId, name: userName });

    // Ensure database is connected with the correct user
    await db.connect();
  }

  /**
   * Handle user logout
   */
  public async handleUserLogout(): Promise<void> {
    logger.info("User logout");

    // Unload user settings
    config.unloadUserSettings();

    // Clear user from app settings
    config.setAppSetting("user", null);

    // Disconnect database
    await db.disconnect();
  }

  /**
   * Handle user settings loaded event
   */
  private async handleUserSettingsLoaded(userSettings: any): Promise<void> {
    logger.info("User settings loaded");

    // Update language if needed
    if (userSettings?.language) {
      await i18n(userSettings.language);
    }
  }

  /**
   * Handle user settings unloaded event
   */
  private handleUserSettingsUnloaded(): void {
    logger.info("User settings unloaded");
  }

  /**
   * Handle app quit
   */
  private handleAppQuit(): void {
    logger.info("App quitting, cleaning up config system");

    // Disconnect database
    db.disconnect().catch((error) => {
      logger.error("Failed to disconnect database", error);
    });
  }
}

// Export singleton instance
export const configLifecycle = ConfigLifecycle.getInstance();
