import { ipcMain, IpcMainEvent } from "electron";
import log from "@main/services/logger";

export type HandlerMethod = (
  event: IpcMainEvent,
  ...args: any[]
) => Promise<any>;

export abstract class BaseHandler {
  protected logger = log.scope(this.constructor.name);
  protected abstract prefix: string;
  protected abstract handlers: Record<string, HandlerMethod>;

  /**
   * Register all IPC handlers for this handler class
   *
   * This method automatically registers all handlers defined in the handlers object
   * with the appropriate channel name (prefix-handlerName). Each handler is bound
   * to the current instance to ensure proper 'this' context.
   */
  register(): void {
    this.logger.info(
      `Registering ${Object.keys(this.handlers).length} handlers for ${
        this.prefix
      }`
    );

    Object.entries(this.handlers).forEach(([name, handler]) => {
      const channelName = `${this.prefix}-${name}`;
      ipcMain.handle(channelName, handler.bind(this));
    });
  }

  /**
   * Unregister all IPC handlers
   */
  unregister(): void {
    this.logger.info(`Unregistering handlers for ${this.prefix}`);

    Object.entries(this.handlers).forEach(([name]) => {
      const channelName = `${this.prefix}-${name}`;
      ipcMain.removeHandler(channelName);
    });
  }

  /**
   * Helper method to handle errors consistently
   */
  protected async handleRequest<T>(
    event: IpcMainEvent,
    callback: () => Promise<T>
  ): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      this.logger.error(error);
      event.sender.send("on-notification", {
        type: "error",
        message: error.message,
      });
      throw error;
    }
  }
}
