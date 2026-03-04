// titlebar.js - Injected into the renderer via executeJavaScript
// macOS-style traffic light buttons, left-aligned

(function () {
  if (document.getElementById("__electron_titlebar__")) return;

  const BAR_HEIGHT = 38;
  const isMac = window.electronAPI?.platform === "darwin";

  // ── Bar ───────────────────────────────────────────────────────────────────
  const bar = document.createElement("div");
  bar.id = "__electron_titlebar__";
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0;
    height: ${BAR_HEIGHT}px;
    background: #111111;
    display: flex;
    align-items: center;
    z-index: 999999;
    -webkit-app-region: drag;
    user-select: none;
    border-bottom: 1px solid #222;
  `;

  // ── Traffic lights container ───────────────────────────────────────────────
  const lights = document.createElement("div");
  lights.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  `;

  // Colors matching real macOS traffic lights
  const BUTTONS = [
    { id: "close",    color: "#ff5f57", hover: "#ff3b30", symbol: "✕", action: () => window.electronAPI?.close() },
    { id: "minimize", color: "#febc2e", hover: "#ffcc00", symbol: "−", action: () => window.electronAPI?.minimize() },
    { id: "maximize", color: "#28c840", hover: "#34c759", symbol: "⤢", action: () => window.electronAPI?.maximize() },
  ];

  let lightsVisible = false; // symbols only show on hover

  const btnEls = BUTTONS.map(({ id, color, hover, symbol, action }) => {
    const btn = document.createElement("button");
    btn.dataset.tbBtn = id;
    btn.style.cssText = `
      width: 13px; height: 13px;
      border-radius: 50%;
      background: ${color};
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
      font-size: 8px;
      color: transparent;
      font-weight: 900;
      line-height: 1;
      transition: background 0.1s, color 0.1s;
      -webkit-app-region: no-drag;
      flex-shrink: 0;
    `;
    btn.textContent = symbol;
    btn.addEventListener("click", action);

    btn.addEventListener("mouseenter", () => {
      btn.style.background = hover;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = color;
      if (!lightsVisible) btn.style.color = "transparent";
    });

    return { el: btn, color, hover };
  });

  // Show symbols when hovering anywhere on the lights group
  lights.addEventListener("mouseenter", () => {
    lightsVisible = true;
    btnEls.forEach(({ el }) => {
      el.style.color = "rgba(0,0,0,0.6)";
    });
  });
  lights.addEventListener("mouseleave", () => {
    lightsVisible = false;
    btnEls.forEach(({ el }) => {
      el.style.color = "transparent";
    });
  });

  btnEls.forEach(({ el }) => lights.appendChild(el));

  // ── Title (centered) ──────────────────────────────────────────────────────
  const title = document.createElement("div");
  title.textContent = "A Notes App V3";
  title.style.cssText = `
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    color: #555;
    letter-spacing: 0.02em;
    pointer-events: none;
    white-space: nowrap;
  `;

  bar.appendChild(lights);
  bar.appendChild(title);

  // ── Inject ────────────────────────────────────────────────────────────────
  document.body.insertBefore(bar, document.body.firstChild);

  // Push React root down so nothing is hidden under the bar
  const root = document.getElementById("root") || document.querySelector("#app");
  if (root) {
    root.style.paddingTop = `${BAR_HEIGHT}px`;
    root.style.boxSizing = "border-box";
  }

  // Hide bar completely when in fullscreen (macOS native handles it)
  window.electronAPI?.onFullscreenChange((isFullscreen) => {
    bar.style.display = isFullscreen ? "none" : "flex";
    if (root) root.style.paddingTop = isFullscreen ? "0" : `${BAR_HEIGHT}px`;
  });

  // Dim buttons when window loses focus (macOS behaviour)
  window.addEventListener("blur", () => {
    btnEls.forEach(({ el }) => {
      el.style.background = "#444";
      el.style.color = "transparent";
    });
  });
  window.addEventListener("focus", () => {
    BUTTONS.forEach(({ color }, i) => {
      btnEls[i].el.style.background = color;
    });
  });
})();