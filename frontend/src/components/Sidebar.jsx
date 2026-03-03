// Sidebar.jsx - Left navigation + workspace management + export/import

import { useState, useRef } from "react";
import { Icon } from "./Icon.jsx";
import { Input, Button } from "./UI.jsx";
import { uid, defaultData } from "../utils/storage.js";

const NAV_ITEMS = [
  { id: "todo",     label: "ToDo Lists", icon: "list"     },
  { id: "notes",    label: "Notes",      icon: "note"     },
  { id: "kanban",   label: "Kanban",     icon: "kanban"   },
  { id: "settings", label: "Settings",   icon: "settings" },
];

export function Sidebar({ tab, setTab, data, setData, currentWsId, setCurrentWsId }) {
  const t = window.__theme;
  const [addingWs, setAddingWs] = useState(false);
  const [wsName, setWsName] = useState("");

  const wsKey =
    tab === "todo" ? "todoWorkspaces" :
    tab === "notes" ? "notesWorkspaces" :
    tab === "kanban" ? "kanbanWorkspaces" : null;

  const workspaces = wsKey ? (data[wsKey] || []) : [];

  const addWorkspace = () => {
    if (!wsName.trim() || !wsKey) return;
    const base = { id: uid(), name: wsName.trim() };
    const newWs =
      tab === "todo"   ? { ...base, lists: [] } :
      tab === "notes"  ? { ...base, notes: [], viewX: 0, viewY: 0, zoom: 1 } :
      tab === "kanban" ? { ...base, columns: [] } : base;

    const updated = { ...data, [wsKey]: [...workspaces, newWs] };
    setData(updated);
    setCurrentWsId(tab, newWs.id);
    setWsName("");
    setAddingWs(false);
  };

  const deleteWorkspace = (id) => {
    if (workspaces.length <= 1) return;
    const remaining = workspaces.filter(w => w.id !== id);
    setData({ ...data, [wsKey]: remaining });
    if (currentWsId === id) setCurrentWsId(tab, remaining[0]?.id);
  };

  const renameWorkspace = (id, newName) => {
    if (!newName.trim()) return;
    setData({ ...data, [wsKey]: workspaces.map(w => w.id === id ? { ...w, name: newName.trim() } : w) });
  };

  return (
    <div style={{
      width: 200, minWidth: 200, background: t.sidebarBg,
      borderRight: `1px solid ${t.border}`, display: "flex",
      flexDirection: "column", height: "100vh", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 16px 10px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ color: t.accent, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.3px" }}>
          A Notes App
        </div>
        <div style={{ color: t.textSub, fontSize: "0.65rem", marginTop: "2px" }}>v3.0 - Xenon</div>
      </div>

      {/* Nav */}
      <div style={{ padding: "8px 8px 4px" }}>
        {NAV_ITEMS.map(item => (
          <NavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
        ))}
      </div>

      {/* Workspace List */}
      {wsKey && (
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: t.textSub, padding: "6px 10px 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Workspaces
          </div>

          {workspaces.map(ws => (
            <WorkspaceItem
              key={ws.id}
              ws={ws}
              active={currentWsId === ws.id}
              canDelete={workspaces.length > 1}
              onClick={() => setCurrentWsId(tab, ws.id)}
              onDelete={() => deleteWorkspace(ws.id)}
              onRename={(name) => renameWorkspace(ws.id, name)}
            />
          ))}

          {addingWs ? (
            <div style={{ padding: "4px" }}>
              <Input value={wsName} onChange={e => setWsName(e.target.value)}
                placeholder="Name..." autoFocus
                onKeyDown={e => { if (e.key === "Enter") addWorkspace(); if (e.key === "Escape") setAddingWs(false); }}
                style={{ marginBottom: "6px", fontSize: "0.8rem" }} />
              <div style={{ display: "flex", gap: "4px" }}>
                <Button size="xs" variant="primary" onClick={addWorkspace}>Add</Button>
                <Button size="xs" onClick={() => { setAddingWs(false); setWsName(""); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingWs(true)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 10px", borderRadius: "6px", border: `1px dashed ${t.border}`,
              background: "transparent", color: t.textSub, fontFamily: "inherit",
              fontSize: "0.78rem", cursor: "pointer", marginTop: "4px",
            }}>
              <Icon name="plus" size={12} color={t.textSub} /> Add New
            </button>
          )}
        </div>
      )}

      {/* Bottom: Export/Import */}
      <div style={{ padding: "8px", borderTop: `1px solid ${t.border}` }}>
        <ExportImport data={data} setData={setData} />
      </div>
    </div>
  );
}

function NavButton({ item, active, onClick }) {
  const t = window.__theme;
  return (
    <button onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", gap: "10px",
      padding: "8px 10px", borderRadius: "8px", border: "none",
      background: active ? `${t.accent}22` : "transparent",
      color: active ? t.accent : t.textSub,
      fontFamily: "inherit", fontSize: "0.83rem", fontWeight: active ? 600 : 400,
      cursor: "pointer", transition: "all 0.12s", textAlign: "left",
    }}>
      <Icon name={item.icon} size={16} color={active ? t.accent : t.textSub} />
      {item.label}
    </button>
  );
}

function WorkspaceItem({ ws, active, canDelete, onClick, onDelete, onRename }) {
  const t = window.__theme;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(ws.name);

  const commitRename = () => {
    onRename(name);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div style={{ padding: "3px 4px", marginBottom: "2px" }}>
        <input value={name} onChange={e => setName(e.target.value)} autoFocus
          onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setName(ws.name); setRenaming(false); } }}
          onBlur={commitRename}
          style={{
            width: "100%", boxSizing: "border-box", background: t.surface2,
            border: `1px solid ${t.accent}`, borderRadius: "5px",
            color: t.text, padding: "4px 8px", fontSize: "0.8rem", fontFamily: "inherit",
          }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "2px" }}
      onDoubleClick={() => setRenaming(true)}>
      <button onClick={onClick} style={{
        flex: 1, textAlign: "left", padding: "6px 10px", borderRadius: "6px", border: "none",
        background: active ? `${t.accent}33` : "transparent",
        color: active ? t.accent : t.text,
        fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontWeight: active ? 600 : 400,
      }}>{ws.name}</button>
      {canDelete && (
        <button onClick={onDelete} style={{
          background: "none", border: "none", cursor: "pointer",
          color: t.textSub, padding: "2px", opacity: 0.4, flexShrink: 0,
        }}>
          <Icon name="x" size={11} color={t.textSub} />
        </button>
      )}
    </div>
  );
}

function ExportImport({ data, setData }) {
  const t = window.__theme;
  const fileRef = useRef();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anotes_${new Date().toISOString().slice(0, 10)}.ana`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData({ ...defaultData(), ...parsed });
      } catch {
        alert("Invalid .ana file — could not import.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const btn = (onClick, icon, label) => (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
      padding: "7px 6px", borderRadius: "6px", border: `1px solid ${t.border}`,
      background: t.surface2, color: t.textSub, fontFamily: "inherit",
      fontSize: "0.72rem", cursor: "pointer",
    }}>
      <Icon name={icon} size={12} color={t.textSub} /> {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {btn(exportData, "download", "Export")}
      {btn(() => fileRef.current.click(), "upload", "Import")}
      <input ref={fileRef} type="file" accept=".ana,.json" style={{ display: "none" }} onChange={importData} />
    </div>
  );
}
