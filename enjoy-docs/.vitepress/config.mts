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
        text: '简介',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
