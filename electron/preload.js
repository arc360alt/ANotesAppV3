// preload.js

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.invoke("win-minimize"),
  maximize: () => ipcRenderer.invoke("win-maximize"),
  close:    () => ipcRenderer.invoke("win-close"),
});

const BAR_HEIGHT = 38;

const BUTTONS = [
  { id: "close",    color: "#ff5f57", activeColor: "#ff3b30", symbol: "✕", action: () => ipcRenderer.invoke("win-close") },
  { id: "minimize", color: "#febc2e", activeColor: "#ffcc00", symbol: "−", action: () => ipcRenderer.invoke("win-minimize") },
  { id: "maximize", color: "#28c840", activeColor: "#34c759", symbol: "⤢", action: () => ipcRenderer.invoke("win-maximize") },
];

function buildTitlebar() {
  if (document.getElementById("__tb__")) return;

  // ── Inject a global style that overrides 100vh across the whole app ────────
  // This is the key fix: anywhere the app uses height:100vh or max-height:100vh
  // it will be rewritten to account for the titlebar, without us needing to
  // touch any React code.
  const style = document.createElement("style");
  style.id = "__tb_style__";
  style.textContent = `
    :root {
      --titlebar-height: ${BAR_HEIGHT}px;
    }
    /* Redefine what 100vh means for the app root */
    html {
      height: 100%;
    }
    body {
      height: 100%;
      overflow: hidden;
    }
    /* The React root fills the space BELOW the titlebar */
    #root, #app {
      height: calc(100vh - ${BAR_HEIGHT}px) !important;
      max-height: calc(100vh - ${BAR_HEIGHT}px) !important;
      margin-top: ${BAR_HEIGHT}px !important;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);

  // ── Titlebar bar ───────────────────────────────────────────────────────────
  const bar = document.createElement("div");
  bar.id = "__tb__";
  Object.assign(bar.style, {
    position: "fixed",
    top: "0", left: "0", right: "0",
    height: BAR_HEIGHT + "px",
    background: "#111111",
    display: "flex",
    alignItems: "center",
    zIndex: "999999",
    WebkitAppRegion: "drag",
    userSelect: "none",
    borderBottom: "1px solid #222",
    fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
  });

  // ── Traffic lights ─────────────────────────────────────────────────────────
  const lights = document.createElement("div");
  Object.assign(lights.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 16px",
    WebkitAppRegion: "no-drag",
    flexShrink: "0",
  });

  let focused = true;

  const btnEls = BUTTONS.map(({ color, activeColor, symbol, action }) => {
    const btn = document.createElement("button");
    Object.assign(btn.style, {
      width: "13px", height: "13px",
      borderRadius: "50%",
      background: color,
      border: "none",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0",
      fontSize: "8px",
      color: "transparent",
      fontWeight: "900",
      lineHeight: "1",
      WebkitAppRegion: "no-drag",
      flexShrink: "0",
      outline: "none",
      transition: "background 0.1s",
    });
    btn.textContent = symbol;
    btn.addEventListener("click", (e) => { e.stopPropagation(); action(); });
    btn.addEventListener("mouseenter", () => { btn.style.background = activeColor; });
    btn.addEventListener("mouseleave", () => { btn.style.background = focused ? color : "#4a4a4a"; });
    return { el: btn, color };
  });

  lights.addEventListener("mouseenter", () => {
    btnEls.forEach(({ el }) => { el.style.color = "rgba(0,0,0,0.65)"; });
  });
  lights.addEventListener("mouseleave", () => {
    btnEls.forEach(({ el }) => { el.style.color = "transparent"; });
  });

  btnEls.forEach(({ el }) => lights.appendChild(el));

  // ── Centered title ─────────────────────────────────────────────────────────
  const title = document.createElement("div");
  title.textContent = "A Notes App V3";
  Object.assign(title.style, {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#555",
    letterSpacing: "0.02em",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  });

  bar.appendChild(lights);
  bar.appendChild(title);
  document.body.insertBefore(bar, document.body.firstChild);

  // ── Window state ───────────────────────────────────────────────────────────
  ipcRenderer.on("win-state", (_, state) => {
    const isFullscreen = state === "fullscreen";
    bar.style.display = isFullscreen ? "none" : "flex";
    style.textContent = isFullscreen ? "" : `
      :root { --titlebar-height: ${BAR_HEIGHT}px; }
      html { height: 100%; }
      body { height: 100%; overflow: hidden; }
      #root, #app {
        height: calc(100vh - ${BAR_HEIGHT}px) !important;
        max-height: calc(100vh - ${BAR_HEIGHT}px) !important;
        margin-top: ${BAR_HEIGHT}px !important;
        overflow: hidden;
      }
    `;
  });

  ipcRenderer.on("win-focus", (_, hasFocus) => {
    focused = hasFocus;
    btnEls.forEach(({ el, color }) => {
      el.style.background = hasFocus ? color : "#4a4a4a";
      el.style.color = "transparent";
    });
    title.style.color = hasFocus ? "#555" : "#333";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildTitlebar);
} else {
  buildTitlebar();
}