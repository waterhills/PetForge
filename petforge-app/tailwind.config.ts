import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#a855f7",
          dark: "#7e22ce",
          light: "#d8b4fe",
        },
        background: {
          main: "#0f0f13",
          dark: "#050208",
        },
        surface: {
          card: "#18181b",
          hover: "#27272a",
        },
        neon: {
          purple: "#d946ef",
          blue: "#3b82f6",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Noto Sans SC", "sans-serif"],
        sans: ["Noto Sans SC", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 5px theme('colors.primary'), 0 0 20px theme('colors.primary')",
        "neon-hover": "0 0 10px theme('colors.neon.purple'), 0 0 40px theme('colors.neon.purple')",
        "card-glow": "0 0 20px rgba(168, 85, 247, 0.15)",
        "tech": "0 4px 20px -5px rgba(0, 0, 0, 0.5)",
        "tech-hover": "0 10px 40px -10px rgba(139, 92, 246, 0.15), 0 0 20px -5px rgba(6, 182, 212, 0.1)",
      },
      backgroundImage: {
        "tech-grid": "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-tech": "linear-gradient(to bottom, #1e1b4b, #0f0718, #000000)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.7)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};

export default config;
