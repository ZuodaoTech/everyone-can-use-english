import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} from "electron";
import { t } from "i18next";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    const menu = Menu.buildFromTemplate(this.buildMenuTemplate());
    Menu.setApplicationMenu(menu);

    return menu;
  }

  buildMenuTemplate(): MenuItemConstructorOptions[] {
    return [
      {
        label: t("file"),
        submenu: [
          {
            label: t("addAudio"),
            click: () => this.mainWindow.webContents.send("on-add-audio"),
          },
          {
            label: t("addVideo"),
            click: () => this.mainWindow.webContents.send("on-add-video"),
          },
          {
            label: t("addDocument"),
            click: () => this.mainWindow.webContents.send("on-add-document"),
          },
        ],
      },
    ];
  }
}
