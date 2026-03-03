// NotesModule.jsx - Infinite canvas with draggable, resizable notes

import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Modal, Chip, Input } from "../components/UI.jsx";
import { NoteCard } from "./NoteCard.jsx";
import { uid } from "../utils/storage.js";
import { MarkdownRenderer } from "../utils/markdown.jsx";

export function NotesModule({ workspace, updateWorkspace, settings }) {
  const t = window.__theme;
  const canvasRef = useRef();

  // View — ref for imperative updates, state for renders
  const viewRef = useRef({ x: workspace?.viewX || 0, y: workspace?.viewY || 0, zoom: workspace?.zoom || 1 });
  const [view, setView] = useState(viewRef.current);

  // All drag/pan state in refs — zero re-renders during motion
  const draggingIdRef = useRef(null);
  const dragOffsetRef = useRef(null);
  const dragNotesRef = useRef(null);   // mutable working copy during drag
  const isPanningRef = useRef(false);
  const panLastRef = useRef(null);
  const workspaceRef = useRef(workspace); // always-fresh workspace ref

  // Keep workspaceRef current on every render — this is the key fix
  workspaceRef.current = workspace;

  // Tick just to re-render cards during drag so positions update visually
  const [dragTick, setDragTick] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  const [editModal, setEditModal] = useState(null);
  const [newNoteModal, setNewNoteModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImages, setNewImages] = useState([]);
  const newImgRef = useRef();

  const notes = workspace?.notes || [];
  const dragSpeed = settings?.notesDragSpeed ?? 1;
  const zoomSpeed = settings?.notesZoomSpeed ?? 1;

  // Sync view when switching workspaces
  useEffect(() => {
    const v = { x: workspace?.viewX || 0, y: workspace?.viewY || 0, zoom: workspace?.zoom || 1 };
    viewRef.current = v;
    setView(v);
  }, [workspace?.id]);

  // ── Wheel ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const prev = viewRef.current;
      let v;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.15, Math.min(4, prev.zoom * Math.pow(factor, zoomSpeed)));
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        v = {
          x: mx - (mx - prev.x) * (newZoom / prev.zoom),
          y: my - (my - prev.y) * (newZoom / prev.zoom),
          zoom: newZoom,
        };
      } else {
        v = { ...prev, x: prev.x - e.deltaX * dragSpeed, y: prev.y - e.deltaY * dragSpeed };
      }
      viewRef.current = v;
      setView(v);
      const ws = workspaceRef.current;
      updateWorkspace({ ...ws, viewX: v.x, viewY: v.y, zoom: v.zoom, notes: ws.notes });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [dragSpeed, zoomSpeed, updateWorkspace]);

  // ── Note drag start ────────────────────────────────────────────────────────
  const startNoteDrag = useCallback((e, id) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const ws = workspaceRef.current;
    const note = ws.notes.find(n => n.id === id);
    if (!note) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const v = viewRef.current;
    dragOffsetRef.current = {
      x: (e.clientX - rect.left - v.x) / v.zoom - note.x,
      y: (e.clientY - rect.top  - v.y) / v.zoom - note.y,
    };
    dragNotesRef.current = ws.notes.map(n => ({ ...n }));
    draggingIdRef.current = id;
    setDragTick(t => t + 1);
  }, []);

  // ── Pan start ──────────────────────────────────────────────────────────────
  const startPan = useCallback((e) => {
    if (e.button !== 0) return;
    if (draggingIdRef.current) return;
    isPanningRef.current = true;
    setIsPanning(true);
    panLastRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // ── Mouse move ─────────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e) => {
    if (draggingIdRef.current && dragNotesRef.current) {
      const id = draggingIdRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const v = viewRef.current;
      const newX = (e.clientX - rect.left - v.x) / v.zoom - dragOffsetRef.current.x;
      const newY = (e.clientY - rect.top  - v.y) / v.zoom - dragOffsetRef.current.y;
      const note = dragNotesRef.current.find(n => n.id === id);
      if (note) { note.x = newX; note.y = newY; }
      setDragTick(t => t + 1);
    } else if (isPanningRef.current && panLastRef.current) {
      const dx = (e.clientX - panLastRef.current.x) * dragSpeed;
      const dy = (e.clientY - panLastRef.current.y) * dragSpeed;
      panLastRef.current = { x: e.clientX, y: e.clientY };
      const newView = { ...viewRef.current, x: viewRef.current.x + dx, y: viewRef.current.y + dy };
      viewRef.current = newView;
      setView(newView);
    }
  }, [dragSpeed]);

  // ── Commit drag/pan — always reads from workspaceRef, never stale ──────────
  const commitDragOrPan = useCallback(() => {
    const ws = workspaceRef.current;
    const v = viewRef.current;
    if (draggingIdRef.current && dragNotesRef.current) {
      updateWorkspace({ ...ws, viewX: v.x, viewY: v.y, zoom: v.zoom, notes: dragNotesRef.current });
    } else if (isPanningRef.current) {
      updateWorkspace({ ...ws, viewX: v.x, viewY: v.y, zoom: v.zoom, notes: ws.notes });
    }
    draggingIdRef.current = null;
    dragNotesRef.current = null;
    dragOffsetRef.current = null;
    isPanningRef.current = false;
    setIsPanning(false);
    panLastRef.current = null;
  }, [updateWorkspace]);

  // onMouseLeave: only cancel pan — don't interrupt a drag or resize
  const onMouseLeave = useCallback(() => {
    if (isPanningRef.current) commitDragOrPan();
  }, [commitDragOrPan]);

  // ── Display notes: live positions from working copy while dragging ─────────
  const displayNotes = (draggingIdRef.current && dragNotesRef.current)
    ? dragNotesRef.current
    : notes;

  // ── CRUD — all use workspaceRef so they're never stale ────────────────────
  const updateNote = useCallback((updated) => {
    const ws = workspaceRef.current;
    updateWorkspace({ ...ws, notes: ws.notes.map(n => n.id === updated.id ? updated : n) });
  }, [updateWorkspace]);

  const deleteNote = useCallback((id) => {
    const ws = workspaceRef.current;
    updateWorkspace({ ...ws, notes: ws.notes.filter(n => n.id !== id) });
  }, [updateWorkspace]);

  const resizeNote = useCallback((id, w, h) => {
    const ws = workspaceRef.current;
    updateWorkspace({ ...ws, notes: ws.notes.map(n => n.id === id ? { ...n, w, h } : n) });
  }, [updateWorkspace]);

  const commitView = useCallback((v) => {
    viewRef.current = v;
    setView(v);
    const ws = workspaceRef.current;
    updateWorkspace({ ...ws, viewX: v.x, viewY: v.y, zoom: v.zoom, notes: ws.notes });
  }, [updateWorkspace]);

  // ── New note ───────────────────────────────────────────────────────────────
  const handleNewNoteImages = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setNewImages(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const createNote = () => {
    if (!newTitle.trim() && !newContent.trim() && newImages.length === 0) return;
    const imgMd = newImages.map(src => `\n\n![](${src})`).join("");
    const note = {
      id: uid(),
      title: newTitle.trim() || "Untitled",
      content: newContent.trim() + imgMd,
      x: Math.max(40, (-viewRef.current.x / viewRef.current.zoom) + 40),
      y: Math.max(40, (-viewRef.current.y / viewRef.current.zoom) + 40),
      w: 300, h: 220,
      color: null,
    };
    const ws = workspaceRef.current;
    updateWorkspace({ ...ws, notes: [...ws.notes, note] });
    setNewTitle(""); setNewContent(""); setNewImages([]);
    setNewNoteModal(false);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{
        height: 44, background: t.surface, borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: "10px", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, color: t.text, fontSize: "0.9rem" }}>{workspace?.name}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: t.textSub, fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon name="note" size={12} color={t.textSub} /> {notes.length} notes
          &nbsp;·&nbsp; Alt+Scroll to zoom · Drag canvas to pan
        </span>
        <span style={{ color: t.textSub, fontSize: "0.72rem", background: t.surface2, padding: "2px 8px", borderRadius: "4px" }}>
          {Math.round(view.zoom * 100)}%
        </span>
        <Button size="sm" onClick={() => commitView({ x: 0, y: 0, zoom: 1 })}>Reset</Button>
        <Button size="sm" variant="primary" onClick={() => setNewNoteModal(true)}>
          <Icon name="plus" size={14} color="white" /> New Note
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          flex: 1, position: "relative", overflow: "hidden",
          background: `radial-gradient(circle, ${t.border}55 1px, transparent 1px)`,
          backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
          backgroundPosition: `${view.x % (20 * view.zoom)}px ${view.y % (20 * view.zoom)}px`,
          cursor: isPanning ? "grabbing" : "grab",
        }}
        onMouseDown={startPan}
        onMouseMove={onMouseMove}
        onMouseUp={commitDragOrPan}
        onMouseLeave={onMouseLeave}
      >
        <div style={{
          position: "absolute",
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: "0 0",
          width: 5000, height: 5000,
        }}>
          {displayNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              isDragging={draggingIdRef.current === note.id}
              onMouseDown={e => startNoteDrag(e, note.id)}
              onDelete={() => deleteNote(note.id)}
              onEdit={() => {
                const fresh = workspaceRef.current.notes.find(n => n.id === note.id);
                setEditModal({ ...fresh });
              }}
              onResize={(w, h) => resizeNote(note.id, w, h)}
              onColorChange={color => updateNote({ ...note, color })}
            />
          ))}
        </div>

        {notes.length === 0 && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            textAlign: "center", color: t.textSub, pointerEvents: "none",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📝</div>
            <div style={{ fontSize: "1rem", marginBottom: "6px" }}>Empty canvas</div>
            <div style={{ fontSize: "0.8rem" }}>Click "New Note" to add your first note</div>
          </div>
        )}
      </div>

      {/* New Note Modal */}
      <Modal
        open={newNoteModal}
        onClose={() => { setNewNoteModal(false); setNewTitle(""); setNewContent(""); setNewImages([]); }}
        title="Create Note"
        width={560}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title..." autoFocus />
          <Input value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Content — supports **Markdown**..." multiline rows={10} />
          <div>
            <button onClick={() => newImgRef.current.click()} style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: t.surface2, border: `1px dashed ${t.border}`,
              borderRadius: "6px", padding: "8px 14px", color: t.textSub,
              fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
            }}>
              <Icon name="image" size={14} color={t.textSub} /> Attach images
            </button>
            <input ref={newImgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleNewNoteImages} />
            {newImages.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {newImages.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "6px", border: `1px solid ${t.border}` }} />
                    <button onClick={() => setNewImages(p => p.filter((_, j) => j !== i))} style={{
                      position: "absolute", top: -6, right: -6, width: 16, height: 16,
                      background: t.accent, border: "none", borderRadius: "50%",
                      color: "white", fontSize: "0.6rem", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button onClick={() => { setNewNoteModal(false); setNewTitle(""); setNewContent(""); setNewImages([]); }}>Cancel</Button>
            <Button variant="primary" onClick={createNote}>Create Note</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editModal && (
        <NoteEditModal
          note={editModal}
          onClose={() => setEditModal(null)}
          onSave={updated => { updateNote(updated); setEditModal(null); }}
          theme={t}
        />
      )}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function NoteEditModal({ note, onClose, onSave, theme: t }) {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [preview, setPreview] = useState(false);
  const contentRef = useRef();
  const imgRef = useRef();

  const insertAtCursor = (text) => {
    const ta = contentRef.current;
    if (!ta) { setContent(prev => prev + text); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = content.slice(0, start) + text + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
    });
  };

  const handleImages = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => insertAtCursor(`\n\n![](${ev.target.result})\n`);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <Modal open onClose={onClose} title={`Edit: ${note.title || "Untitled"}`} width={700}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
        <div style={{ display: "flex", gap: "8px" }}>
          <Chip label="Edit" active={!preview} onClick={() => setPreview(false)} />
          <Chip label="Preview" active={preview} onClick={() => setPreview(true)} />
        </div>

        {preview ? (
          <div style={{
            background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "8px",
            padding: "16px", minHeight: 280, color: t.text, overflowY: "auto",
          }}>
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <textarea
            ref={contentRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Markdown content... use the button below to insert images"
            rows={14}
            style={{
              background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px",
              color: t.text, padding: "8px 12px", fontSize: "0.85rem", fontFamily: "inherit",
              outline: "none", width: "100%", boxSizing: "border-box", resize: "vertical",
            }}
          />
        )}

        <div>
          <button onClick={() => imgRef.current.click()} style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: t.surface2, border: `1px dashed ${t.border}`,
            borderRadius: "6px", padding: "7px 14px", color: t.textSub,
            fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
          }}>
            <Icon name="image" size={14} color={t.textSub} /> Insert image at cursor
          </button>
          <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImages} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave({ ...note, title, content })}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}