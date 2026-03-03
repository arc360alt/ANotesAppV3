// App.jsx - Root component. Wires together all modules and global state.

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.jsx";
import { TodoModule } from "./modules/TodoModule.jsx";
import { NotesModule } from "./modules/NotesModule.jsx";
import { KanbanModule } from "./modules/KanbanModule.jsx";
import { SettingsModule } from "./modules/SettingsModule.jsx";
import { loadData } from "./utils/storage.js";
import { resolveTheme, FONT_SIZES } from "./utils/theme.js";
import { useWorkspace } from "./hooks/useWorkspace.js";
import { apiSyncDownload } from "./utils/api.js";

const STORAGE_KEY = "anotes_app_data_v2";

export default function App() {
  const [data, setDataRaw] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && raw.startsWith("{")) return JSON.parse(raw);
    } catch(e) {
      console.warn("Failed to load, clearing corrupt data:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return loadData();
  });
  const [tab, setTab] = useState("notes");

  // setData accepts plain object or functional updater (prev => next)
  const setData = useCallback((updaterOrData) => {
    setDataRaw(prev => {
      const newData = typeof updaterOrData === "function" ? updaterOrData(prev) : updaterOrData;
      if (!newData || typeof newData !== "object") {
        console.warn("Refusing to save invalid data:", newData);
        return prev;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } catch(e) {
        console.warn("Failed to save:", e);
      }
      return newData;
    });
  }, []);

  // ── Page-load auto-download ────────────────────────────────────────────────
  // Lives here (not SettingsModule) because App never unmounts between tab switches.
  // Only runs once per actual page load.
  useEffect(() => {
    const session = (() => {
      try { return JSON.parse(localStorage.getItem("anotes_session") || "null"); } catch { return null; }
    })();
    if (!session?.token) return;

    const raw = localStorage.getItem(STORAGE_KEY);
    const savedSettings = raw ? (JSON.parse(raw).settings || {}) : {};
    const url = (savedSettings.serverMode === "own"
      ? savedSettings.serverUrl
      : "https://loginapinote.arc360hub.com/") || "";
    if (!url) return;

    apiSyncDownload(url, session.token)
      .then(result => {
        if (result.success && result.data) {
          setData(prev => ({
            ...result.data,
            settings: { ...result.data.settings, ...prev.settings },
          }));
        }
      })
      .catch(() => {}); // Silently fall back to local data on failure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — truly once per page load

  const { getCurrentWs, setCurrentWsId, getCurrentWsId, updateWorkspace } = useWorkspace(data, setData);

  const theme = resolveTheme(data.settings);
  window.__theme = theme;

  const fontSize = FONT_SIZES[data.settings?.fontSize || "medium"];

  const updateSettings = useCallback((newSettings) => {
    setData(prev => ({ ...prev, settings: newSettings }));
  }, [setData]);

  const currentWs = getCurrentWs(tab);
  const currentWsId = getCurrentWsId(tab);

  const handleUpdateWorkspace = useCallback((updated) => {
    updateWorkspace(tab, updated);
  }, [tab, updateWorkspace]);

  const globalStyles = `
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; overflow: hidden; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.textSub}; }

    .md-content h1 { font-size: 1.25em; margin: 0.4em 0 0.25em; color: ${theme.text}; }
    .md-content h2 { font-size: 1.1em; margin: 0.4em 0 0.2em; color: ${theme.text}; }
    .md-content h3 { font-size: 1em; margin: 0.35em 0 0.15em; color: ${theme.text}; }
    .md-content p { margin: 0.25em 0; color: ${theme.text}; }
    .md-content ul, .md-content ol { margin: 0.25em 0; padding-left: 1.2em; color: ${theme.text}; }
    .md-content li { margin: 0.1em 0; }
    .md-content code { background: ${theme.surface3}; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 0.85em; }
    .md-content a { color: ${theme.accent}; text-decoration: none; }
    .md-content a:hover { text-decoration: underline; }
    .md-content strong { font-weight: 700; }
    .md-content em { font-style: italic; }
    .md-content hr { border: none; border-top: 1px solid ${theme.border}; margin: 8px 0; }
    .md-content img { max-width: 100%; border-radius: 6px; display: block; margin: 6px 0; }

    .todo-item-actions { opacity: 0 !important; transition: opacity 0.1s; }
    div:hover > .todo-item-actions { opacity: 1 !important; }
    .card-actions { opacity: 0 !important; transition: opacity 0.1s; }
    div:hover > .card-actions { opacity: 1 !important; }

    textarea, input, button { outline: none; }
    button:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
  `;

  return (
    <div style={{
      display: "flex", height: "100vh", background: theme.bg,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      fontSize, color: theme.text, overflow: "hidden",
    }}>
      <style>{globalStyles}</style>

      <Sidebar
        tab={tab} setTab={setTab}
        data={data} setData={setData}
        currentWsId={currentWsId} setCurrentWsId={setCurrentWsId}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "todo" && currentWs && (
          <TodoModule workspace={currentWs} updateWorkspace={handleUpdateWorkspace} />
        )}
        {tab === "notes" && currentWs && (
          <NotesModule workspace={currentWs} updateWorkspace={handleUpdateWorkspace} settings={data.settings} />
        )}
        {tab === "kanban" && currentWs && (
          <KanbanModule workspace={currentWs} updateWorkspace={handleUpdateWorkspace} />
        )}
        {tab === "settings" && (
          <SettingsModule settings={data.settings} updateSettings={updateSettings} data={data} setData={setData} />
        )}

        {tab !== "settings" && !currentWs && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textSub, flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "2rem" }}>🌐</div>
            <div>No workspace selected. Create one in the sidebar.</div>
          </div>
        )}
      </div>
    </div>
  );
}