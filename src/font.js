/**
 * Professional High-Impact Font Configuration
 * Switched to bold, geometric, enterprise-grade typography.
 */
export const Fonts = {
  // One family everywhere: Outfit for headings, body and numbers.
  body: "Outfit",
  heading: "Outfit",
  display: "Outfit",
  mono: "Outfit",
  serif: "Outfit",
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
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300..700&display=swap";

export default Fonts;