import { ipcMain, IpcMainEvent } from "electron";
import { UserSetting } from "@main/db/models";
import db from "@main/db";

class UserSettingsHandler {
  private async get(event: IpcMainEvent, key: UserSettingKey) {
    return UserSetting.get(key)
      .then((value) => {
        return value;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async set(
    event: IpcMainEvent,
    key: UserSettingKey,
    value: string | object
  ) {
    return UserSetting.set(key, value)
      .then(() => {
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async delete(event: IpcMainEvent, key: UserSettingKey) {
    return UserSetting.destroy({ where: { key } })
      .then(() => {
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  private async clear(event: IpcMainEvent) {
    return UserSetting.destroy({ where: {} })
      .then(() => {
        db.connection.query("VACUUM");
        return;
      })
      .catch((err) => {
        event.sender.send("on-notification", {
          type: "error",
          message: err.message,
        });
      });
  }

  register() {
    ipcMain.handle("user-settings-get", this.get);
    ipcMain.handle("user-settings-set", this.set);
    ipcMain.handle("user-settings-delete", this.delete);
    ipcMain.handle("user-settings-clear", this.clear);
  }
}

export const userSettingsHandler = new UserSettingsHandler();
