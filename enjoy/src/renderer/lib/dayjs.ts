import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localeData from "dayjs/plugin/localeData";

import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import i18next from "i18next";

dayjs.extend(localizedFormat);
dayjs.extend(duration);
dayjs.extend(relativeTime);

dayjs.extend(localeData);
dayjs.locale(i18next.resolvedLanguage?.toLowerCase() || "en");
dayjs.extend(utc);
dayjs.extend(timezone);

try {
  dayjs.tz.setDefault(Intl.DateTimeFormat().resolvedOptions().timeZone);
} catch (e) {
  dayjs.tz.guess();
}

export default dayjs;
