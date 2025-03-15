import { IpcMainEvent } from "electron";
import { UserSetting } from "@main/db/models";
import db from "@main/db";
import { UserSettingKeyEnum } from "@/renderer/types/enums";
import { BaseHandler, HandlerMethod } from "./base-handler";

class UserSettingsHandler extends BaseHandler {
  protected prefix = "user-settings";
  protected handlers: Record<string, HandlerMethod> = {
    get: this.get.bind(this),
    set: this.set.bind(this),
    delete: this.delete.bind(this),
    clear: this.clear.bind(this),
  };

  private async get(event: IpcMainEvent, key: UserSettingKeyEnum) {
    return this.handleRequest(event, async () => {
      return await UserSetting.get(key);
    });
  }

  private async set(
    event: IpcMainEvent,
    key: UserSettingKeyEnum,
    value: string | object
  ) {
    return this.handleRequest(event, async () => {
      await UserSetting.set(key, value);
    });
  }

  private async delete(event: IpcMainEvent, key: UserSettingKeyEnum) {
    return this.handleRequest(event, async () => {
      await UserSetting.destroy({ where: { key } });
    });
  }

  private async clear(event: IpcMainEvent) {
    return this.handleRequest(event, async () => {
      await UserSetting.destroy({ where: {} });
      db.connection.query("VACUUM");
    });
  }
}

export const userSettingsHandler = new UserSettingsHandler();
