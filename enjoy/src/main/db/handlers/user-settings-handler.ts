import { ipcMain, IpcMainEvent } from "electron";
import { UserSetting } from "@main/db/models";
import db from "@main/db";
import { UserSettingKeyEnum } from "@/types/enums";

class UserSettingsHandler {
  private async get(_event: IpcMainEvent, key: UserSettingKeyEnum) {
    return await UserSetting.get(key);
  }

  private async set(
    _event: IpcMainEvent,
    key: UserSettingKeyEnum,
    value: string | object
  ) {
    await UserSetting.set(key, value);
  }

  private async delete(_event: IpcMainEvent, key: UserSettingKeyEnum) {
    await UserSetting.destroy({ where: { key } });
  }

  private async clear(_event: IpcMainEvent) {
    await UserSetting.destroy({ where: {} });
    db.connection.query("VACUUM");
  }

  register() {
    ipcMain.handle("user-settings-get", this.get);
    ipcMain.handle("user-settings-set", this.set);
    ipcMain.handle("user-settings-delete", this.delete);
    ipcMain.handle("user-settings-clear", this.clear);
  }

  unregister() {
    ipcMain.removeHandler("user-settings-get");
    ipcMain.removeHandler("user-settings-set");
    ipcMain.removeHandler("user-settings-delete");
    ipcMain.removeHandler("user-settings-clear");
  }
}

export const userSettingsHandler = new UserSettingsHandler();
