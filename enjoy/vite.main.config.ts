import { viteStaticCopy } from "vite-plugin-static-copy";
import os from "os";
import path from "path";
import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, mergeConfig } from "vite";
import {
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
  external,
} from "./vite.base.config";

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as ConfigEnv<"build">;
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      lib: {
        entry: forgeConfigSelf.entry!,
        fileName: () => "[name].js",
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          ...external,
          "echogarden/dist/api/API.js",
          "echogarden/dist/audio/AudioUtilities.js",
          "echogarden/dist/utilities/Timeline.js",
          "echogarden/dist/utilities/PackageManager.js",
        ],
        output: {
          strict: false,
        },
        plugins: [],
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        defaultIsModuleExports: true,
        esmExternals: true,
      },
    },
    plugins: [
      pluginHotRestart("restart"),
      viteStaticCopy({
        targets: [
          {
            src: `lib/youtubedr/${
              process.env.PACKAGE_OS_ARCH || os.arch()
            }/${os.platform()}/*`,
            dest: "lib/youtubedr",
          },
          {
            src: "lib/dictionaries/*",
            dest: "lib/dictionaries",
          },
          {
            src: "src/main/db/migrations/*",
            dest: "migrations",
          },
          {
            src: "samples/*",
            dest: "samples",
          },
        ],
      }),
    ],
    define,
    resolve: {
      // Load the Node.js entry.
      mainFields: ["module", "jsnext:main", "jsnext"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@main": path.resolve(__dirname, "./src/main"),
        "@commands": path.resolve(__dirname, "./src/commands"),
      },
    },
  };

  return mergeConfig(getBuildConfig(forgeEnv), config);
});
