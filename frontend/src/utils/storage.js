// storage.js - localStorage persistence and default data

export const STORAGE_KEY = "anotes_app_data_v2";

let _id = Date.now();
export const uid = () => `id_${++_id}_${Math.random().toString(36).slice(2, 7)}`;

export function defaultData() {
  return {
    settings: {
      theme: "dark",
      accentColor: "#EF4444",
      notesDragSpeed: 1,
      notesZoomSpeed: 1,
      fontSize: "medium",
      serverMode: "central",
      serverUrl: "https://loginapinote.arc360hub.com/",
    },
    todoWorkspaces: [
      {
        id: "tw_default",
        name: "My Tasks",
        lists: [],
      },
    ],
    notesWorkspaces: [
      {
        id: "nw_default",
        name: "My Notes",
        notes: [],
        viewX: 0,
        viewY: 0,
        zoom: 1,
      },
    ],
    kanbanWorkspaces: [
      {
        id: "kw_default",
        name: "My Board",
        columns: [],
      },
    ],
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    // Deep merge with defaults to fill missing keys
    const def = defaultData();
    return {
      settings: { ...def.settings, ...parsed.settings },
      todoWorkspaces: parsed.todoWorkspaces ?? def.todoWorkspaces,
      notesWorkspaces: parsed.notesWorkspaces ?? def.notesWorkspaces,
      kanbanWorkspaces: parsed.kanbanWorkspaces ?? def.kanbanWorkspaces,
    };
  } catch {
    return defaultData();
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data:", e);
  }
}
