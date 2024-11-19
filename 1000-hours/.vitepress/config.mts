import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import footnote from "markdown-it-footnote";
import sup from "markdown-it-sup";
import sub from "markdown-it-sub";
import mark from "markdown-it-mark";
import ins from "markdown-it-ins";
import carousel from "./lib/markdown-it-carousel";

// import markdownit from 'markdown-it'

export default withMermaid(
  // https://vitepress.dev/reference/site-config
  defineConfig({
    title: "1000 小时",
    description: "用注意力填满 1000 小时就能练成任何你需要的技能……",
    head: [
      [
        "script",
        {
          async: "",
          src: "https://www.googletagmanager.com/gtag/js?id=G-Z2QZPX3T9W",
        },
      ],
      [
        "script",
        {},
        `window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-Z2QZPX3T9W');`,
      ],
      ["link", { rel: "icon", href: "/images/clock.svg" }],
    ],
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: "Home", link: "/" },
        { text: "Enjoy App", link: "/enjoy-app/", activeMatch: "/enjoy-app/" },
      ],

      search: {
        // provider: 'local'
        provider: "algolia",
        options: {
          appId: "KKK8CORNSR",
          apiKey: "d613ff31a535ff1e9535cf9c88ec420a",
          indexName: "1000h",
        },
      },

      sidebar: {
        "/": [
          {
            text: "简要说明",
            collapsed: true,
            link: "/intro",
            items: [
              { text: "1. 要不要健脑？", link: "/why" },
              { text: "2. 什么最健脑？", link: "/what" },
            ],
          },
          {
            text: "训练任务",
            collapsed: true,
            items: [
              { text: "1. 启动任务", link: "/training-tasks/kick-off" },
              { text: "2. 训练方法", link: "/training-tasks/procedures" },
              {
                text: "3. 人工智能",
                collapsed: false,
                link: "/training-tasks/ai",
                items: [
                  {
                    text: "3.1. 基础语言能力",
                    link: "/training-tasks/language",
                  },
                  {
                    text: "3.2. 成年人的困境",
                    link: "/training-tasks/predicaments",
                  },
                  {
                    text: "3.3. 人工智能辅助",
                    link: "/training-tasks/revolution",
                  },
                  { text: "3.4. 任务并不高级", link: "/training-tasks/ground" },
                  { text: "3.5. 效果非常惊人", link: "/training-tasks/wonder" },
                ],
              },
              { text: "4. 意料之外", link: "/training-tasks/surprise" },
            ],
          },
          {
            text: "语音塑造",
            link: "/sounds-of-american-english/0-intro",
            collapsed: true,
            items: [
              {
                text: "1. 基础",
                link: "/sounds-of-american-english/1-basics",
                items: [
                  {
                    text: "1.1. 音素音标",
                    link: "/sounds-of-american-english/1.1-phonemes",
                  },
                  {
                    text: "1.2. 英文字母",
                    link: "/sounds-of-american-english/1.2-alphabets",
                  },
                ],
              },
              {
                text: "2. 发声器官",
                link: "/sounds-of-american-english/2-articulators",
              },
              {
                text: "3. 音素详解",
                collapsed: true,
                link: "/sounds-of-american-english/3-details",
                items: [
                  {
                    text: "3.1. 元音",
                    collapsed: true,
                    link: "/sounds-of-american-english/3.1-vowels",
                    items: [
                      {
                        text: "3.1.1. ə/ɚ/ɝː",
                        link: "/sounds-of-american-english/3.1.1-ə",
                      },
                      {
                        text: "3.1.2. ʌ/ɑː/ɑːr",
                        link: "/sounds-of-american-english/3.1.2-ɑ",
                      },
                      {
                        text: "3.1.3. ɪ/i/iː/ɪr",
                        link: "/sounds-of-american-english/3.1.3-i",
                      },
                      {
                        text: "3.1.4. ʊ/u/uː/ʊr",
                        link: "/sounds-of-american-english/3.1.4-u",
                      },
                      {
                        text: "3.1.5. e/æ/er",
                        link: "/sounds-of-american-english/3.1.5-e",
                      },
                      {
                        text: "3.1.6. ɒ/ɑː/ɔː/ɔːrː",
                        link: "/sounds-of-american-english/3.1.6-ɔ",
                      },
                      {
                        text: "3.1.7. aɪ... oʊ",
                        link: "/sounds-of-american-english/3.1.7-aɪ",
                      },
                    ],
                  },
                  {
                    text: "3.2. 辅音",
                    collapsed: true,
                    link: "/sounds-of-american-english/3.2-consonants",
                    items: [
                      {
                        text: "3.2.1. p/b",
                        link: "/sounds-of-american-english/3.2.1-pb",
                      },
                      {
                        text: "3.2.2. t/d",
                        link: "/sounds-of-american-english/3.2.2-td",
                      },
                      {
                        text: "3.2.3. k/g",
                        link: "/sounds-of-american-english/3.2.3-kg",
                      },
                      {
                        text: "3.2.4. f/v",
                        link: "/sounds-of-american-english/3.2.4-fv",
                      },
                      {
                        text: "3.2.5. s/z",
                        link: "/sounds-of-american-english/3.2.5-sz",
                      },
                      {
                        text: "3.2.6. θ/ð",
                        link: "/sounds-of-american-english/3.2.6-θð",
                      },
                      {
                        text: "3.2.7. ʃ/ʒ",
                        link: "/sounds-of-american-english/3.2.7-ʃʒ",
                      },
                      {
                        text: "3.2.8. tʃ/dʒ",
                        link: "/sounds-of-american-english/3.2.8-tʃdʒ",
                      },
                      {
                        text: "3.2.9. tr/dr",
                        link: "/sounds-of-american-english/3.2.9-trdr",
                      },
                      {
                        text: "3.2.10. ts/dz",
                        link: "/sounds-of-american-english/3.2.10-tsdz",
                      },
                      {
                        text: "3.2.11. m, n, ŋ",
                        link: "/sounds-of-american-english/3.2.11-mnŋ",
                      },
                      {
                        text: "3.2.12. l, r",
                        link: "/sounds-of-american-english/3.2.12-lr",
                      },
                      {
                        text: "3.2.13. w, j",
                        link: "/sounds-of-american-english/3.2.13-wj",
                      },
                      {
                        text: "3.2.14. h",
                        link: "/sounds-of-american-english/3.2.14-h",
                      },
                    ],
                  },
                  {
                    text: "3.3. 变体",
                    link: "/sounds-of-american-english/3.3-variations",
                  },
                ],
              },
              {
                text: "4. 自然语流",
                collapsed: true,
                link: "/sounds-of-american-english/4-natural-speech",
                items: [
                  {
                    text: "4.1. 音节",
                    link: "/sounds-of-american-english/4.1-syllables",
                  },
                  {
                    text: "4.2. 单词",
                    link: "/sounds-of-american-english/4.2-words",
                  },
                  {
                    text: "4.3. 意群",
                    link: "/sounds-of-american-english/4.3-grouping",
                  },
                  {
                    text: "4.4. 连接",
                    link: "/sounds-of-american-english/4.4-linking",
                  },
                  {
                    text: "4.5. 句子",
                    link: "/sounds-of-american-english/4.5-sentences",
                  },
                ],
              },
              {
                text: "5. 基础之上",
                link: "/sounds-of-american-english/5-above-ground",
              },
              {
                text: "6. 词汇构建",
                collapsed: true,
                link: "/sounds-of-american-english/6-vocabulary",
                items: [
                  {
                    text: "6.1. 有效记忆单词",
                    link: "/sounds-of-american-english/6.1-effectiveness",
                  },
                  {
                    text: "6.2. 多音拼写",
                    link: "/sounds-of-american-english/6.2-polyphonic-spellings",
                  },
                  {
                    text: "6.3. 常见复合词汇",
                    link: "/sounds-of-american-english/6.3-compound-words",
                  },
                  {
                    text: "6.4. 常见词根词缀",
                    link: "/sounds-of-american-english/6.4-parts-of-words",
                  },
                ],
              },
              {
                text: "7. 从此之后",
                link: "/sounds-of-american-english/7-whats-next",
              },
              {
                text: "8. 附录",
                collapsed: true,
                link: "/sounds-of-american-english/8-appendix",
                items: [
                  {
                    text: "8.1. 输入音标与特殊符号",
                    link: "/sounds-of-american-english/8.1-inputting-phonemes-and-symbols",
                  },
                  {
                    text: "8.2. 获取 CEPD 音标",
                    link: "/sounds-of-american-english/8.2-cepd-phonetics-and-sound",
                  },
                  {
                    text: "8.3. 音标练习",
                    link: "/sounds-of-american-english/8.3-phoneme-exercises",
                  },
                  {
                    text: "8.4. 每日练习语音生成",
                    link: "/sounds-of-american-english/8.4-daily-speech-exercises",
                  },
                ],
              },
            ],
          },
          {
            text: "大脑内部",
            collapsed: true,
            items: [
              { text: "1. 小空间大世界", link: "/in-the-brain/01-inifinite" },
              { text: "2. 一切都是连接", link: "/in-the-brain/02-links" },
              { text: "3. 一切都是体育课", link: "/in-the-brain/03-sports" },
              {
                text: "4. 一切都是语文课",
                link: "/in-the-brain/04-literature",
              },
              { text: "5. 一切都需要能量", link: "/in-the-brain/05-energy" },
              {
                text: "6. 用进废退循环利用",
                link: "/in-the-brain/06-use-or-lose",
              },
              {
                text: "7. 短时间内足量重复",
                link: "/in-the-brain/07-repitition",
              },
              {
                text: "8. 新旧网络间的竞争",
                link: "/in-the-brain/08-compitition",
              },
              {
                text: "9. 注意不到就不存在",
                link: "/in-the-brain/09-unnoticed",
              },
              {
                text: "10. 熟练就是卸载负担",
                link: "/in-the-brain/10-unloading",
              },
              { text: "11. 被关注是最大负担", link: "/in-the-brain/11-burden" },
              {
                text: "12. 有限排它不可再生",
                link: "/in-the-brain/12-unreproducible",
              },
              {
                text: "13. 一切都是化学反应",
                link: "/in-the-brain/13-chemical",
              },
              {
                text: "14. 安全阈值决定成果",
                link: "/in-the-brain/14-threshold",
              },
            ],
          },
          {
            text: "自我训练",
            collapsed: true,
            link: `/self-training/00-intro`,
            items: [
              { text: "1. 用兵打仗", link: "/self-training/01-fight" },
              { text: "2. 只能自学", link: "/self-training/02-last-resort" },
              {
                text: "3. 生学硬练",
                link: "/self-training/03-trials-and-errors",
              },
              { text: "4. 走出迷宫", link: "/self-training/04-maze" },
              { text: "5. 自我纠正", link: "/self-training/05-correction" },
              { text: "6. 自主驱动", link: "/self-training/06-motives" },
              { text: "7. 自我鼓励", link: "/self-training/07-encouraging" },
              { text: "8. 自我监督", link: "/self-training/08-supervising" },
              { text: "9. 自主计划", link: "/self-training/09-planning" },
              { text: "10. 返璞归真", link: "/self-training/10-going-back" },
            ],
          },
          {
            text: "Enjoy App",
            collapsed: true,
            link: `/enjoy-app/`,
            items: [
              {
                text: "快速开始",
                collapsed: false,
                items: [
                  { text: "Enjoy 简介", link: "/enjoy-app/" },
                  { text: "下载安装", link: "/enjoy-app/install" },
                  { text: "软件设置", link: "/enjoy-app/settings" },
                ],
              },
              {
                text: "跟读训练",
                collapsed: false,
                items: [
                  { text: "音频资源", link: "/enjoy-app/audios" },
                  { text: "视频资源", link: "/enjoy-app/videos" },
                ],
              },
              {
                text: "阅读文本",
                collapsed: false,
                items: [
                  { text: "在线文章", link: "/enjoy-app/webpage" },
                  { text: "本地电子书", link: "/enjoy-app/ebook" },
                ],
              },
              {
                text: "智能助手",
                collapsed: false,
                items: [
                  { text: "简介", link: "/enjoy-app/ai-assistant" },
                  { text: "GPT 服务", link: "/enjoy-app/gpt-conversation" },
                  { text: "TTS 服务", link: "/enjoy-app/tts-conversation" },
                ],
              },
              {
                text: "其他",
                collapsed: false,
                items: [
                  {
                    text: "常见问题",
                    link: "/enjoy-app/faq",
                  },
                  {
                    text: "利用 AI 生成训练材料",
                    link: "/enjoy-app/use-case-generate-audio-resources",
                  },
                ],
              },
            ],
          },
        ],

        "/enjoy-app/": [
          {
            text: "快速开始",
            collapsed: false,
            items: [
              { text: "Enjoy 简介", link: "/enjoy-app/" },
              { text: "下载安装", link: "/enjoy-app/install" },
              { text: "软件设置", link: "/enjoy-app/settings" },
              { text: "版本更新", link: "/enjoy-app/changelog" },
            ],
          },
          {
            text: "跟读训练",
            collapsed: false,
            items: [
              { text: "音频资源", link: "/enjoy-app/audios" },
              { text: "视频资源", link: "/enjoy-app/videos" },
            ],
          },
          {
            text: "聊天",
            collapsed: false,
            items: [
              { text: "简介", link: "/enjoy-app/chat" },
              { text: "与智能体对话", link: "/enjoy-app/chat-with-agent" },
              { text: "多个智能体群聊", link: "/enjoy-app/chat-group" },
              { text: "Copilot", link: "/enjoy-app/chat-copilot" },
            ],
          },
          {
            text: "阅读文本",
            collapsed: false,
            items: [
              { text: "简介", link: "/enjoy-app/document" },
              { text: "本地文档", link: "/enjoy-app/document-ebook" },
              { text: "在线文章", link: "/enjoy-app/document-webpage" },
            ],
          },
          {
            text: "智能助手",
            collapsed: false,
            items: [
              { text: "简介", link: "/enjoy-app/ai-assistant" },
              { text: "GPT 服务", link: "/enjoy-app/gpt-conversation" },
              { text: "TTS 服务", link: "/enjoy-app/tts-conversation" },
            ],
          },
          {
            text: "其他",
            collapsed: false,
            items: [
              {
                text: "常见问题",
                link: "/enjoy-app/faq",
              },
              {
                text: "利用 AI 生成训练材料",
                link: "/enjoy-app/use-case-generate-audio-resources",
              },
            ],
          },
          {
            text: "返回",
            link: "/intro",
          },
        ],
      },

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/zuodaotech/everyone-can-use-english/tree/main/1000-hours",
        },
      ],
    },

    sitemap: {
      hostname: "https://1000h.org",
    },

    lastUpdated: true,

    markdown: {
      // https://vitepress.dev/reference/markdown
      math: true,
      config: (md) => {
        // use more markdown-it plugins!
        md.use(footnote);
        md.use(sub);
        md.use(sup);
        md.use(mark);
        md.use(ins);
        md.use(carousel);
      },
      toc: {
        level: [1, 2, 3],
      },
    },
  })
);
