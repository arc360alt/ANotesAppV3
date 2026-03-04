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
    bg: "#0A0A0A",
    surface: "#121212",
    surface2: "#1A1A1A",
    surface3: "#222222",
    border: "#2A2A2A",
    text: "#E0E0E0",
    textSub: "#888888",
    accent: "#7C3AED",
    accentText: "#ffffff",
    cardBg: "#161616",
    sidebarBg: "#0E0E0E",
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

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function tintHex(baseHex, accentHex, strength = 0.18) {
  const b = hexToRgb(baseHex);
  const a = hexToRgb(accentHex);
  const r = Math.round(b.r + (a.r - b.r) * strength);
  const g = Math.round(b.g + (a.g - b.g) * strength);
  const bl = Math.round(b.b + (a.b - b.b) * strength);
  return `#${[r, g, bl].map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("")}`;
}

export function resolveTheme(settings) {
  const base = THEMES[settings?.theme || "dark"] || THEMES.dark;
  const accent = settings?.accentColor || base.accent;

  if ((settings?.theme || "dark") === "midnight") {
    return {
      bg:        tintHex("#0A0A0A", accent, 0.12),
      surface:   tintHex("#121212", accent, 0.14),
      surface2:  tintHex("#1A1A1A", accent, 0.14),
      surface3:  tintHex("#222222", accent, 0.14),
      border:    tintHex("#2A2A2A", accent, 0.20),
      cardBg:    tintHex("#161616", accent, 0.14),
      sidebarBg: tintHex("#0E0E0E", accent, 0.12),
      text:      tintHex("#E0E0E0", accent, 0.15),
      textSub:   tintHex("#888888", accent, 0.20),
      accent,
      accentText: "#ffffff",
    };
  }

  return { ...base, accent };
}
