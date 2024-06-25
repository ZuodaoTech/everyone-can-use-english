// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/styles/main.css"],
  site: {
    url: "https://example.com",
    name: "Enjoy App",
    description: "Welcome to Enjoy App!",
    tagline: "",
    defaultLocale: "zh", // not needed if you have @nuxtjs/i18n installed
  },

  app: {
    buildAssetsDir: "portal-assets",
    head: {
      viewport:
        "width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/portal-static/images/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "24x24",
          href: "/portal-static/images/favicon-24x24.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "12x12",
          href: "/portal-static/images/favicon-12x12.png",
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

  modules: ["@nuxtjs/seo"],
});
