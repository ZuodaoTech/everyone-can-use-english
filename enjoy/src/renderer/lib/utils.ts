import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "@renderer/lib/dayjs";
import { type DurationUnitType } from "dayjs/plugin/duration";
import i18next, { t } from "i18next";
import Chart from "chart.js/auto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function secondsToTimestamp(seconds: number) {
  const h = Math.floor(seconds / 3600).toString();
  const m = Math.floor((seconds % 3600) / 60).toString();
  const s = Math.floor((seconds % 3600) % 60).toString();

  if (h === "0") {
    return `${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
  } else {
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
  }
}

export function humanizeDuration(
  duration: number,
  unit: DurationUnitType = "second"
) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  return dayjs.duration(duration, unit).humanize();
}

export function formatDuration(
  duration: number,
  unit: DurationUnitType = "second",
  format = "HH:mm:ss"
) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const display = dayjs.duration(duration, unit).format(format);
  return display.replace(/^00:/, "");
}

export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Byte";
  }
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}

export function formatDateTime(date: Date | string) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const now = dayjs();
  const then = dayjs(date);

  if (now.diff(then, "hour") === 0) {
    return then.fromNow();
  } else if (now.isSame(then, "day")) {
    return then.format("HH:mm");
  } else if (now.diff(then, "year") === 0) {
    return then.format("MM/DD HH:mm");
  } else {
    return then.format("YYYY/MM/DD HH:mm");
  }
}

export function formatDate(date: string | Date) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const now = dayjs();
  const then = dayjs(date);

  if (now.diff(then, "day") === 0) {
    return t("today");
  } else if (now.diff(then, "day") === 1) {
    return t("yesterday");
  } else {
    return then.fromNow();
  }
}

export function renderPitchContour(options: {
  wrapper: HTMLElement;
  canvasId: string;
  labels: string[];
  datasets: Chart["data"]["datasets"];
}) {
  const { wrapper, datasets, labels, canvasId } = options;

  const width = wrapper.getBoundingClientRect().width;
  const height = wrapper.getBoundingClientRect().height;
  const canvas = document.createElement("canvas");
  canvas.id = canvasId;
  canvas.style.position = "absolute";
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.top = "0";
  canvas.style.left = "0";

  wrapper.appendChild(canvas);

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            autoSkip: false,
          },
          display: false,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          display: false,
        },
      },
    },
  });
}

export function isSameTimeRange(time1: Date | string, time2: Date | string) {
  if (dayjs(time1).isSame(time2, "day")) {
    return dayjs(time1).isSame(time2, "hour");
  } else if (dayjs(time1).diff(time2, "week") < 1) {
    return dayjs(time1).isSame(time2, "day");
  } else if (dayjs(time1).diff(time2, "month") < 1) {
    return dayjs(time1).isSame(time2, "week");
  } else if (dayjs(time1).diff(time2, "year") < 1) {
    return dayjs(time1).isSame(time2, "month");
  } else {
    return dayjs(time1).isSame(time2, "year");
  }
}

export function imgErrorToDefalut(
  e: React.SyntheticEvent<HTMLImageElement, Event>
) {
  const target = e.target as HTMLImageElement;
  target.onerror = null;
  target.src = "assets/default-img.jpg";
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
