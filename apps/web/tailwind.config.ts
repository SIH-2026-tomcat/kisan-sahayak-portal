import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "gov-green-900": "#166534",
        "gov-green-800": "#2e7d32",
        "gov-green-700": "#3f9144",
        "gov-green-500": "#66b86a",
        "gov-green-100": "#e8f5e9",
        "gov-saffron-600": "#f28c38",
        "gov-saffron-500": "#ff8c00",
        "gov-saffron-100": "#fff3e0",
        "gov-gold-500": "#f9a825",
        "gov-ink": "#263238",
        "gov-muted": "#667085",
        "gov-border": "#d8dee5",
        "gov-surface": "#ffffff",
        "gov-bg": "#f7faf7",
        "gov-error": "#b42318",
        "gov-warning": "#b54708",
        "gov-info": "#175cd3",
        "gov-success": "#167c2d",
      },
      fontFamily: {
        sans: ["Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
