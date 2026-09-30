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

test("configure medium ONNX CPU sessions safely on macOS", async () => {
  const result = await electronApp.evaluate(async () => {
    const { Whisper } = await import(
      "echogarden/dist/recognition/WhisperSTT.js"
    );
    const { InferenceSession } = await import("onnxruntime-node");
    const originalCreate = InferenceSession.create;
    const cases: { model: string; providers: string[]; options: any[] }[] = [];
    let options: any[] = [];

    // Exercise the packaged dependency without downloading large model files.
    InferenceSession.create = (async (_file: string, sessionOptions: any) => {
      options.push(sessionOptions);
      return {} as any;
    }) as typeof InferenceSession.create;

    try {
      const models = ["medium", "medium.en", "tiny.en", "small.en"] as const;
      const providerSets: ("cpu" | "cuda")[][] = [["cpu"], ["cuda", "cpu"]];
      for (const model of models) {
        for (const providers of providerSets) {
          options = [];
          const whisper = new Whisper(model, "/unused", providers, providers);
          await whisper.initializeEncoderSessionIfNeeded();
          await whisper.initializeDecoderSessionIfNeeded();
          // Already initialized sessions should not be created again.
          await whisper.initializeEncoderSessionIfNeeded();
          await whisper.initializeDecoderSessionIfNeeded();
          cases.push({ model, providers, options });
        }
      }
    } finally {
      InferenceSession.create = originalCreate;
    }

    return { platform: process.platform, cases };
  });

  for (const { model, providers, options } of result.cases) {
    expect(options).toHaveLength(2);
    const needsWorkaround =
      result.platform === "darwin" &&
      ["medium", "medium.en"].includes(model) &&
      providers.length === 1;
    for (const sessionOptions of options) {
      expect(sessionOptions.executionProviders).toEqual(providers);
      if (needsWorkaround) {
        expect(sessionOptions).toMatchObject({
          enableCpuMemArena: false,
          enableMemPattern: false,
          executionMode: "sequential",
          intraOpNumThreads: 0,
          interOpNumThreads: 1,
        });
      } else {
        expect(sessionOptions.enableCpuMemArena).toBeUndefined();
        expect(sessionOptions.enableMemPattern).toBeUndefined();
        expect(sessionOptions.executionMode).toBeUndefined();
        expect(sessionOptions.intraOpNumThreads).toBeUndefined();
        expect(sessionOptions.interOpNumThreads).toBeUndefined();
      }
    }
  }
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
