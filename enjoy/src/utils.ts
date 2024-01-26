import { createHash } from "crypto";
import { createReadStream } from "fs";
import Pitchfinder from "pitchfinder";

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

export function generatePitch(peaks: Float32Array, sampleRate: number) {
  const detectPitch = Pitchfinder.YIN({ sampleRate });
  const duration = peaks.length / sampleRate;
  const bpm = peaks.length / duration / 60;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: bpm,
    quantization: bpm,
  });

  // Find the baseline frequency (the value that appears most often)
  const frequencyMap: any = {};
  let maxAmount = 0;
  let baseFrequency = 0;
  frequencies.forEach((frequency) => {
    if (!frequency) return;
    const tolerance = 10;
    frequency = Math.round(frequency * tolerance) / tolerance;
    if (!frequencyMap[frequency]) frequencyMap[frequency] = 0;
    frequencyMap[frequency] += 1;
    if (frequencyMap[frequency] > maxAmount) {
      maxAmount = frequencyMap[frequency];
      baseFrequency = frequency;
    }
  });

  return { frequencies, baseFrequency };
}

export function milisecondsToTimestamp(ms: number) {
  const hours = Math.floor(ms / 3600000).toString();
  const minutes = Math.floor((ms % 3600000) / 60000).toString();
  const seconds = Math.floor(((ms % 360000) % 60000) / 1000).toString();
  const milliseconds = Math.floor(((ms % 360000) % 60000) % 1000).toString();
  return `${hours.padStart(2, "0")}:${minutes.padStart(
    2,
    "0"
  )}:${seconds.padStart(2, "0")},${milliseconds}`;
}
