// NoteCard.jsx - Individual draggable, resizable note card on the canvas

import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { MarkdownRenderer } from "../utils/markdown.jsx";
import { NOTE_COLORS } from "../utils/theme.js";

const MIN_W = 200;
const MIN_H = 120;

export function NoteCard({ note, isDragging, onMouseDown, onDelete, onEdit, onResize, onColorChange }) {
  const t = window.__theme;
  const [hovered, setHovered] = useState(false);

  const w = note.w || 280;
  const h = note.h || 200;

  const startResize = (e, dir) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = w;
    const startH = h;

    const onMove = (ev) => {
      const newW = dir.includes("e") ? Math.max(MIN_W, startW + (ev.clientX - startX)) : startW;
      const newH = dir.includes("s") ? Math.max(MIN_H, startH + (ev.clientY - startY)) : startH;
      onResize(newW, newH);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onMouseDown(e); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: note.x, top: note.y,
        width: w, minHeight: h,
        background: note.color || t.cardBg,
        border: `1px solid ${isDragging ? t.accent : hovered ? t.accent + "88" : t.border}`,
        borderRadius: "10px",
        boxShadow: isDragging ? "0 16px 48px rgba(0,0,0,0.55)" : "0 2px 12px rgba(0,0,0,0.2)",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        overflow: "hidden",
        transform: isDragging ? "scale(1.02) rotate(0.5deg)" : "scale(1)",
        transition: isDragging ? "none" : "box-shadow 0.15s, border-color 0.15s, transform 0.1s",
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px", borderBottom: `1px solid ${t.border}44`,
        background: `${t.surface}55`, minHeight: 36,
      }}>
        <span style={{
          fontWeight: 600, fontSize: "0.82rem", color: t.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
        }}>
          {note.title || "Untitled"}
        </span>

        <div style={{
          display: "flex", gap: "2px", alignItems: "center",
          opacity: hovered ? 1 : 0, transition: "opacity 0.12s",
          flexShrink: 0, marginLeft: "6px",
        }}>
          {NOTE_COLORS.map(c => (
            <button
              key={c}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => onColorChange(c)}
              style={{
                width: 12, height: 12, borderRadius: "50%", background: c,
                border: note.color === c ? `2px solid ${t.accent}` : `1px solid ${t.border}55`,
                cursor: "pointer", flexShrink: 0,
              }}
            />
          ))}
          <ActionBtn icon="maximize" title="Edit note" onMouseDown={e => e.stopPropagation()} onClick={onEdit} />
          <ActionBtn icon="x" title="Delete note" onMouseDown={e => e.stopPropagation()} onClick={onDelete} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px", color: t.text, overflowY: "auto", maxHeight: Math.max(h - 40, 80) }}>
        <MarkdownRenderer content={note.content || ""} />
      </div>

      {/* SE resize handle */}
      <div
        onMouseDown={e => startResize(e, "se")}
        style={{
          position: "absolute", bottom: 0, right: 0, width: 16, height: 16,
          cursor: "nwse-resize", opacity: hovered ? 0.6 : 0, transition: "opacity 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M8 2L2 8M5 2L2 5M8 5L5 8" stroke={t.textSub} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* E resize strip */}
      <div
        onMouseDown={e => startResize(e, "e")}
        style={{ position: "absolute", top: 0, right: 0, width: 6, height: "100%", cursor: "ew-resize", opacity: 0 }}
      />

      {/* S resize strip */}
      <div
        onMouseDown={e => startResize(e, "s")}
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 6, cursor: "ns-resize", opacity: 0 }}
      />
    </div>
  );
}

function ActionBtn({ icon, title, onClick, onMouseDown }) {
  const t = window.__theme;
  return (
    <button
      title={title}
      onMouseDown={onMouseDown}
      onClick={onClick}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
    >
      <Icon name={icon} size={14} color={t.textSub} />
    </button>
  );
}