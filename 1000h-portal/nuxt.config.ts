// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/styles/main.css"],
  site: {
    url: "https://1000h.org",
    name: "Enjoying App",
    description: "Welcome to Enjoying App!",
    tagline: "",
    defaultLocale: "zh", // not needed if you have @nuxtjs/i18n installed
  },
  app: {
    head: {
      viewport:
        "width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "mask-icon", href: "/mask-icon.svg" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "24x24",
          href: "/favicon-24x24.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "12x12",
          href: "favicon-12x12.png",
        },
      ],
      script: [],
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: ["nuxt-og-image", "@nuxtjs/seo"],
});
