import Pitchfinder from "pitchfinder";

export const extractFrequencies = (props: {
  peaks: Float32Array;
  sampleRate: number;
}): number[] => {
  const { peaks, sampleRate } = props;

  const detectPitch = Pitchfinder.AMDF({ sampleRate });
  const duration = peaks.length / sampleRate;
  const bpm = peaks.length / duration / 60;

  const frequencies = Pitchfinder.frequencies(detectPitch, peaks, {
    tempo: bpm,
    quantization: bpm,
  });

  return frequencies;
};

export const PitchContour = (props: {
  peaks?: Float32Array;
  sampleRate?: number;
  frequencies?: number[];
  height: number;
  id?: string;
}) => {
  const { peaks, sampleRate, height, id } = props;
  let { frequencies } = props;

  if (!frequencies) {
    frequencies = extractFrequencies({ peaks, sampleRate });
  }

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

  const pitchUpColor = "#385587";
  // const pitchDownColor = "#C26351";
  const pitchDownColor = "#385587";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = frequencies.length;
  canvas.height = height;
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  // Each frequency is a point whose Y position is the frequency and X position is the time
  let prevY = 0;
  frequencies.forEach((frequency, index) => {
    if (!frequency) return;
    const hratio = 0.5; // the bigger the narrower the pitch contour drawn on canvas.
    const marginTop = height * 0.4; // the bigger the lower the pitch contour positioned.
    const y =
      Math.round(height - (frequency / (baseFrequency * 2)) * height) * hratio +
      marginTop;
    ctx.fillStyle = y > prevY ? pitchDownColor : pitchUpColor;
    ctx.fillRect(index, y, 1, 2);
    prevY = y;
  });

  canvas.id = id;

  return canvas;
};
