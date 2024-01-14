import * as i18n from "i18next";
import en from "@/i18n/en.json";
import zh_CN from "@/i18n/zh-CN.json";
import settings from "@main/settings";

const resources = {
  en: {
    translation: en,
  },
  "zh-CN": {
    translation: zh_CN,
  },
};

i18n.init({
  resources,
  lng: settings.language(),
  supportedLngs: ["en", "zh-CN"],
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
