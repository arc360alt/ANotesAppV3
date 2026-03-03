// theme.js - All theme definitions and constants

export const THEMES = {
  dark: {
    bg: "#121212",
    surface: "#1E1E1E",
    surface2: "#2A2A2A",
    surface3: "#333333",
    border: "#3A3A3A",
    text: "#E8E8E8",
    textSub: "#A0A0A0",
    accent: "#EF4444",
    accentText: "#ffffff",
    cardBg: "#242424",
    sidebarBg: "#181818",
  },
  light: {
    bg: "#F5F5F5",
    surface: "#FFFFFF",
    surface2: "#F0F0F0",
    surface3: "#E5E5E5",
    border: "#DCDCDC",
    text: "#1A1A1A",
    textSub: "#666666",
    accent: "#EF4444",
    accentText: "#ffffff",
    cardBg: "#FFFFFF",
    sidebarBg: "#FAFAFA",
  },
  midnight: {
    bg: "#0A0A1A",
    surface: "#12122A",
    surface2: "#1A1A35",
    surface3: "#22223F",
    border: "#2A2A4A",
    text: "#E0E0FF",
    textSub: "#8888BB",
    accent: "#7C3AED",
    accentText: "#ffffff",
    cardBg: "#16162E",
    sidebarBg: "#0E0E22",
  },
};

export const NOTE_COLORS = [
  "#242424", "#1a2a1a", "#1a1a2a",
  "#2a1a1a", "#2a2a1a", "#1a2a2a",
];

export const KANBAN_COL_COLORS = [
  "#1a2535", "#1a2a1a", "#2a1a2a",
  "#2a2a1a", "#1a2a2a", "#2a1a1a",
];

export const FONT_SIZES = { small: "13px", medium: "15px", large: "17px" };

export function resolveTheme(settings) {
  const base = THEMES[settings?.theme || "dark"] || THEMES.dark;
  const accent = settings?.accentColor || base.accent;
  return { ...base, accent };
}
