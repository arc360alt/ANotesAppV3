// useWorkspace.js - Custom hook for workspace selection and update logic
import { useState, useCallback } from "react";

export function useWorkspace(data, setData) {
  const [activeIds, setActiveIds] = useState({ todo: null, notes: null, kanban: null });

  const wsKeyFor = (tab) =>
    tab === "todo" ? "todoWorkspaces" :
    tab === "notes" ? "notesWorkspaces" :
    tab === "kanban" ? "kanbanWorkspaces" : null;

  const getCurrentWs = useCallback((tab) => {
    const key = wsKeyFor(tab);
    if (!key) return null;
    const list = data[key] || [];
    const id = activeIds[tab] || list[0]?.id;
    return list.find(w => w.id === id) || list[0] || null;
  }, [data, activeIds]);

  const setCurrentWsId = useCallback((tab, id) => {
    setActiveIds(prev => ({ ...prev, [tab]: id }));
  }, []);

  // CRITICAL: use functional setData(prev => ...) so we always merge into
  // the latest data, never a stale closure snapshot
  const updateWorkspace = useCallback((tab, updated) => {
    const key = wsKeyFor(tab);
    if (!key) return;
    setData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map(w => w.id === updated.id ? updated : w),
    }));
  }, [setData]);

  const getCurrentWsId = useCallback((tab) => {
    const key = wsKeyFor(tab);
    if (!key) return null;
    const list = data[key] || [];
    return activeIds[tab] || list[0]?.id || null;
  }, [data, activeIds]);

  return { getCurrentWs, setCurrentWsId, getCurrentWsId, updateWorkspace };
}