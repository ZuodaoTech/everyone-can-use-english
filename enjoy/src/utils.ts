import Pitchfinder from "pitchfinder";
import { IPA_CONSONANTS, IPA_MAPPINGS, IPA_VOWELS } from "./constants";

export const extractFrequencies = (props: {
  peaks: Float32Array;
  sampleRate: number;
}): number[] => {
  const { peaks, sampleRate } = props;

  const detectPitch = Pitchfinder.AMDF({
    sampleRate,
    sensitivity: 0.05,
  });
  const duration = peaks.length / sampleRate;
  const bpm = peaks.length / duration / 60;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: bpm,
    quantization: bpm,
  });

  const cleanedFrequencies = removeNoise(frequencies);

  return cleanedFrequencies;
};

export const removeNoise = (
  numbers: number[],
  threshold: number = 0.2
): number[] => {
  numbers.forEach((num, i) => {
    if (i === 0) return;
    if (typeof num !== "number") return;

    const prevNum = numbers[i - 1] || num;
    const nextNum = numbers[i + 1] || num;
    const avgNeighbor = (prevNum + nextNum) / 2.0;
    const deviation = Math.abs(num - avgNeighbor);

    if (deviation > threshold * avgNeighbor) {
      numbers[i] = null;
    }
  });

  return numbers;
};

export function milisecondsToTimestamp(ms: number) {
  const hours = Math.floor(ms / 3600000).toString();
  const minutes = Math.floor((ms % 3600000) / 60000).toString();
  const seconds = Math.floor(((ms % 360000) % 60000) / 1000).toString();
  const milliseconds = Math.floor(ms % 1000).toString();
  return `${hours.padStart(2, "0")}:${minutes.padStart(
    2,
    "0"
  )}:${seconds.padStart(2, "0")},${milliseconds}`;
}

export const convertWordIpaToNormal = (
  ipas: string[],
  options?: { mappings?: any }
): string[] => {
  const { mappings = IPA_MAPPINGS } = options || {};
  const consonants = Object.keys(IPA_CONSONANTS)
    .map((key) => IPA_CONSONANTS[key])
    .reduce((acc, val) => acc.concat(val), []);
  const consonantsRegex = new RegExp(`^(\ˈ|ˌ)?` + consonants.join("|"));
  const vowels = Object.keys(IPA_VOWELS)
    .map((key) => IPA_VOWELS[key])
    .reduce((acc, val) => acc.concat(val), []);
  const vowelsRegex = new RegExp(`^(\ˈ|ˌ)?` + vowels.join("|"));

  const converted: string[] = [];

  // convert each ipa to normal
  // if ipa is a vowel and marked, check if the previous ipa is a consonant,
  // if so, mark the consonant instead
  for (let i = 0; i < ipas.length; i++) {
    const ipa = ipas[i];
    converted.push(convertIpaToNormal(ipa, { mappings, marked: false }));

    const isVowel = vowelsRegex.test(ipa);
    const mark = ipa.match(/(\ˈ|ˌ)/);

    let j = i - 1;
    for (; j > 0 && j > i - 2; j--) {
      if (
        consonantsRegex.test(converted[j]) &&
        !IPA_CONSONANTS.trill.includes(converted[j]) &&
        !IPA_CONSONANTS.approximant.includes(converted[j]) &&
        !IPA_CONSONANTS.lateralApproximant.includes(converted[j])
      )
        break;
      if (
        consonantsRegex.test(converted[j]) &&
        !consonantsRegex.test(converted[j - 1])
      ) {
        break;
      }
    }

    if (isVowel && mark) {
      if (converted[j] && consonantsRegex.test(converted[j])) {
        converted[j] = mark[0] + converted[j];
      } else {
        converted[i] = mark[0] + converted[i];
      }
    }
  }

  return converted;
};

export const convertIpaToNormal = (
  ipa: string,
  options?: { mappings?: any; marked?: boolean }
): string => {
  const { mappings = IPA_MAPPINGS, marked = false } = options || {};

  const mark = ipa.match(/(\ˈ|ˌ)/);
  const cleanIpa = ipa.replace(mark ? mark[0] : "", "");

  const converted = mappings[cleanIpa] || cleanIpa;
  if (mark && marked) {
    return `${mark[0]}${converted}`;
  } else {
    return converted;
  }
};

// make size of bytes human readable
export const humanFileSize = (bytes: number, si: boolean = false) => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10;
  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );
  return bytes.toFixed(1) + " " + units[u];
};

export function getExtension(filename: string, defaultExt: string) {
  return /(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt;
}
