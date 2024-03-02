import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "zh-CN", // 'en-US
  title: "Enjoy App",
  description: "Enjoy 用户手册",
  head: [
    [
      "script",
      { async: "", src: "https://www.googletagmanager.com/gtag/js?id=G-RY5XCM04NL" },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-RY5XCM04NL');`,
    ],
    ["link", { rel: "icon", href: "/favicon.ico" }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.png",
    nav: [{ text: "用户手册", link: "/markdown-examples" }],

    sidebar: [
      {
        text: "快速开始",
        collapsed: false,
        items: [
          { text: "简介", link: "/guide/intro" },
          { text: "下载安装", link: "/guide/install" },
          { text: "软件设置", link: "/guide/settings" },
        ],
      },
      {
        text: "跟读训练",
        collapsed: false,
        items: [
          { text: "音频资源", link: "/guide/audios" },
          { text: "视频资源", link: "/guide/videos" },
        ],
      },
      {
        text: "阅读文本",
        collapsed: false,
        items: [
          { text: "在线文章", link: "/guide/webpage" },
          { text: "本地电子书", link: "/guide/ebook" },
        ],
      },
      {
        text: "智能助手",
        collapsed: false,
        items: [
          { text: "简介", link: "/guide/ai-assistant" },
          { text: "GPT 服务", link: "/guide/gpt-conversation" },
          { text: "TTS 服务", link: "/guide/tts-conversation" },
        ],
      },
      {
        text: "使用案例",
        collapsed: false,
        items: [
          {
            text: "利用 AI 生成训练材料",
            link: "/guide/use-case-generate-audio-resources",
          },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/xiaolai/everyone-can-use-english/tree/main/enjoy-docs",
      },
    ],

    editLink: {
      pattern:
        "https://github.com/xiaolai/everyone-can-use-english/edit/main/enjoy-docs/:path",
      text: "在 GitHub 上编辑此页面",
    },

    search: {
      provider: "local",
    },
  },
  lastUpdated: true,
});
