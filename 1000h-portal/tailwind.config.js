/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    container: {
      padding: "1rem",
    },
    colors: {
      white: "#ffffff",
      primary: "#4797F5",
      greyscale_1: "#0D0D0D",
      greyscale_2: "#212121",
      greyscale_3: "#252525",
      greyscale_4: "#8D8D8D",
      greyscale_5: "#d7d7d7",
    },
    extend: {},
  },
  plugins: [],
};
