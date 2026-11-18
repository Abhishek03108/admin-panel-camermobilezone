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
        // Text greys follow the style guide: #3d3d3d primary, #666 secondary.
        gray: {
          400: "#8A8A8A",
          500: "#666666",
          600: "#666666",
          700: "#4D4D4D",
          800: "#3D3D3D",
          900: "#3D3D3D",
        },
      },
      // Outfit everywhere (see src/font.js). `font-mono` stays Outfit too, with
      // tabular figures from index.css, so prices and IDs line up.
      fontFamily: {
        sans: ["Outfit", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["Outfit", "sans-serif"],
      },
      // Readable admin scale: nothing below 12px, headings tighten as they grow.
      fontSize: {
        xs: ["13px", { lineHeight: "18px" }],
        sm: ["14px", { lineHeight: "21px" }],
        base: ["15px", { lineHeight: "24px" }],
        lg: ["17px", { lineHeight: "26px" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        "2xl": ["24px", { lineHeight: "30px", letterSpacing: "-0.02em" }],
        "3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
        "4xl": ["36px", { lineHeight: "42px", letterSpacing: "-0.025em" }],
      },
      // Headings top out at 700, as in the style guide.
      fontWeight: {
        extrabold: "700",
        black: "700",
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
