#!/usr/bin/env zx

import axios from "axios";
import progress from "progress";
import { createHash } from "crypto";

const model = "ggml-tiny.en.bin";
const sha = "c78c86eb1a8faa21b369bcd33207cc90d64ae9df";

const dir = path.join(process.cwd(), "lib/whisper.cpp/models");

console.info(chalk.blue(`=> Download whisper model ${model}`));

fs.ensureDirSync(dir);
try {
  if (fs.statSync(path.join(dir, model)).isFile()) {
    console.info(chalk.green(`✅ Model ${model} already exists`));
    const hash = await hashFile(path.join(dir, model), { algo: "sha1" });
    if (hash === sha) {
      console.info(chalk.green(`✅ Model ${model} valid`));
      process.exit(0);
    } else {
      console.error(
        chalk.red(`❌ Model ${model} not valid, start to redownload`)
      );
      fs.removeSync(path.join(dir, model));
    }
  }
} catch (err) {
  if (err && err.code !== "ENOENT") {
    console.error(chalk.red(`❌ Error: ${err}`));
    process.exit(1);
  } else {
    console.info(chalk.blue(`=> Start to download model ${model}`));
  }
}

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

if (proxyUrl) {
  const { hostname, port, protocol } = new URL(proxyUrl);
  axios.defaults.proxy = {
    host: hostname,
    port: port,
    protocol: protocol,
  };
}

// const modelUrlPrefix =
//   "https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main";
const modelUrlPrefix = "https://enjoy-storage.baizhiheizi.com";

function hashFile(path, options) {
  const algo = options.algo || "sha1";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const stream = fs.createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const download = async (url, dest) => {
  console.info(chalk.blue(`=> Start to download from ${url} to ${dest}`));
  return axios
    .get(url, { responseType: "stream" })
    .then((response) => {
      const totalLength = response.headers["content-length"];

      const progressBar = new progress(`-> downloading [:bar] :percent :etas`, {
        width: 40,
        complete: "=",
        incomplete: " ",
        renderThrottle: 1,
        total: parseInt(totalLength),
      });

      response.data.on("data", (chunk) => {
        progressBar.tick(chunk.length);
      });

      response.data.pipe(fs.createWriteStream(dest)).on("close", async () => {
        console.info(chalk.green(`✅ Model ${model} downloaded successfully`));
        const hash = await hashFile(path.join(dir, model), { algo: "sha1" });
        if (hash === sha) {
          console.info(chalk.green(`✅ Model ${model} valid`));
          process.exit(0);
        } else {
          console.error(
            chalk.red(
              `❌ Model ${model} not valid, please try again using command \`yarn workspace enjoy download-whisper-model\``
            )
          );
          process.exit(1);
        }
      });
    })
    .catch((err) => {
      console.error(
        chalk.red(
          `❌ Failed to download ${url}: ${err}.\nPlease try again using command \`yarn workspace enjoy download-whisper-model\``
        )
      );
      process.exit(1);
    });
};

await download(`${modelUrlPrefix}/${model}`, path.join(dir, model));
