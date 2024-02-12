#!/usr/bin/env zx

import axios from "axios";
import { createHash } from "crypto";
import { HttpsProxyAgent } from "https-proxy-agent";

console.log(chalk.blue("=> Download ffmpeg wasm files"));

const files = [
  {
    name: "ffmpeg-core.wasm",
    md5: "ff1676d6a417d1162dba70dbe8dfd354",
  },
  {
    name: "ffmpeg-core.worker.js",
    md5: "09dc7f1cd71bb52bd9afc22afdf1f6da",
  },
  {
    name: "ffmpeg-core.js",
    md5: "30296628fd78e4ef1c939f36c1d31527",
  },
];
const pendingFiles = [];
const dir = path.join(process.cwd(), "assets/libs");
fs.ensureDirSync(dir);

await Promise.all(
  files.map(async (file) => {
    try {
      if (fs.statSync(path.join(dir, file.name)).isFile()) {
        console.log(chalk.green(`=> File ${file.name} already exists`));

        const hash = await hashFile(path.join(dir, file.name), { algo: "md5" });
        if (hash === file.md5) {
          console.log(chalk.green(`=> File ${file.name} MD5 match`));
        } else {
          console.log(
            chalk.yellow(
              `=> File ${file.name} MD5 not match, start to redownload`
            )
          );
          fs.removeSync(path.join(dir, file.name));
          pendingFiles.push(file);
        }
      } else {
        pendingFiles.push(file);
      }
    } catch (err) {
      if (err && err.code !== "ENOENT") {
        console.log(chalk.red(`=> Error: ${err}`));
        process.exit(1);
      }
      pendingFiles.push(file);
    }
  })
);

if (pendingFiles.length === 0) {
  console.log(chalk.green("=> All files already exist"));
  process.exit(0);
} else {
  console.log(chalk.blue(`=> Start to download ${pendingFiles.length} files`));
}

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

if (proxyUrl) {
  const { hostname, port, protocol } = new URL(proxyUrl);
  const httpsAgent = new HttpsProxyAgent(proxyUrl);
  axios.defaults.proxy = {
    host: hostname,
    port: port,
    protocol: protocol,
  };
  axios.defaults.httpsAgent = httpsAgent;
  console.log(chalk.blue(`=> Use proxy: ${proxyUrl}`));
}

const download = async (url, dest, md5) => {
  return spinner(async () => {
    console.log(chalk.blue(`=> Start to download file ${url}`));
    await axios
      .get(url, {
        responseType: "arraybuffer",
      })
      .then(async (response) => {
        const data = Buffer.from(response.data, "binary");

        fs.writeFileSync(dest, data);
        const hash = await hashFile(dest, { algo: "md5" });
        console.log(chalk.blue(`=> File ${dest}(MD5: ${hash})`));
        if (hash === md5) {
          console.log(chalk.green(`=> ${dest} downloaded successfully`));
        } else {
          console.log(
            chalk.red(
              `=> Error: ${dest} MD5 not match, ${hash} should be ${md5}`
            )
          );
          process.exit(1);
        }
      })
      .catch((err) => {
        console.log(chalk.red(`=> Error: ${err}`));
        process.exit(1);
      });
  });
};

function hashFile(file, options) {
  const algo = options.algo || "md5";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const stream = fs.createReadStream(file);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const cleanup = () => {
  files.forEach((file) => {
    try {
      fs.removeSync(path.join(dir, file.name));
    } catch (err) {
      console.log(chalk.red(`=> Error: ${err}`));
    }
  });
};

const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
try {
  await Promise.all(
    pendingFiles.map((file) =>
      download(`${baseURL}/${file.name}`, path.join(dir, file.name), file.md5)
    )
  );
} catch (err) {
  console.log(chalk.red(`=> Error: ${err}`));
  cleanup();
  process.exit(1);
}

console.log(chalk.green("=> All files downloaded successfully"));
process.exit(0);
