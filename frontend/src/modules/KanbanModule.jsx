// KanbanModule.jsx - Drag-and-drop kanban board with multiple columns

import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Input } from "../components/UI.jsx";
import { uid } from "../utils/storage.js";
import { KANBAN_COL_COLORS } from "../utils/theme.js";

export function KanbanModule({ workspace, updateWorkspace }) {
  const t = window.__theme;
  const [addingCol, setAddingCol] = useState(false);
  const [colName, setColName] = useState("");
  const [addingCard, setAddingCard] = useState({}); // colId -> bool
  const [cardText, setCardText] = useState({});     // colId -> string
  const [editingCard, setEditingCard] = useState(null); // { colId, cardId }
  const [editCardText, setEditCardText] = useState("");
  const [dragState, setDragState] = useState(null);  // { cardId, fromColId }
  const [dragOver, setDragOver] = useState(null);    // { colId, index }

  const columns = workspace?.columns || [];

  const updateColumns = (cols) => updateWorkspace({ ...workspace, columns: cols });

  // ---- Column ops ----
  const addCol = () => {
    if (!colName.trim()) return;
    updateColumns([...columns, { id: uid(), title: colName.trim(), cards: [] }]);
    setColName(""); setAddingCol(false);
  };

  const deleteCol = (cid) => updateColumns(columns.filter(c => c.id !== cid));

  const renameCol = (cid, name) =>
    updateColumns(columns.map(c => c.id === cid ? { ...c, title: name } : c));

  // ---- Card ops ----
  const addCard = (colId) => {
    const text = cardText[colId];
    if (!text?.trim()) return;
    updateColumns(columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, { id: uid(), text: text.trim() }] } : c));
    setCardText(p => ({ ...p, [colId]: "" }));
    setAddingCard(p => ({ ...p, [colId]: false }));
  };

  const deleteCard = (colId, cardId) =>
    updateColumns(columns.map(c => c.id === colId ? { ...c, cards: c.cards.filter(k => k.id !== cardId) } : c));

  const saveEditCard = (colId, cardId) => {
    if (!editCardText.trim()) return;
    updateColumns(columns.map(c => c.id === colId ? {
      ...c, cards: c.cards.map(k => k.id === cardId ? { ...k, text: editCardText.trim() } : k),
    } : c));
    setEditingCard(null);
  };

  // ---- Drag-and-drop ----
  const handleDragStart = (e, cardId, colId) => {
    setDragState({ cardId, fromColId: colId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", cardId); // Required for Firefox
  };

  const handleDragOver = (e, colId, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver({ colId, index });
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    if (!dragState) return;
    const { cardId, fromColId } = dragState;

    // Find card
    const fromCol = columns.find(c => c.id === fromColId);
    const card = fromCol?.cards.find(k => k.id === cardId);
    if (!card) return;

    // Remove from source
    let newCols = columns.map(c =>
      c.id === fromColId ? { ...c, cards: c.cards.filter(k => k.id !== cardId) } : c
    );

    // Insert at target
    const insertIdx = dragOver?.colId === targetColId ? (dragOver?.index ?? 9999) : 9999;
    newCols = newCols.map(c => {
      if (c.id !== targetColId) return c;
      const cards = [...c.cards];
      cards.splice(Math.min(insertIdx, cards.length), 0, card);
      return { ...c, cards };
    });

    updateColumns(newCols);
    setDragState(null);
    setDragOver(null);
  };

  const handleDragEnd = () => { setDragState(null); setDragOver(null); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{
        height: 44, background: t.surface, borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: "12px", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, color: t.text }}>{workspace?.name}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: t.textSub, fontSize: "0.72rem" }}>Drag cards between columns</span>
        <Button size="sm" variant="primary" onClick={() => setAddingCol(true)}>
          <Icon name="plus" size={14} color="white" /> Add Column
        </Button>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>

        {columns.length === 0 && !addingCol && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: t.textSub, flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "3rem" }}>🗂️</div>
            <div style={{ fontSize: "1rem" }}>No columns yet</div>
            <div style={{ fontSize: "0.8rem" }}>Click "Add Column" to build your board</div>
          </div>
        )}

        {columns.map((col, colIdx) => (
          <KanbanColumn
            key={col.id}
            col={col}
            colIdx={colIdx}
            dragState={dragState}
            dragOver={dragOver}
            editingCard={editingCard}
            editCardText={editCardText}
            setEditCardText={setEditCardText}
            addingCard={addingCard}
            cardText={cardText}
            theme={t}
            onDeleteCol={() => deleteCol(col.id)}
            onRenameCol={(name) => renameCol(col.id, name)}
            onAddCard={() => addCard(col.id)}
            onDeleteCard={(cardId) => deleteCard(col.id, cardId)}
            onColorChange={(color) => updateWorkspace({ ...workspace, columns: workspace.columns.map(c => c.id === col.id ? { ...c, color } : c) })}
            onStartEditCard={(cardId, text) => { setEditingCard({ colId: col.id, cardId }); setEditCardText(text); }}
            onSaveEditCard={(cardId) => saveEditCard(col.id, cardId)}
            onCancelEdit={() => setEditingCard(null)}
            onSetCardText={(text) => setCardText(p => ({ ...p, [col.id]: text }))}
            onSetAddingCard={(v) => setAddingCard(p => ({ ...p, [col.id]: v }))}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Add column panel */}
        {addingCol ? (
          <div style={{
            width: 260, minWidth: 260, background: t.surface2,
            border: `1px solid ${t.border}`, borderRadius: "10px", padding: "14px", flexShrink: 0,
          }}>
            <Input value={colName} onChange={e => setColName(e.target.value)} placeholder="Column name..."
              autoFocus onKeyDown={e => { if (e.key === "Enter") addCol(); if (e.key === "Escape") setAddingCol(false); }}
              style={{ marginBottom: "10px" }} />
            <div style={{ display: "flex", gap: "6px" }}>
              <Button size="sm" variant="primary" onClick={addCol}>Add</Button>
              <Button size="sm" onClick={() => { setAddingCol(false); setColName(""); }}>Cancel</Button>
            </div>
          </div>
        ) : columns.length > 0 && (
          <button onClick={() => setAddingCol(true)} style={{
            width: 180, minWidth: 180, height: 50,
            background: `${t.surface2}88`, border: `2px dashed ${t.border}`,
            borderRadius: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", color: t.textSub,
            fontFamily: "inherit", fontSize: "0.82rem", cursor: "pointer", flexShrink: 0,
          }}>
            <Icon name="plus" size={15} color={t.textSub} /> Add Column
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  col, colIdx, dragState, dragOver, editingCard, editCardText, setEditCardText,
  addingCard, cardText, theme: t,
  onDeleteCol, onRenameCol, onAddCard, onDeleteCard,
  onStartEditCard, onSaveEditCard, onCancelEdit, onSetCardText, onSetAddingCard,
  onDragStart, onDragOver, onDrop, onDragEnd, onColorChange,
}) {
  const [renamingCol, setRenamingCol] = useState(false);
  const [colNameEdit, setColNameEdit] = useState(col.title);
  const colBg = KANBAN_COL_COLORS[colIdx % KANBAN_COL_COLORS.length];

  const commitRename = () => {
    onRenameCol(colNameEdit.trim() || col.title);
    setRenamingCol(false);
  };

  return (
    <div
      onDragOver={e => onDragOver(e, col.id, col.cards.length)}
      onDrop={e => onDrop(e, col.id)}
      style={{
        width: 260, minWidth: 260, background: col.color || colBg,
        border: `1px solid ${dragOver?.colId === col.id ? t.accent + "88" : t.border}`,
        borderRadius: "10px", flexShrink: 0, display: "flex",
        flexDirection: "column", maxHeight: "calc(100vh - 120px)",
        transition: "border-color 0.15s",
      }}>

      {/* Column header */}
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", borderBottom: `1px solid ${t.border}` }}>
              <input type="color" value={col.color || KANBAN_COL_COLORS[colIdx % KANBAN_COL_COLORS.length]}
        onChange={e => onColorChange(e.target.value)}
        title="Column color"
        style={{ width: 20, height: 20, borderRadius: "4px", border: "none", cursor: "pointer", padding: 0, background: "none", flexShrink: 0, marginRight: "6px" }} />
        {renamingCol ? (
          <input value={colNameEdit} onChange={e => setColNameEdit(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setColNameEdit(col.title); setRenamingCol(false); } }}
            onBlur={commitRename}
            style={{ flex: 1, background: t.surface2, border: `1px solid ${t.accent}`, borderRadius: "4px", color: t.text, padding: "2px 6px", fontFamily: "inherit", fontSize: "0.88rem" }} />
        ) : (
          <span style={{ flex: 1, fontWeight: 600, color: t.text, fontSize: "0.9rem", cursor: "text" }}
            onDoubleClick={() => { setRenamingCol(true); setColNameEdit(col.title); }}>
            {col.title}
          </span>
        )}
        <span style={{ fontSize: "0.7rem", color: t.textSub, background: t.surface3, padding: "2px 7px", borderRadius: "10px", marginLeft: "8px", flexShrink: 0 }}>
          {col.cards.length}
        </span>
        <button onClick={onDeleteCol} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "6px" }}>
          <Icon name="trash" size={13} color={t.textSub} />
        </button>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {col.cards.map((card, cardIdx) => (
          <div key={card.id}
            draggable
            onDragStart={e => onDragStart(e, card.id, col.id)}
            onDragOver={e => { e.preventDefault(); onDragOver(e, col.id, cardIdx); }}
            onDragEnd={onDragEnd}
            style={{
              background: t.cardBg,
              border: `1px solid ${dragOver?.colId === col.id && dragOver?.index === cardIdx ? t.accent : t.border}`,
              borderRadius: "8px", padding: "10px 12px",
              cursor: "grab", boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              opacity: dragState?.cardId === card.id ? 0.3 : 1,
              transition: "border-color 0.1s, opacity 0.1s",
            }}>
            {editingCard?.colId === col.id && editingCard?.cardId === card.id ? (
              <div>
                <textarea value={editCardText} onChange={e => setEditCardText(e.target.value)}
                  rows={3} autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) onSaveEditCard(card.id); if (e.key === "Escape") onCancelEdit(); }}
                  style={{
                    width: "100%", boxSizing: "border-box", background: t.surface2,
                    border: `1px solid ${t.accent}`, borderRadius: "4px",
                    color: t.text, fontFamily: "inherit", fontSize: "0.85rem", resize: "none",
                  }} />
                <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                  <Button size="xs" variant="primary" onClick={() => onSaveEditCard(card.id)}>Save</Button>
                  <Button size="xs" onClick={onCancelEdit}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "0.85rem", color: t.text, lineHeight: 1.5 }}>{card.text}</div>
                <div style={{ display: "flex", gap: "4px", marginTop: "8px", justifyContent: "flex-end", opacity: 0 }}
                  className="card-actions">
                  <button onClick={() => onStartEditCard(card.id, card.text)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Icon name="edit" size={12} color={t.textSub} />
                  </button>
                  <button onClick={() => onDeleteCard(card.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Icon name="trash" size={12} color={t.textSub} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Drop zone at end */}
        <div
          onDragOver={e => { e.preventDefault(); onDragOver(e, col.id, col.cards.length); }}
          style={{
            minHeight: 36, borderRadius: "6px",
            border: dragOver?.colId === col.id && dragOver?.index === col.cards.length
              ? `2px dashed ${t.accent}` : "2px dashed transparent",
            transition: "border-color 0.1s",
          }} />

        {/* Add card */}
        {addingCard[col.id] ? (
          <div>
            <textarea value={cardText[col.id] || ""}
              onChange={e => onSetCardText(e.target.value)}
              placeholder="Card text... (Ctrl+Enter to save)" rows={3} autoFocus
              onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) onAddCard(); if (e.key === "Escape") onSetAddingCard(false); }}
              style={{
                width: "100%", boxSizing: "border-box", background: t.surface2,
                border: `1px solid ${t.accent}`, borderRadius: "6px",
                color: t.text, fontFamily: "inherit", fontSize: "0.85rem", resize: "none",
              }} />
            <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
              <Button size="xs" variant="primary" onClick={onAddCard}>Add</Button>
              <Button size="xs" onClick={() => onSetAddingCard(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => onSetAddingCard(true)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: "6px",
            padding: "8px", border: `1px dashed ${t.border}`, borderRadius: "6px",
            background: "transparent", color: t.textSub,
            fontFamily: "inherit", fontSize: "0.78rem", cursor: "pointer",
          }}>
            <Icon name="plus" size={13} color={t.textSub} /> Add card
          </button>
        )}
      </div>
    </div>
  );
}
