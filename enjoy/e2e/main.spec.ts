import { expect, test } from "@playwright/test";
import {
  clickMenuItemById,
  findLatestBuild,
  ipcMainCallFirstListener,
  ipcRendererCallFirstListener,
  parseElectronApp,
  ipcMainInvokeHandler,
  ipcRendererInvoke,
} from "electron-playwright-helpers";
import { ElectronApplication, Page, _electron as electron } from "playwright";
import path from "path";
import fs from "fs-extra";

declare global {
  interface Window {
    __ENJOY_APP__: any;
  }
}

let electronApp: ElectronApplication;
const resultDir = path.join(process.cwd(), "test-results");

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild);
  // set the CI environment variable to true
  process.env.CI = "e2e";

  fs.ensureDirSync(resultDir);
  process.env.SETTINGS_PATH = resultDir;
  process.env.LIBRARY_PATH = resultDir;

  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  });
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.info(`Window opened: ${filename}`);

    // capture errors
    page.on("pageerror", (error) => {
      console.error(error);
    });
    // capture console messages
    page.on("console", (msg) => {
      console.info(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

test("renders the first page", async () => {
  const page = await electronApp.firstWindow();
  const title = await page.title();
  expect(title).toBe("Enjoy");
});

test("validate whisper command", async () => {
  const page = await electronApp.firstWindow();
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.whisper.check();
  });
  console.info(res.log);
  expect(res.success).toBeTruthy();

  const settings = fs.readJsonSync(path.join(resultDir, "settings.json"));
  expect(settings.whisper.service).toBe("local");
});

test("valid ffmpeg command", async () => {
  const page = await electronApp.firstWindow();
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.ffmpeg.check();
  });
  expect(res).toBeTruthy();
});

test("should setup default library path", async () => {
  const settings = fs.readJsonSync(path.join(resultDir, "settings.json"));
  expect(settings.library).not.toBeNull();
});
