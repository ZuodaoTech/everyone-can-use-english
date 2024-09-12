// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import SpeakWord from "./components/SpeakWord.vue";
import MyLayout from "./layouts/index.vue";
import "./style.scss";

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  // Layout: () => {
  //   return h(DefaultTheme.Layout, null, {
  //     // https://vitepress.dev/guide/extending-default-theme#layout-slots
  //   })
  // },
  enhanceApp({ app, router, siteData }) {
    // ...
    app.component("SpeakWord", SpeakWord);
  },
} satisfies Theme;
