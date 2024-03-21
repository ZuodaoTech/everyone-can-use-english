import Pitchfinder from "pitchfinder";
import { END_OF_SENTENCE_REGEX, MAGIC_TOKEN_REGEX } from "./constants";
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

  return frequencies;
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
