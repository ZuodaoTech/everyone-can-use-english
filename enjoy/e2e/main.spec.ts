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

test("validate echogarden recognition by whisper", async () => {
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.echogarden.check({
      engine: "whisper",
      whisper: {
        model: "tiny.en",
        language: "en",
        encoderProvider: "cpu",
        decoderProvider: "cpu",
      },
    });
  });
  console.info(res.log);
  expect(res.success).toBeTruthy();
});

test("validate echogarden recognition by whisper.cpp", async () => {
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.echogarden.check({
      engine: "whisper.cpp",
      whisperCpp: {
        model: "tiny.en",
        language: "en",
      },
    });
  });
  console.info(res.log);
  expect(res.success).toBeTruthy();
});

test("validate echogarden alignment", async () => {
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.echogarden.checkAlign();
  });
  console.info(res.log);
  expect(res.success).toBeTruthy();
});

test("valid ffmpeg command", async () => {
  const res = await page.evaluate(() => {
    return window.__ENJOY_APP__.ffmpeg.check();
  });
  expect(res).toBeTruthy();
});

test("should setup default library path", async () => {
  const settings = fs.readJsonSync(path.join(resultDir, "settings.json"));
  expect(settings.library).not.toBeNull();
});

test("validate config system", async () => {
  // Test getting the full config
  const config = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.get();
  });

  // Verify config structure
  expect(config).toHaveProperty("paths");
  expect(config.paths).toHaveProperty("library");
  expect(config.paths).toHaveProperty("cache");

  // Test getting a specific app setting
  const library = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getLibrary();
  });
  expect(library).toBe(config.paths.library);

  // Test getting and setting user settings
  const initialLanguage = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserSetting("language");
  });

  // Change a user setting
  const newLanguage = initialLanguage === "en-US" ? "zh-CN" : "en-US";
  await page.evaluate((lang) => {
    return window.__ENJOY_APP__.config.setUserSetting("language", lang);
  }, newLanguage);

  // Verify the setting was changed
  const updatedLanguage = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserSetting("language");
  });
  expect(updatedLanguage).toBe(newLanguage);

  // Test nested settings
  const recorderSettings = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserSetting("recorder");
  });
  expect(recorderSettings).toHaveProperty("sampleRate");

  // Update nested setting
  const newSampleRate = 48000;
  await page.evaluate((rate) => {
    return window.__ENJOY_APP__.config.setUserSetting(
      "recorder.sampleRate",
      rate
    );
  }, newSampleRate);

  // Verify nested setting was updated
  const updatedRecorderSettings = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserSetting("recorder");
  });
  expect(updatedRecorderSettings.sampleRate).toBe(newSampleRate);
});

test("validate config lifecycle for user login/logout", async () => {
  // Test user login
  const testUserId = "12345678";
  const testUserName = "Test User";

  // Set user in app settings (simulating login)
  await page.evaluate((data) => {
    const { userId, userName } = JSON.parse(data);
    return window.__ENJOY_APP__.config.setUser({
      id: userId,
      name: userName,
    });
  }, JSON.stringify({ userId: testUserId, userName: testUserName }));

  // Verify user was set
  const user = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUser();
  });
  expect(user).toHaveProperty("id", testUserId);
  expect(user).toHaveProperty("name", testUserName);

  // Get user data path
  const userDataPath = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserDataPath();
  });
  expect(userDataPath).not.toBeNull();
  expect(userDataPath).toContain(testUserId);

  // Verify the directory exists
  const userDirExists = fs.existsSync(userDataPath);
  expect(userDirExists).toBeTruthy();

  // Test user logout by setting user to null
  await page.evaluate(() => {
    return window.__ENJOY_APP__.config.setUser(null);
  });

  // Verify user was unset
  const userAfterLogout = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUser();
  });
  expect(userAfterLogout).toBeNull();

  // Verify user data path is null after logout
  const userDataPathAfterLogout = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getUserDataPath();
  });
  expect(userDataPathAfterLogout).toBeNull();
});

test("validate API URL configuration", async () => {
  // Get current API URL
  const initialApiUrl = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getApiUrl();
  });
  expect(initialApiUrl).not.toBeNull();

  // Set a new API URL
  const newApiUrl = "https://test-api.example.com";
  await page.evaluate((url) => {
    return window.__ENJOY_APP__.config.setApiUrl(url);
  }, newApiUrl);

  // Verify the API URL was updated
  const updatedApiUrl = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getApiUrl();
  });
  expect(updatedApiUrl).toBe(newApiUrl);

  // Reset to original API URL
  await page.evaluate((url) => {
    return window.__ENJOY_APP__.config.setApiUrl(url);
  }, initialApiUrl);

  // Verify it was reset correctly
  const resetApiUrl = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getApiUrl();
  });
  expect(resetApiUrl).toBe(initialApiUrl);
});

test("validate sessions functionality", async () => {
  // Get current sessions
  const sessions = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getSessions();
  });

  // Verify sessions is an array
  expect(Array.isArray(sessions)).toBeTruthy();

  // Create a test session directory
  const testSessionId = "87654321"; // 8-digit ID format
  const libraryPath = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getLibrary();
  });
  const testSessionPath = path.join(libraryPath, testSessionId);

  // Create the directory
  fs.ensureDirSync(testSessionPath);

  // Get sessions again and verify our test session is included
  const updatedSessions = await page.evaluate(() => {
    return window.__ENJOY_APP__.config.getSessions();
  });

  // Find our test session in the list
  const foundSession = updatedSessions.find(
    (session: any) => session.id.toString() === testSessionId
  );
  expect(foundSession).toBeDefined();
  expect(foundSession.id.toString()).toBe(testSessionId);

  // Clean up - remove the test session directory
  fs.removeSync(testSessionPath);
});
