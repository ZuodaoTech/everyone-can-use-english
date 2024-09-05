import settings from "electron-settings";
import { LIBRARY_PATH_SUFFIX, DATABASE_NAME, WEB_API_URL } from "@/constants";
import { ipcMain, app } from "electron";
import path from "path";
import fs from "fs-extra";
import { AppSettingsKeyEnum } from "@/types/enums";

if (process.env.SETTINGS_PATH) {
  settings.configure({
    dir: process.env.SETTINGS_PATH,
    prettify: true,
  });
}

const libraryPath = () => {
  const _library = settings.getSync("library");

  if (!_library || typeof _library !== "string") {
    settings.setSync(
      AppSettingsKeyEnum.LIBRARY,
      process.env.LIBRARY_PATH ||
        path.join(app.getPath("documents"), LIBRARY_PATH_SUFFIX)
    );
  } else if (path.parse(_library).base !== LIBRARY_PATH_SUFFIX) {
    settings.setSync(
      AppSettingsKeyEnum.LIBRARY,
      path.join(_library, LIBRARY_PATH_SUFFIX)
    );
  }

  const library = settings.getSync(AppSettingsKeyEnum.LIBRARY) as string;
  fs.ensureDirSync(library);

  return library;
};

const cachePath = () => {
  const tmpDir = path.join(libraryPath(), "cache");
  fs.ensureDirSync(tmpDir);

  return tmpDir;
};

const dbPath = () => {
  const dbName = app.isPackaged
    ? `${DATABASE_NAME}.sqlite`
    : `${DATABASE_NAME}_dev.sqlite`;
  return path.join(userDataPath(), dbName);
};

const userDataPath = () => {
  const userData = path.join(
    libraryPath(),
    settings.getSync("user.id").toString()
  );
  fs.ensureDirSync(userData);

  return userData;
};

const apiUrl = () => {
  const url: string = settings.getSync(AppSettingsKeyEnum.API_URL) as string;
  return process.env.WEB_API_URL || url || WEB_API_URL;
};

export default {
  registerIpcHandlers: () => {
    ipcMain.handle("app-settings-get-library", (_event) => {
      libraryPath();
      return settings.getSync(AppSettingsKeyEnum.LIBRARY);
    });

    ipcMain.handle("app-settings-set-library", (_event, library) => {
      if (path.parse(library).base === LIBRARY_PATH_SUFFIX) {
        settings.setSync(AppSettingsKeyEnum.LIBRARY, library);
      } else {
        const dir = path.join(library, LIBRARY_PATH_SUFFIX);
        fs.ensureDirSync(dir);
        settings.setSync(AppSettingsKeyEnum.LIBRARY, dir);
      }
    });

    ipcMain.handle("app-settings-get-user", (_event) => {
      return settings.getSync(AppSettingsKeyEnum.USER);
    });

    ipcMain.handle("app-settings-set-user", (_event, user) => {
      settings.setSync(AppSettingsKeyEnum.USER, user);
    });

    ipcMain.handle("app-settings-get-user-data-path", (_event) => {
      return userDataPath();
    });

    ipcMain.handle("app-settings-get-api-url", (_event) => {
      return settings.getSync(AppSettingsKeyEnum.API_URL);
    });

    ipcMain.handle("app-settings-set-api-url", (_event, url) => {
      settings.setSync(AppSettingsKeyEnum.API_URL, url);
    });
  },
  cachePath,
  libraryPath,
  userDataPath,
  dbPath,
  apiUrl,
  ...settings,
};
