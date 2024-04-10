import Pitchfinder from "pitchfinder";
import { IPA_MAPPING } from "./constants";

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

  const cleanedFrequencies = removeNoise(frequencies)

  return cleanedFrequencies;
};

export const removeNoise = (numbers: number[], threshold: number = 0.2): number[] => {
  numbers.forEach((num, i) => {
    if (i === 0) return;
    if (typeof num !== 'number') return;

    const prevNum = numbers[i - 1] || num;
    const nextNum = numbers[i + 1] || num;
    const avgNeighbor = (prevNum + nextNum) / 2.0;
    const deviation = Math.abs(num - avgNeighbor);

    if (deviation > threshold * avgNeighbor) {
      numbers[i] = null;
    }
  })

  return numbers;
};

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

export const convertIpaToNormal = (ipa: string) => {
  const mark = ipa.match(/(\ˈ|ˌ)/);
  const cleanIpa = ipa.replace(mark ? mark[0] : "", "");

  const converted = IPA_MAPPING[cleanIpa] || cleanIpa;
  if (mark) {
    return `${mark[0]}${converted}`;
  } else {
    return converted;
  }
};
