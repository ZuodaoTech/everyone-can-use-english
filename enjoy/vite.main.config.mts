import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import os from "os";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ["module", "jsnext:main", "jsnext"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@main": path.resolve(__dirname, "./src/main"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        "sequelize",
        "umzug",
        "sqlite3",
        "fluent-ffmpeg",
        "bufferutil",
        "utf-8-validate",
        // "node-llama-cpp",
      ],
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: `lib/whisper.cpp/${
            process.env.PACKAGE_OS_ARCH || os.arch()
          }/${os.platform()}/*`,
          dest: "lib/whisper",
        },
        {
          src: `lib/youtubedr/${
            process.env.PACKAGE_OS_ARCH || os.arch()
          }/${os.platform()}/*`,
          dest: "lib/youtubedr",
        },
        {
          src: `lib/ffmpeg//${
            process.env.PACKAGE_OS_ARCH || os.arch()
          }/${os.platform()}/*`,
          dest: "lib/ffmpeg",
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
});
