import Pitchfinder from "pitchfinder";
import { END_OF_SENTENCE_REGEX, MAGIC_TOKEN_REGEX } from "./constants";

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

export const groupTranscription = (
  transcription: TranscriptionResultSegmentType[]
): TranscriptionResultSegmentGroupType[] => {
  const generateGroup = (group?: TranscriptionResultSegmentType[]) => {
    if (!group || group.length === 0) return;

    const firstWord = group[0];
    const lastWord = group[group.length - 1];

    return {
      offsets: {
        from: firstWord.offsets.from,
        to: lastWord.offsets.to,
      },
      text: group.map((w) => w.text.trim()).join(" "),
      timestamps: {
        from: firstWord.timestamps.from,
        to: lastWord.timestamps.to,
      },
      segments: group,
    };
  };

  const groups: TranscriptionResultSegmentGroupType[] = [];
  let group: TranscriptionResultSegmentType[] = [];

  transcription.forEach((segment) => {
    const text = segment.text.trim();
    if (!text) return;

    group.push(segment);

    if (
      !text.match(MAGIC_TOKEN_REGEX) &&
      segment.text.trim().match(END_OF_SENTENCE_REGEX)
    ) {
      // Group a complete sentence;
      groups.push(generateGroup(group));

      // init a new group
      group = [];
    }
  });

  // Group the last group
  const lastSentence = generateGroup(group);
  if (lastSentence) groups.push(lastSentence);

  return groups;
};
