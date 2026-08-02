/**
 * Professional High-Impact Font Configuration
 * Switched to bold, geometric, enterprise-grade typography.
 */
export const Fonts = {
  // Primary readable UI typography
  body: "Plus Jakarta Sans",
  // High-impact, bold, authoritative headers
  heading: "Syne",
  // Modern geometric display font for big metrics/hero stats
  display: "Cabinet Grotesk",
  // Clean developer monospace font
  mono: "JetBrains Mono",
  // Elegant serif for editorial accents
  serif: "Instrument Serif",
};

export const bodyFont = {
  variable: "--font-body",
  className: "font-body",
};

export const headingFont = {
  variable: "--font-heading",
  className: "font-heading",
};

export const displayFont = {
  variable: "--font-display",
  className: "font-display",
};

export const monoFont = {
  variable: "--font-mono",
  className: "font-mono",
};

export const serifFont = {
  variable: "--font-serif",
  className: "font-serif",
};

export const fontVariables = `
  ${bodyFont.variable}: '${Fonts.body}', sans-serif;
  ${headingFont.variable}: '${Fonts.heading}', sans-serif;
  ${displayFont.variable}: '${Fonts.display}', sans-serif;
  ${monoFont.variable}: '${Fonts.mono}', monospace;
  ${serifFont.variable}: '${Fonts.serif}', serif;
`;

/**
 * Google Fonts stylesheet URL string for automatic preloading in index.html or main entry.
 */
export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap";

export default Fonts;