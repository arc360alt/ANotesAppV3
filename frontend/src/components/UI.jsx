// UI.jsx - Reusable Material-Design-inspired primitives
// Button, Input, Modal, Chip, Section, SettingRow

import { Icon } from "./Icon.jsx";

export function Button({ children, onClick, variant = "default", size = "md", style = {}, disabled = false, title }) {
  const t = window.__theme;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    border: "none", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s", opacity: disabled ? 0.5 : 1,
    ...(size === "sm" ? { padding: "5px 12px", fontSize: "0.78rem" } :
       size === "xs" ? { padding: "3px 8px", fontSize: "0.72rem" } :
       { padding: "8px 16px", fontSize: "0.85rem" }),
  };
  const variants = {
    default: { background: t.surface3, color: t.text, border: `1px solid ${t.border}` },
    primary: { background: t.accent, color: t.accentText },
    ghost: { background: "transparent", color: t.textSub },
    danger: { background: "#7f1d1d33", color: "#f87171", border: "1px solid #7f1d1d55" },
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "none"; }}>
      {children}
    </button>
  );
}

export function Input({ value, onChange, placeholder, style = {}, onKeyDown, multiline = false, rows = 3, autoFocus, type = "text" }) {
  const t = window.__theme;
  const base = {
    background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px",
    color: t.text, padding: "8px 12px", fontSize: "0.85rem", fontFamily: "inherit",
    outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical",
    transition: "border-color 0.15s", ...style,
  };
  const focusStyle = e => (e.target.style.borderColor = window.__theme.accent);
  const blurStyle = e => (e.target.style.borderColor = window.__theme.border);

  if (multiline) {
    return <textarea value={value} onChange={onChange} placeholder={placeholder}
      rows={rows} autoFocus={autoFocus} onKeyDown={onKeyDown} style={base}
      onFocus={focusStyle} onBlur={blurStyle} />;
  }
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    autoFocus={autoFocus} onKeyDown={onKeyDown} style={base}
    onFocus={focusStyle} onBlur={blurStyle} />;
}

export function Modal({ open, onClose, title, children, width = 500 }) {
  const t = window.__theme;
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(3px)",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px",
        width, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
          position: "sticky", top: 0, background: t.surface, zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: "1rem", color: t.text, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub, padding: "4px" }}>
            <Icon name="x" size={18} color={t.textSub} />
          </button>
        </div>
        <div style={{ padding: "20px" }}>{children}</div>
      </div>
    </div>
  );
}

export function Chip({ label, active, onClick }) {
  const t = window.__theme;
  return (
    <button onClick={onClick} style={{
      background: active ? t.accent : t.surface2,
      color: active ? t.accentText : t.textSub,
      border: `1px solid ${active ? t.accent : t.border}`,
      borderRadius: "20px", padding: "4px 12px", fontSize: "0.78rem",
      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
    }}>{label}</button>
  );
}

export function SettingSection({ title, children }) {
  const t = window.__theme;
  return (
    <div style={{ marginBottom: "28px" }}>
      <h3 style={{ color: t.textSub, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>{title}</h3>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

export function SettingRow({ label, children }) {
  const t = window.__theme;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px", borderBottom: `1px solid ${t.border}`,
    }}>
      <span style={{ color: t.text, fontSize: "0.88rem", fontWeight: 500 }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function Divider() {
  const t = window.__theme;
  return <div style={{ height: 1, background: t.border, margin: "8px 0" }} />;
}
