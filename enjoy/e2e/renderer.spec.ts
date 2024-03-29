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

    page.route("**/api/me", (route) => {
      route.fulfill({
        json: user,
      });
    });

    page.route("**/api/stories", (route) => {
      route.fulfill({
        json: {
          stories: [],
          next: null,
        },
      });
    });

    await page.evaluate(() => {
      return (window as any).__ENJOY_APP__.app.reload();
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
    test.beforeAll(async () => {
      const file = fs.readFileSync(
        path.join(process.cwd(), "samples", "speech.mp3")
      );

      page = await electronApp.firstWindow();

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
    });

    /*
     * steps:
     * 1. create a tts conversation
     * 2. submit a message to the conversation
     * 3. the speech should auto create
     */
    test("tts conversation", async () => {
      // navigate to the conversations page
      await page.getByTestId("sidebar-conversations").click();

      // trigger new conversation modal
      await page.getByTestId("conversation-new-button").click();

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

    /*
     * steps:
     * 1. create a gpt conversation
     * 2. submit a message to the conversation, AI should reply
     * 3. create a speech from the AI message
     * 4. add the speech to the library
     * 5. audio waveform player should be visible and transcription should be generated
     */
    test("gpt conversation", async () => {
      // navigate to the conversations page
      await page.getByTestId("sidebar-conversations").click();

      // trigger new conversation modal
      await page.getByTestId("conversation-new-button").click();

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
      await page.getByTestId("message-create-speech").click();

      // wait for the speech player
      const player = page
        .locator(".ai-message")
        .getByTestId("wavesurfer-container");
      await player.waitFor({ timeout: 60000 });
      expect(await player.isVisible()).toBeTruthy();

      // add to library
      await page.getByTestId("message-start-shadow").click();
      await page.getByTestId("audio-player").waitFor();
      await page
        .getByTestId("media-player-container")
        .waitFor({ timeout: 60000 });
      await page
        .getByTestId("media-transcription-result")
        .waitFor({ timeout: 60000 });
      expect(
        await page.getByTestId("media-transcription-result").isVisible()
      ).toBeTruthy();
    });
  });
});
