// SettingsModule.jsx - App settings: theme, accent, font, canvas speed, server sync

import { useState, useEffect, useRef } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Input, Modal, Chip, SettingSection, SettingRow } from "../components/UI.jsx";
import { apiLogin, apiRegister, apiLogout, apiSyncUpload, apiSyncDownload } from "../utils/api.js";

const STORAGE_KEY = "anotes_app_data_v2";

// Always reads the freshest committed data straight from localStorage
function getFreshData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function SettingsModule({ settings, updateSettings, data, setData }) {
  const t = window.__theme;
  const [s, setS] = useState({
    ...settings,
    serverMode: settings.serverMode || "central",
    serverUrl: settings.serverUrl || "",
  });
  const [saved, setSaved] = useState(false);

  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("anotes_session") || "null"); } catch { return null; }
  });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  // Track whether we've done the initial page-load sync this session
  // Use a module-level flag so it survives tab switches (component remounts)
  const autoSyncTimer = useRef(null);

  // Auto-sync interval — only runs when autoSync is actually enabled
  useEffect(() => {
    if (autoSyncTimer.current) {
      clearInterval(autoSyncTimer.current);
      autoSyncTimer.current = null;
    }
    // Guard: don't start if disabled or not logged in
    if (!settings.autoSync || !session?.token) return;

    const url = getActiveUrl(settings);
    if (!url) return;

    const ms = (settings.autoSyncInterval || 5) * 60 * 1000;
    autoSyncTimer.current = setInterval(() => {
      const fresh = getFreshData();
      if (!fresh || !session?.token) return;
      apiSyncUpload(url, session.token, fresh)
        .then(r => setSyncStatus(r.success
          ? `✓ Auto-synced at ${new Date().toLocaleTimeString()}`
          : `✗ Auto-sync failed`))
        .catch(() => setSyncStatus("⚠ Auto-sync unreachable"));
    }, ms);

    return () => {
      if (autoSyncTimer.current) {
        clearInterval(autoSyncTimer.current);
        autoSyncTimer.current = null;
      }
    };
  }, [settings.autoSync, settings.autoSyncInterval, settings.serverMode, settings.serverUrl, session?.token]);

  const save = () => {
    const toSave = {
      ...s,
      serverMode: s.serverMode || "central",
      serverUrl: s.serverMode === "own" ? (s.serverUrl || "") : "https://loginapinote.arc360hub.com/",
    };
    updateSettings(toSave);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setTheme = (theme) => setS(p => ({ ...p, theme }));
  const setAccent = (accentColor) => setS(p => ({ ...p, accentColor }));
  const setFontSize = (fontSize) => setS(p => ({ ...p, fontSize }));

  // Reads from saved settings prop — not unsaved local s state
  function getActiveUrl(src = settings) {
    return (src.serverMode === "own" ? src.serverUrl : "https://loginapinote.arc360hub.com/") || "";
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    const url = (s.serverMode === "own" ? s.serverUrl?.trim() : "https://loginapinote.arc360hub.com/") || "";
    if (!url) return setAuthError("Enter a server URL first.");
    if (!authUsername.trim() || !authPassword.trim()) return setAuthError("Fill in all fields.");
    setAuthLoading(true); setAuthError("");
    try {
      const fn = authMode === "login" ? apiLogin : apiRegister;
      const result = await fn(url, authUsername.trim(), authPassword);
      if (result.success && result.session_token) {
        const sess = { token: result.session_token, username: result.username, expires: result.expires };
        setSession(sess);
        localStorage.setItem("anotes_session", JSON.stringify(sess));
        setShowAuth(false); setAuthUsername(""); setAuthPassword("");
      } else if (result.success && authMode === "register") {
        setAuthMode("login"); setAuthError("Account created! Now log in.");
      } else {
        setAuthError(result.error || "Authentication failed.");
      }
    } catch {
      setAuthError("Could not reach server. Check URL.");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    const url = getActiveUrl();
    if (session?.token && url) {
      try { await apiLogout(url, session.token); } catch {}
    }
    setSession(null);
    localStorage.removeItem("anotes_session");
    setSyncStatus("");
  };

  // Upload: read from localStorage directly — always the latest committed state
  const handleSyncUpload = async () => {
    const url = getActiveUrl();
    if (!session?.token || !url) { setSyncStatus("✗ Not logged in"); return; }
    const fresh = getFreshData();
    if (!fresh) { setSyncStatus("✗ No local data found"); return; }
    setSyncStatus("Uploading...");
    try {
      const result = await apiSyncUpload(url, session.token, fresh);
      setSyncStatus(result.success
        ? `✓ Uploaded at ${new Date().toLocaleTimeString()}`
        : `✗ ${result.error}`);
    } catch {
      setSyncStatus("⚠ Server unreachable, saving localy");
    }
  };

  // Download: replace app data with server data, preserve local settings
  const handleSyncDownload = async () => {
    const url = getActiveUrl();
    if (!session?.token || !url) { setSyncStatus("✗ Not logged in"); return; }
    setSyncStatus("Downloading...");
    try {
      const result = await apiSyncDownload(url, session.token);
      if (result.success && result.data) {
        // Merge: server data wins for workspaces, local wins for settings
        setData(prev => ({
          ...result.data,
          settings: { ...result.data.settings, ...prev.settings },
        }));
        setSyncStatus(`✓ Loaded at ${new Date().toLocaleTimeString()}`);
      } else {
        setSyncStatus(`✗ ${result.error || "No data found"}`);
      }
    } catch {
      setSyncStatus("⚠ Server unreachable — using local data");
    }
  };

  const ACCENT_PRESETS = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#F97316"];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
      <div style={{ maxWidth: 9000 }}>
        <h2 style={{ color: t.text, marginTop: 0, marginBottom: "28px", fontWeight: 700 }}>Settings</h2>

        <SettingSection title="Appearance">
          <SettingRow label="Theme">
            <div style={{ display: "flex", gap: "6px" }}>
              {["dark", "light", "midnight"].map(th => (
                <Chip key={th} label={th.charAt(0).toUpperCase() + th.slice(1)}
                  active={s.theme === th} onClick={() => setTheme(th)} />
              ))}
            </div>
          </SettingRow>
          <SettingRow label="Accent Color">
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {ACCENT_PRESETS.map(c => (
                <button key={c} onClick={() => setAccent(c)} style={{
                  width: 24, height: 24, borderRadius: "50%", background: c,
                  border: `3px solid ${s.accentColor === c ? t.text : "transparent"}`,
                  cursor: "pointer", transition: "border-color 0.15s",
                }} />
              ))}
              <input type="color" value={s.accentColor || "#EF4444"}
                onChange={e => setAccent(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "none", padding: 0 }} />
            </div>
          </SettingRow>
          <SettingRow label="Font Size">
            <div style={{ display: "flex", gap: "6px" }}>
              {["small", "medium", "large"].map(sz => (
                <Chip key={sz} label={sz} active={s.fontSize === sz} onClick={() => setFontSize(sz)} />
              ))}
            </div>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Notes Canvas">
          <SettingRow label={`Pan Speed — ${(s.notesDragSpeed || 1).toFixed(1)}×`}>
            <input type="range" min="0.2" max="3" step="0.1" value={s.notesDragSpeed || 1}
              onChange={e => setS(p => ({ ...p, notesDragSpeed: parseFloat(e.target.value) }))}
              style={{ width: 180, accentColor: t.accent }} />
          </SettingRow>
          <SettingRow label={`Zoom Speed — ${(s.notesZoomSpeed || 1).toFixed(1)}×`}>
            <input type="range" min="0.2" max="3" step="0.1" value={s.notesZoomSpeed || 1}
              onChange={e => setS(p => ({ ...p, notesZoomSpeed: parseFloat(e.target.value) }))}
              style={{ width: 180, accentColor: t.accent }} />
          </SettingRow>
        </SettingSection>

        <SettingSection title="Cloud Sync">
          <SettingRow label="Server">
            <div style={{ display: "flex", gap: "6px" }}>
              <Chip label="Central Server" active={s.serverMode !== "own"}
                onClick={() => setS(p => ({ ...p, serverMode: "central", serverUrl: "https://loginapinote.arc360hub.com/" }))} />
              <Chip label="My Own Server" active={s.serverMode === "own"}
                onClick={() => setS(p => ({
                  ...p, serverMode: "own",
                  serverUrl: p.serverUrl && p.serverUrl !== "https://loginapinote.arc360hub.com/" ? p.serverUrl : "",
                }))} />
            </div>
          </SettingRow>
          {s.serverMode === "own" && (
            <SettingRow label="Server URL">
              <Input
                value={s.serverUrl || ""}
                onChange={e => setS(p => ({ ...p, serverUrl: e.target.value }))}
                placeholder="http://192.168.x.x:2142"
                style={{ width: 240, fontSize: "0.8rem" }}
              />
            </SettingRow>
          )}

          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}` }}>
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Icon name="user" size={16} color={t.accent} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", color: t.text, fontWeight: 600 }}>{session.username}</div>
                  <div style={{ fontSize: "0.72rem", color: t.textSub }}>
                    Logged in · Session expires {new Date(session.expires).toLocaleDateString()}
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={handleLogout}>
                  <Icon name="logOut" size={13} color="#f87171" /> Logout
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon name="user" size={16} color={t.textSub} />
                <span style={{ flex: 1, fontSize: "0.85rem", color: t.textSub }}>Not logged in</span>
                <Button size="sm" onClick={() => { setShowAuth(true); setAuthMode("login"); }}>Login</Button>
                <Button size="sm" variant="primary" onClick={() => { setShowAuth(true); setAuthMode("register"); }}>Register</Button>
              </div>
            )}
          </div>

          {session && (
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Button size="sm" onClick={handleSyncUpload}>
                  <Icon name="upload" size={13} color={t.textSub} /> Upload to Server
                </Button>
                <Button size="sm" onClick={handleSyncDownload}>
                  <Icon name="download" size={13} color={t.textSub} /> Load from Server
                </Button>
                {syncStatus && (
                  <span style={{ fontSize: "0.75rem", color: syncStatus.startsWith("✓") ? "#4ade80" : "#f87171" }}>
                    {syncStatus}
                  </span>
                )}
              </div>
            </div>
          )}

          <SettingRow label="Auto Sync (uploads on interval)">
            <Chip
              label={s.autoSync ? "Enabled" : "Disabled"}
              active={s.autoSync}
              onClick={() => setS(p => ({ ...p, autoSync: !p.autoSync }))}
            />
          </SettingRow>
          {s.autoSync && (
            <SettingRow label={`Sync every — ${s.autoSyncInterval || 5} min`}>
              <input type="range" min="1" max="120" step="1" value={s.autoSyncInterval || 5}
                onChange={e => setS(p => ({ ...p, autoSyncInterval: parseInt(e.target.value) }))}
                style={{ width: 180, accentColor: t.accent }} />
            </SettingRow>
          )}
        </SettingSection>

        <SettingSection title="Old App">
          <SettingRow label="Still want to use the old app? Go here — syncing and any server contact will not work.">
            <Button onClick={() => window.open("https://anotesapp-web.vercel.app/", "_blank")}>
              Open Old App
            </Button>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Desktop App">
          <SettingRow label="Download the latest desktop build for your platform.">
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={async () => {
                const res = await fetch("https://api.github.com/repos/arc360alt/ANotesAppV3/releases/latest");
                const data = await res.json();
                const asset = data.assets?.find(a => a.name.endsWith(".exe"));
                if (asset) window.open(asset.browser_download_url, "_blank");
              }}>
                Windows
              </Button>
              <Button onClick={async () => {
                const res = await fetch("https://api.github.com/repos/arc360alt/ANotesAppV3/releases/latest");
                const data = await res.json();
                const asset = data.assets?.find(a => a.name.endsWith(".AppImage"));
                if (asset) window.open(asset.browser_download_url, "_blank");
              }}>
                Linux
              </Button>
              <Button onClick={async () => {
                const res = await fetch("https://api.github.com/repos/arc360alt/ANotesAppV3/releases/latest");
                const data = await res.json();
                const asset = data.assets?.find(a => a.name.endsWith(".dmg"));
                if (asset) window.open(asset.browser_download_url, "_blank");
              }}>
                macOS
              </Button>
            </div>
          </SettingRow>
        </SettingSection>

        <Button variant={saved ? "default" : "primary"} onClick={save}>
          {saved ? "✓ Saved!" : <><Icon name="check" size={14} color="white" /> Save Settings</>}
        </Button>
      </div>

      <Modal open={showAuth} onClose={() => { setShowAuth(false); setAuthError(""); }}
        title={authMode === "login" ? "Login" : "Create Account"} width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
            <Chip label="Login" active={authMode === "login"} onClick={() => { setAuthMode("login"); setAuthError(""); }} />
            <Chip label="Register" active={authMode === "register"} onClick={() => { setAuthMode("register"); setAuthError(""); }} />
          </div>
          <Input value={authUsername} onChange={e => setAuthUsername(e.target.value)} placeholder="Username" autoFocus />
          <Input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password"
            onKeyDown={e => { if (e.key === "Enter") handleAuth(); }} />
          {authError && (
            <div style={{ fontSize: "0.8rem", color: "#f87171", background: "#7f1d1d22", padding: "8px 12px", borderRadius: "6px" }}>
              {authError}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button onClick={() => setShowAuth(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAuth} disabled={authLoading}>
              {authLoading ? "..." : authMode === "login" ? "Login" : "Register"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}