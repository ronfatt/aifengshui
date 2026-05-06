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
        ink: "#102F38",
        jade: "#1495A0",
        cinnabar: "#1495A0",
        gold: "#C79A54",
        cloud: "#DDEFF2",
        rice: "#F5FAFA"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 47, 56, 0.12)"
      }
    },
  },
  plugins: [],
};

export default config;
