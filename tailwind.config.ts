import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0c1a22",
          muted: "#3d4f5a",
          soft: "#5c6e79",
        },
        navy: {
          DEFAULT: "#143044",
          deep: "#0b1f2c",
          mid: "#1c4258",
        },
        parchment: {
          DEFAULT: "#f4efe4",
          deep: "#e8dfd0",
          card: "#fbf8f2",
        },
        sand: "#e2d8c8",
        copper: {
          DEFAULT: "#b56a32",
          hover: "#9a5626",
          soft: "#f3e2d2",
        },
        forest: {
          DEFAULT: "#2f5d4a",
          soft: "#dce8e2",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        desk: "0 1px 0 rgba(12,26,34,0.04), 0 18px 40px -24px rgba(12,26,34,0.35)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
