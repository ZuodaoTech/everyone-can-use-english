import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import os from "os";
// import { FusesPlugin } from "@electron-forge/plugin-fuses";
// import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config = {
  packagerConfig: {
    asar: false,
    icon: "./assets/icon",
    name: "Enjoy",
    executableName: "enjoy",
    protocols: [
      {
        name: "Enjoy",
        schemes: ["enjoy"],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: "Enjoy",
      setupIcon: "./assets/icon.ico",
    }),
    new MakerZIP(["darwin", "win32"]),
    new MakerDeb({
      options: {
        name: "enjoy",
        productName: "Enjoy",
        icon: "./assets/icon.png",
        mimeType: ["x-scheme-handler/enjoy"],
      },
    }),
    new MakerRpm({
      options: {
        name: "enjoy",
        productName: "Enjoy",
        icon: "./assets/icon.png",
        mimeType: ["x-scheme-handler/enjoy"],
      },
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "xiaolai",
          name: "everyone-can-use-english",
        },
        generateReleaseNotes: true,
        draft: true,
      },
    },
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    // new FusesPlugin({
    //   version: FuseVersion.V1,
    //   [FuseV1Options.RunAsNode]: false,
    //   [FuseV1Options.EnableCookieEncryption]: true,
    //   [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    //   [FuseV1Options.EnableNodeCliInspectArguments]: true,
    //   [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    //   [FuseV1Options.OnlyLoadAppFromAsar]: false,
    // }),
  ],
};

const macOsCodesignConfig = {
  osxSign: {},
  osxNotarize: {
    tool: "notarytool",
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  },
};

if (
  os.platform() === "darwin" &&
  process.env.APPLE_ID &&
  process.env.APPLE_APP_PASSWORD &&
  process.env.APPLE_TEAM_ID
) {
  config.packagerConfig = {
    ...config.packagerConfig,
    ...macOsCodesignConfig,
  };
}

export default config;
