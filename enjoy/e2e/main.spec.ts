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

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild);
  // set the CI environment variable to true
  process.env.CI = "e2e";

  const resultDir = path.join(process.cwd(), "test-results");

  fs.ensureDirSync(resultDir);
  process.env.SETTINGS_PATH = resultDir;
  process.env.LIBRARY_PATH = resultDir;

  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  });
  electronApp.on("window", async (page) => {
    const filename = page.url()?.split("/").pop();
    console.log(`Window opened: ${filename}`);

    // capture errors
    page.on("pageerror", (error) => {
      console.error(error);
    });
    // capture console messages
    page.on("console", (msg) => {
      console.log(msg.text());
    });
  });
});

test.afterAll(async () => {
  await electronApp.close();
});

let page: Page;

test("renders the first page", async () => {
  page = await electronApp.firstWindow();
  const title = await page.title();
  expect(title).toBe("Enjoy");
});

test("validate whisper command", async () => {
  page = await electronApp.firstWindow();
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.whisper.check();
  });
  expect(res.success).toBeTruthy();
});

test("valid ffmpeg command", async () => {
  page = await electronApp.firstWindow();
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.ffmpeg.check();
  });
  expect(res).toBeTruthy();
});
