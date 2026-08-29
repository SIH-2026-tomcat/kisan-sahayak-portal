import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Spec palette (Farmer Procurement Portal MVP)
        green: {
          DEFAULT: "#1F6B3A",
          50: "#EAF3EC",
          100: "#CFE5D6",
          600: "#1F6B3A",
          700: "#1A5C31",
          800: "#15542D",
          900: "#0F3D20",
        },
        saffron: {
          DEFAULT: "#E88A1A",
          50: "#FDF1E1",
          100: "#FADFBE",
          600: "#E88A1A",
          700: "#C9760F",
        },
        paper: "#F7F4ED",
        ink: "#22271F",
        muted: "#5B6560",
        line: "#D9DCD4",
        link: "#1D5E88",
        ok: "#1F6B3A",
        attention: "#E88A1A",
        closed: "#6B7280",
        danger: "#B42318",
      },
      fontFamily: {
        sans: [
          "var(--font-noto-latin)",
          "var(--font-noto-deva)",
          "var(--font-noto-telu)",
          "var(--font-noto-beng)",
          "Noto Sans",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 4px rgba(16,24,40,.08)",
        md: "0 4px 16px rgba(16,24,40,.10)",
      },
      transitionDuration: { DEFAULT: "180ms" },
      maxWidth: { content: "1200px", reading: "820px" },
    },
  },
  plugins: [],
};

export default config;
