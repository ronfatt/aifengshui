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
        obsidian: {
          DEFAULT: "#050607",
          deep: "#030405",
          surface: "#080A0C",
          elevated: "#0D1012"
        },
        charcoal: {
          DEFAULT: "#13171A",
          light: "#1A1F24",
          border: "rgba(255, 255, 255, 0.08)"
        },
        ink: "#102F38",
        jade: {
          DEFAULT: "#0F5C54",
          bright: "#1495A0",
          glow: "rgba(20, 149, 160, 0.25)"
        },
        cyan: {
          DEFAULT: "#04c9db",
          bright: "#04c9db",
          glow: "rgba(4, 201, 219, 0.35)",
          light: "#7DF9FF"
        },
        cinnabar: "#1495A0",
        gold: {
          DEFAULT: "#C79A54",
          light: "#E8D4A8",
          dark: "#8C6527",
          glow: "rgba(199, 154, 84, 0.28)"
        },
        cloud: "#DDEFF2",
        rice: "#F5FAFA"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0, 0, 0, 0.35)",
        "gold-glow": "0 0 25px rgba(199, 154, 84, 0.25)",
        "jade-glow": "0 0 25px rgba(20, 149, 160, 0.25)",
        "panel-dark": "0 20px 50px rgba(0, 0, 0, 0.5)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      },
      fontFamily: {
        serif: ["Noto Serif SC", "Songti SC", "SimSun", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "PingFang SC", "Microsoft YaHei", "sans-serif"]
      }
    },
  },
  plugins: [],
};

export default config;

