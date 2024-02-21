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
    await page.getByTestId("layout-home").waitFor();

    await page.screenshot({ path: "test-results/homepage.png" });

    expect(await page.getByTestId("layout-onboarding").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-db-error").isVisible()).toBeFalsy();
    expect(await page.getByTestId("layout-home").isVisible()).toBeTruthy();
    expect(await page.getByTestId("sidebar").isVisible()).toBeTruthy();
  });

  test.describe("with conversation", async () => {
    test.beforeEach(async () => {
      const file = fs.readFileSync(
        path.join(process.cwd(), "samples", "speech.mp3")
      );

      page = await electronApp.firstWindow();
      page.on("console", (msg) => {
        console.info(msg.text());
      });

      await page.route("**/api/ai/audio/speech", (route) => {
        route.fulfill({
          body: file,
        });
      });
      await page.route("**/api/ai/chat/completions", (route) => {
        route.fulfill({
          json: {
            id: "1",
            choices: [
              {
                index: 1,
                message: {
                  role: "assistant",
                  content: "I'm fine, thank you.",
                },
                finish_reason: "stop",
              },
            ],
          },
        });
      });
      await page.getByTestId("sidebar-conversations").click();
      await page.getByTestId("conversation-new-button").click();
      expect(
        await page.getByTestId("conversation-presets").isVisible()
      ).toBeTruthy();
    });

    test("gpt conversation", async () => {
      // create a gpt conversation
      await page.getByTestId("conversation-preset-english-coach").click();
      await page.getByTestId("conversation-form").waitFor();
      await page.click("[data-testid=conversation-form-submit]");

      // wait for the conversation to be created
      await page.getByTestId("conversation-page").waitFor();

      // submit a message to the conversation
      await page.getByTestId("conversation-page-input").fill("How are you?");
      await page.getByTestId("conversation-page-submit").click();
      await page.locator(".ai-message").waitFor();
      const message = page.locator(".ai-message").first();
      expect(await message.isVisible()).toBeTruthy();

      // create a speech
      await page
        .getByTestId("message-create-speech")
        .click({ timeout: 1000 * 60 });

      // wait for the speech player
      const player = page
        .locator(".ai-message")
        .getByTestId("wavesurfer-container");
      await player.waitFor();

      expect(await player.isVisible()).toBeTruthy();
    });

    test("tts conversation", async () => {
      // create a tts conversation
      await page.click("[data-testid=conversation-preset-tts]");
      await page.getByTestId("conversation-form").waitFor();
      await page.click("[data-testid=conversation-form-submit]");

      // wait for the conversation to be created
      await page.getByTestId("conversation-page").waitFor();

      // submit a message to the conversation
      await page.getByTestId("conversation-page-input").fill("How are you?");
      await page.getByTestId("conversation-page-submit").click();
      await page.locator(".ai-message").waitFor();
      const player = page
        .locator(".ai-message")
        .getByTestId("wavesurfer-container");
      await player.waitFor();

      expect(await player.isVisible()).toBeTruthy();
    });
  });
});
