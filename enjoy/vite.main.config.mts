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
      "@commands": path.resolve(__dirname, "./src/commands"),
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
        "ffmpeg-static",
        "@andrkrn/ffprobe-static",
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
          src: `lib/whisper.cpp/models/*`,
          dest: "lib/whisper/models",
        },
        {
          src: `lib/youtubedr/${
            process.env.PACKAGE_OS_ARCH || os.arch()
          }/${os.platform()}/*`,
          dest: "lib/youtubedr",
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
