import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import i18next, { t } from "i18next";
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function secondsToTimestamp(seconds: number) {
  const date = new Date(seconds * 1000);
  return date.toISOString().substr(11, 8);
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
