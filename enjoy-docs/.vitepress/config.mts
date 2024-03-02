import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Enjoy App",
  description: "Enjoy 用户手册",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '用户手册', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '快速开始',
        collapsed: false,
        items: [
          { text: '简介', link: '/guide/intro' },
          { text: '下载安装', link: '/guide/install' },
          { text: '软件设置', link: '/guide/settings' }
        ]
      },
      {
        text: '跟读训练',
        collapsed: false,
        items: [
          { text: '音频资源', link: '/guide/audios' },
          { text: '视频资源', link: '/guide/videos' },
        ]
      },
      {
        text: '阅读文本',
        collapsed: false,
        items: [
          { text: '在线文章', link: '/guide/webpage' },
          { text: '本地电子书', link: '/guide/ebook' },
        ]
      },
      {
        text: '智能助手',
        collapsed: false,
        items: [
          { text: '简介', link: '/guide/ai-assistant' },
          { text: 'GPT 服务', link: '/guide/gpt-conversation' },
          { text: 'TTS 服务', link: '/guide/tts-conversation' }
        ]
      },
      {
        text: '使用案例',
        collapsed: false,
        items: [
          { text: '利用 AI 生成训练材料', link: '/guide/use-case-generate-audio-resources' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xiaolai/everyone-can-use-english/tree/main/enjoy-docs' }
    ]
  }
})
