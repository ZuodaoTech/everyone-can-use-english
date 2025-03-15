import { createHash } from "crypto";
import { createReadStream } from "fs";
import { config } from "@main/config";
import path from "path";

export function hashFile(
  path: string,
  options: { algo: string }
): Promise<string> {
  const algo = options.algo || "md5";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const stream = createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

export function hashBlob(
  blob: Blob,
  options: { algo: string }
): Promise<string> {
  const algo = options.algo || "md5";
  return new Promise((resolve, reject) => {
    const hash = createHash(algo);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        const buffer = Buffer.from(reader.result);
        hash.update(buffer);
        resolve(hash.digest("hex"));
      } else {
        reject(new Error("Unexpected result from FileReader"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/*
 * Convert enjoy url to file path
 *
 * @param {string} enjoyUrl - enjoy url
 * @returns {string} file path
 */
export function enjoyUrlToPath(enjoyUrl: string): string {
  let filePath = enjoyUrl;

  if (
    enjoyUrl.match(
      /enjoy:\/\/library\/(audios|videos|recordings|speeches|segments)/g
    )
  ) {
    filePath = path.posix.join(
      config.userDataPath(),
      enjoyUrl.replace("enjoy://library/", "")
    );
  } else if (enjoyUrl.startsWith("enjoy://library/")) {
    filePath = path.posix.join(
      config.libraryPath(),
      filePath.replace("enjoy://library/", "")
    );
  }

  return filePath;
}

/*
 * Convert file path to enjoy url
 *
 * @param {string} filePath - file path
 * @returns {string} enjoy url
 */
export function pathToEnjoyUrl(filePath: string): string {
  let enjoyUrl = filePath;

  if (filePath.startsWith(config.userDataPath())) {
    enjoyUrl = `enjoy://library/${filePath
      .replace(config.userDataPath(), "")
      .replace(/^\//, "")}`;
  } else if (filePath.startsWith(config.libraryPath())) {
    enjoyUrl = `enjoy://library/${filePath
      .replace(config.libraryPath(), "")
      .replace(/^\//, "")}`;
  }

  return enjoyUrl;
}
