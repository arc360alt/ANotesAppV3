// TodoModule.jsx - Full todo list module with multiple lists per workspace

import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Input } from "../components/UI.jsx";
import { uid } from "../utils/storage.js";

export function TodoModule({ workspace, updateWorkspace }) {
  const t = window.__theme;
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [expandedLists, setExpandedLists] = useState({});
  const [addingItem, setAddingItem] = useState({});
  const [newItemText, setNewItemText] = useState({});
  const [editingItem, setEditingItem] = useState(null); // { listId, itemId }
  const [editText, setEditText] = useState("");

  const lists = workspace?.lists || [];

  // ---- List operations ----
  const addList = () => {
    if (!newListName.trim()) return;
    const list = { id: uid(), name: newListName.trim(), items: [] };
    updateWorkspace({ ...workspace, lists: [...lists, list] });
    setExpandedLists(p => ({ ...p, [list.id]: true }));
    setNewListName("");
    setAddingList(false);
  };

  const deleteList = (lid) =>
    updateWorkspace({ ...workspace, lists: lists.filter(l => l.id !== lid) });

  const updateList = (updated) =>
    updateWorkspace({ ...workspace, lists: lists.map(l => l.id === updated.id ? updated : l) });

  // ---- Item operations ----
  const addItem = (listId) => {
    const text = newItemText[listId];
    if (!text?.trim()) return;
    const list = lists.find(l => l.id === listId);
    updateList({ ...list, items: [...list.items, { id: uid(), text: text.trim(), done: false }] });
    setNewItemText(p => ({ ...p, [listId]: "" }));
    setAddingItem(p => ({ ...p, [listId]: false }));
  };

  const toggleItem = (listId, itemId) => {
    const list = lists.find(l => l.id === listId);
    updateList({ ...list, items: list.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) });
  };

  const deleteItem = (listId, itemId) => {
    const list = lists.find(l => l.id === listId);
    updateList({ ...list, items: list.items.filter(i => i.id !== itemId) });
  };

  const saveEdit = (listId, itemId) => {
    if (!editText.trim()) return;
    const list = lists.find(l => l.id === listId);
    updateList({ ...list, items: list.items.map(i => i.id === itemId ? { ...i, text: editText.trim() } : i) });
    setEditingItem(null);
  };

  const toggleList = (lid) =>
    setExpandedLists(p => ({ ...p, [lid]: p[lid] === false ? true : false }));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
      <div style={{ maxWidth: 8000 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.4rem", color: t.text, fontWeight: 700 }}>{workspace?.name}</h2>
          {!addingList && (
            <Button variant="primary" size="sm" onClick={() => setAddingList(true)}>
              <Icon name="plus" size={14} color="white" /> New List
            </Button>
          )}
        </div>

        {/* New list form */}
        {addingList && (
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <Input value={newListName} onChange={e => setNewListName(e.target.value)}
              placeholder="List name..." autoFocus
              onKeyDown={e => { if (e.key === "Enter") addList(); if (e.key === "Escape") setAddingList(false); }}
              style={{ marginBottom: "10px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="primary" size="sm" onClick={addList}>Create</Button>
              <Button size="sm" onClick={() => { setAddingList(false); setNewListName(""); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {lists.length === 0 && (
          <div style={{ textAlign: "center", color: t.textSub, paddingTop: "80px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📋</div>
            <div style={{ fontSize: "1rem", marginBottom: "6px" }}>No lists yet</div>
            <div style={{ fontSize: "0.82rem" }}>Create one to get started!</div>
          </div>
        )}

        {/* Lists */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {lists.map(list => {
            const expanded = expandedLists[list.id] !== false;
            const done = list.items.filter(i => i.done).length;
            const total = list.items.length;

            return (
              <div key={list.id} style={{
                background: t.cardBg, border: `1px solid ${t.border}`,
                borderRadius: "10px", overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
                {/* List header */}
                <div style={{
                  display: "flex", alignItems: "center", padding: "12px 16px",
                  borderBottom: expanded ? `1px solid ${t.border}` : "none",
                  cursor: "pointer", userSelect: "none",
                }} onClick={() => toggleList(list.id)}>
                  <div style={{ transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.15s", marginRight: "8px" }}>
                    <Icon name="chevronDown" size={16} color={t.textSub} />
                  </div>
                  <span style={{ flex: 1, fontWeight: 600, color: t.text, fontSize: "0.95rem" }}>{list.name}</span>
                  {total > 0 && (
                    <span style={{ fontSize: "0.72rem", color: t.textSub, marginRight: "10px" }}>
                      {done}/{total}
                    </span>
                  )}
                  {done === total && total > 0 && (
                    <span style={{ fontSize: "0.68rem", color: "#4ade80", background: "#4ade8022", padding: "2px 8px", borderRadius: "10px", marginRight: "10px" }}>
                      ✓ Complete
                    </span>
                  )}
                  <button onClick={e => { e.stopPropagation(); deleteList(list.id); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Icon name="trash" size={14} color={t.textSub} />
                  </button>
                </div>

                {expanded && (
                  <div style={{ padding: "6px 0" }}>
                    {/* Items */}
                    {list.items.map(item => (
                      <TodoItem
                        key={item.id}
                        item={item}
                        isEditing={editingItem?.listId === list.id && editingItem?.itemId === item.id}
                        editText={editText}
                        setEditText={setEditText}
                        onToggle={() => toggleItem(list.id, item.id)}
                        onDelete={() => deleteItem(list.id, item.id)}
                        onStartEdit={() => { setEditingItem({ listId: list.id, itemId: item.id }); setEditText(item.text); }}
                        onSaveEdit={() => saveEdit(list.id, item.id)}
                        onCancelEdit={() => setEditingItem(null)}
                        theme={t}
                      />
                    ))}

                    {/* Add item */}
                    {addingItem[list.id] ? (
                      <div style={{ padding: "6px 16px" }}>
                        <input value={newItemText[list.id] || ""}
                          onChange={e => setNewItemText(p => ({ ...p, [list.id]: e.target.value }))}
                          placeholder="Item text..."
                          onKeyDown={e => { if (e.key === "Enter") addItem(list.id); if (e.key === "Escape") setAddingItem(p => ({ ...p, [list.id]: false })); }}
                          autoFocus style={{
                            width: "100%", boxSizing: "border-box", background: t.surface2,
                            border: `1px solid ${t.accent}`, borderRadius: "6px",
                            color: t.text, padding: "6px 10px", fontFamily: "inherit", fontSize: "0.85rem",
                          }} />
                      </div>
                    ) : (
                      <button onClick={() => setAddingItem(p => ({ ...p, [list.id]: true }))} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "8px",
                        padding: "8px 16px", border: "none", background: "transparent",
                        color: t.textSub, fontFamily: "inherit", fontSize: "0.8rem", cursor: "pointer",
                      }}>
                        <Icon name="plus" size={14} color={t.textSub} /> Add item
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TodoItem({ item, isEditing, editText, setEditText, onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit, theme: t }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "7px 16px", transition: "background 0.1s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = t.surface2)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {/* Checkbox */}
      <button onClick={onToggle} style={{
        width: 18, height: 18, marginTop: 2, borderRadius: "4px", flexShrink: 0,
        border: `2px solid ${item.done ? t.accent : t.border}`,
        background: item.done ? t.accent : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {item.done && <Icon name="check" size={10} color="white" />}
      </button>

      {/* Text / edit field */}
      {isEditing ? (
        <input value={editText} onChange={e => setEditText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
          autoFocus style={{
            flex: 1, background: t.surface2, border: `1px solid ${t.accent}`,
            borderRadius: "4px", color: t.text, padding: "2px 6px",
            fontFamily: "inherit", fontSize: "0.85rem",
          }} />
      ) : (
        <span style={{
          flex: 1, fontSize: "0.88rem", color: item.done ? t.textSub : t.text,
          textDecoration: item.done ? "line-through" : "none", lineHeight: 1.5,
        }}>{item.text}</span>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}
        className="todo-item-actions">
        <button onClick={onStartEdit} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}>
          <Icon name="edit" size={13} color={t.textSub} />
        </button>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: t.textSub }}>
          <Icon name="trash" size={13} color={t.textSub} />
        </button>
      </div>
    </div>
  );
}
