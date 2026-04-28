import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0B",
        jade: "#B91C1C",
        cinnabar: "#B91C1C",
        gold: "#C9A24A",
        cloud: "#F7F7F7",
        rice: "#FFFFFF"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(11, 11, 11, 0.12)"
      }
    },
  },
  plugins: [],
};

export default config;
