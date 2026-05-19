import { useCallback } from 'react';
import { useFamilyState, useFamilyDispatch } from '../store/FamilyContext.jsx';
import { fetchFamilyData, clearServerCache } from '../services/api.js';

const HISTORY_KEY = 'arvoregenealogica_recent_sheets_v1';
const MAX_HISTORY = 10;

function saveToHistory(id, gid, label) {
  try {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history = history.filter(h => h.id !== id || h.gid !== gid);
    history.unshift({ id, gid, label: label || 'Família', t: Date.now() });
    history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getAllNamesFromHistory() {
  const names = new Set();
  getHistory().forEach(h => {
    try {
      const csvKey = `arvoregenealogica_sheet_csv_v2_${h.id}_${h.gid}`;
      const text = localStorage.getItem(csvKey);
      if (!text) return;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      const header = lines[0].split(',');
      const nameIdx = header.findIndex(col => col.includes('Nome'));
      if (nameIdx === -1) return;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts[nameIdx]) {
          const n = parts[nameIdx].replace(/^"|"$/g, '').trim();
          if (n) names.add(n);
        }
      }
    } catch {}
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function useFamilyData() {
  const state = useFamilyState();
  const dispatch = useFamilyDispatch();

  const load = useCallback(async ({ id, gid, force = false, focusId, branchKey } = {}) => {
    const sheetId = id || state.sheetId;
    const sheetGid = gid || state.sheetGid;
    const identity = focusId !== undefined ? focusId : state.selectedIdentity;
    const unified = !!identity;

    dispatch({ type: 'SET_LOADING', value: true });
    try {
      const data = await fetchFamilyData({ id: sheetId, gid: sheetGid, force, focusId: identity, branchKey, unified });
      dispatch({ type: 'SET_DATA', ...data, fromCache: data.fromCache ?? false, savedAt: data.savedAt ?? Date.now() });
      if (!unified) saveToHistory(sheetId, sheetGid, data.familyCtx?.familyLabel);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', message: err.message });
    }
  }, [state.sheetId, state.sheetGid, state.selectedIdentity, dispatch]);

  const refresh = useCallback(async () => {
    await clearServerCache(state.sheetId, state.sheetGid);
    await load({ force: true });
  }, [load, state.sheetId, state.sheetGid]);

  const setSheet = useCallback((id, gid) => {
    dispatch({ type: 'SET_SHEET', id, gid });
  }, [dispatch]);

  const setIdentity = useCallback((name) => {
    dispatch({ type: 'SET_IDENTITY', name });
  }, [dispatch]);

  const setBranchFocus = useCallback((key) => {
    dispatch({ type: 'SET_BRANCH_FOCUS', key });
  }, [dispatch]);

  const exitUnified = useCallback(() => {
    dispatch({ type: 'EXIT_UNIFIED' });
  }, [dispatch]);

  return { ...state, load, refresh, setSheet, setIdentity, setBranchFocus, exitUnified };
}
