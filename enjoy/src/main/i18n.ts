import * as i18next from "i18next";
import en from "@/i18n/en.json";
import zh_CN from "@/i18n/zh-CN.json";

const resources = {
  en: {
    translation: en,
  },
  "zh-CN": {
    translation: zh_CN,
  },
};

export const i18n = (language: string) => {
  i18next.init({
    resources,
    lng: language,
    supportedLngs: ["en", "zh-CN"],
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });
};
