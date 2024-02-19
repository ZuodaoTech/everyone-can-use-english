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

const user = {
  id: 24000001,
  name: "李安",
  avatarUrl:
    "https://mixin-images.zeromesh.net/9tMscDkZuXyLKMRChmFi5IiFF2XuQHO8PQpED8zKOCBDGKGSVB9J2eqzyjhgJKPDVunXiT-DPiisImX_bhBDPi4=s256",
  accessToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOm51bGwsInNpZCI6IjkyN2RjNGRhLTI3YTItNDU5MC1hY2ZiLWMxYTJmZjhhMmFjMiIsInVpZCI6MjQwMDAwMDEsImlhdCI6MTcwODMyODk1N30.PCN_SZ7JH-VYLl56XU8kxYN9Cy44sO13mBQNNz6x-pa",
};

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

test.describe("main dependencies", () => {
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
});

test.describe("with login", async () => {
  let page: Page;

  test.beforeAll(async () => {
    const settings = fs.readJsonSync(path.join(resultDir, "settings.json"));
    settings.user = user;
    fs.writeJsonSync(path.join(resultDir, "settings.json"), settings);

    page = await electronApp.firstWindow();
    page.route("**/api/me", (route) => {
      route.fulfill({
        json: user,
      });
    });

    await page.evaluate(() => {
      return window.__ENJOY_APP__.app.reload();
    });
  });

  test("should enter homepage after login", async () => {
    await page.waitForSelector("[data-testid=layout-home]");

    await page.screenshot({ path: "test-results/homepage.png" });

    expect(await page.getByTestId("layout-onboarding").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-db-error").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-home").isVisible()).toBeTruthy();
    expect(await page.getByTestId("sidebar").isVisible()).toBeTruthy();
  });
});
