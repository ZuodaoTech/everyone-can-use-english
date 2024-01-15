import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { dirname } from "node:path";
import { Walker, DepType, type Module } from "flora-colossus";

// any packages that you must mark as "external" in vite
const NATIVE_MODULES_TO_PACKAGE = [
  "sequelize",
  "umzug",
  "sqlite3",
  "fluent-ffmpeg",
  "electron-squirrel-startup",
];
const INCLUDE_NESTED_DEPS = true as const;
let nativeModuleDependenciesToPackage: Set<string>;

const config: ForgeConfig = {
  packagerConfig: {
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
    new MakerZIP({}, ["darwin", "win32"]),
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
          config: "vite.main.config.mts",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.mts",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.mts",
        },
      ],
    }),
  ],
  hooks: {
    // TODO: remove this once this issue is resolved: https://github.com/electron/forge/pull/3336
    prePackage: async (forgeConfig) => {
      if (process.platform === "linux") return;

      if (forgeConfig.packagerConfig.ignore !== undefined) {
        throw new Error(
          "forgeConfig.packagerConfig.ignore is already defined. Please remove it from your forge config and instead use the prePackage hook to dynamically set it."
        );
      }

      const getExternalNestedDependencies = async (
        nodeModuleNames: string[],
        includeNestedDeps = true
      ) => {
        const foundModules = new Set(nodeModuleNames);
        if (includeNestedDeps) {
          for (const external of nodeModuleNames) {
            type MyPublicClass<T> = {
              [P in keyof T]: T[P];
            };
            type MyPublicWalker = MyPublicClass<Walker> & {
              modules: Module[];
              walkDependenciesForModule: (
                moduleRoot: string,
                depType: DepType
              ) => Promise<void>;
            };
            const moduleRoot = dirname(
              require.resolve(`${external}/package.json`, {
                paths: [__dirname],
              })
            );
            const walker = new Walker(moduleRoot) as unknown as MyPublicWalker;
            walker.modules = [];
            await walker.walkDependenciesForModule(moduleRoot, DepType.PROD);
            walker.modules
              .filter(
                (dep) => (dep.nativeModuleType as number) === DepType.PROD
              )
              .map((dep) => dep.name)
              .forEach((name) => foundModules.add(name));
          }
        }
        return foundModules;
      };

      nativeModuleDependenciesToPackage = await getExternalNestedDependencies(
        NATIVE_MODULES_TO_PACKAGE,
        INCLUDE_NESTED_DEPS
      );

      forgeConfig.packagerConfig.ignore = (path) => {
        // .vite bundled build files
        if (path.startsWith("/.vite")) {
          return false;
        }
        // main package.json file
        if (path === "/package.json") {
          return false;
        }
        if (!path) {
          return false;
        }
        // need to first NOT ignore the root node_modules folder
        if (path === "/node_modules") {
          return false;
        }
        // if path is in nativeModuleDependenciesToPackage, return false (to package it)
        const foundModules: Set<string> = nativeModuleDependenciesToPackage;
        for (const module of foundModules) {
          if (
            path.startsWith(`/node_modules/${module}`) ||
            path.startsWith(`/node_modules/${module.split("/")[0]}`)
          ) {
            return false;
          }
        }

        // for everything else, ignore it
        return true;
      };
    },
  },
};

export default config;
