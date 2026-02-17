/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E8714A",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#D9534F",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F0EDE9",
          foreground: "#7A7268",
        },
        accent: {
          DEFAULT: "#FBEEE8",
          foreground: "#A14520",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#2A2420",
        },
        border: "#E5DFD8",
        background: "#FAF7F4",
        foreground: "#2A2420",
        positive: "#3DA368",
        negative: "#D9534F",
      },
    },
  },
  plugins: [],
};
