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
        items: [
          { text: '快速开始', link: '/markdown-examples' },
          { text: '基本用法', link: '/api-examples' }
        ]
      },
      {
        text: '智能助手',
        items: [
          { text: '快速开始', link: '/markdown-examples' },
          { text: '基本用法', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xiaolai/everyone-can-use-english/tree/main/enjoy-docs' }
    ]
  }
})
