import { APP_COLORS } from "./src/colors.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: APP_COLORS.background,
        ink: APP_COLORS.ink,
        muted: APP_COLORS.muted,
        line: APP_COLORS.border,
        panel: APP_COLORS.panel,

        accent: {
          DEFAULT: APP_COLORS.accent,
          dark: APP_COLORS.accentDark,
          light: APP_COLORS.accentLight,
        },
        verify: {
          DEFAULT: APP_COLORS.verify,
          light: APP_COLORS.verifyLight,
        },
        danger: {
          DEFAULT: APP_COLORS.danger,
          light: APP_COLORS.dangerLight,
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(17,17,17,0.04), 0 1px 3px 0 rgba(17,17,17,0.06)",
        popover: "0 10px 30px -5px rgba(17,17,17,0.15)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
