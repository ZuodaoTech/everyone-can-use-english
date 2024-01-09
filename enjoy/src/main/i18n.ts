import * as i18n from "i18next";
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

i18n.init({
  resources,
  lng: "zh-CN",
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
