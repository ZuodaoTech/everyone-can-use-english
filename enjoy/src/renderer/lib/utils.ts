import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import duration, { type DurationUnitType } from "dayjs/plugin/duration";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import i18next, { t } from "i18next";
dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function secondsToTimestamp(seconds: number) {
  const h = Math.floor(seconds / 3600).toString();
  const m = Math.floor((seconds % 3600) / 60).toString();
  const s = Math.floor((seconds % 3600) % 60).toString();

  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
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
  return dayjs.duration(duration, unit).format(format);
}

export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) {
    return "0 Byte";
  }
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}

export function formatDateTime(date: Date) {
  dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
  const now = dayjs();
  const then = dayjs(date);

  if (now.diff(then, "hour") === 0) {
    return then.fromNow();
  } else if (now.diff(then, "day") === 0) {
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
