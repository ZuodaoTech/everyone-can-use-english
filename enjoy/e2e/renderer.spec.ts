import { expect, test } from "@playwright/test";
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers";
import { ElectronApplication, Page, _electron as electron } from "playwright";
import path from "path";
import fs from "fs-extra";

const user = {
  id: 24000001,
  name: "李安",
  avatarUrl:
    "https://mixin-images.zeromesh.net/9tMscDkZuXyLKMRChmFi5IiFF2XuQHO8PQpED8zKOCBDGKGSVB9J2eqzyjhgJKPDVunXiT-DPiisImX_bhBDPi4=s256",
  accessToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOm51bGwsInNpZCI6IjkyN2RjNGRhLTI3YTItNDU5MC1hY2ZiLWMxYTJmZjhhMmFjMiIsInVpZCI6MjQwMDAwMDEsImlhdCI6MTcwODMyODk1N30.PCN_SZ7JH-VYLl56XU8kxYN9Cy44sO13mBQNNz6x-pa",
};

let electronApp: ElectronApplication;
let page: Page;
const resultDir = path.join(process.cwd(), "test-results");

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild();
  console.log(`Latest build: ${latestBuild}`);

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
  console.log("Electron app launched");

  page = await electronApp.firstWindow();
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

test.afterAll(async () => {
  await electronApp.close();
});

test.describe("with login", async () => {
  test.beforeAll(async () => {
    const settings = fs.readJsonSync(path.join(resultDir, "settings.json"));
    settings.user = user;
    fs.writeJsonSync(path.join(resultDir, "settings.json"), settings);

    await page.route("**/api/me", (route) => {
      route.fulfill({
        json: user,
      });
    });

    await page.route("**/api/stories", (route) => {
      route.fulfill({
        json: {
          stories: [],
          next: null,
        },
      });
    });

    // await page.evaluate(() => {
    //   return (window as any).__ENJOY_APP__.app.reload();
    // });
  });

  test("should enter homepage after login", async () => {
    await page.getByTestId("layout-home").waitFor();

    await page.screenshot({ path: "test-results/homepage.png" });

    expect(await page.getByTestId("layout-onboarding").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-db-error").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-home").isVisible()).toBeTruthy();
    expect(await page.getByTestId("sidebar").isVisible()).toBeTruthy();
  });
});
