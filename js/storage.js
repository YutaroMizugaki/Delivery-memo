import { RECORD_FIELDS, SHARED_KEY, STORAGE_KEY } from './config.js';
import { seedData } from './seed.js';
import { setRecords, state } from './state.js';
import { normalize } from './search.js';
import { showToast } from './toast.js';
import { $ } from './utils.js';

let memoryStore = null;

const storage = {
  async get(key) {
    try {
      if (window.storage) return await window.storage.get(key);
    } catch {
      // fall through
    }
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      // fall through
    }
    return memoryStore?.[key] ?? null;
  },

  async set(key, value) {
    try {
      if (window.storage) {
        await window.storage.set(key, value);
        return true;
      }
    } catch {
      // fall through
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      // fall through
    }
    memoryStore = memoryStore || {};
    memoryStore[key] = value;
    return false;
  },
};

function storageKey() {
  return $('shared').checked ? `${STORAGE_KEY}-shared` : STORAGE_KEY;
}

async function loadData() {
  return storage.get(storageKey());
}

export async function persist(records) {
  await storage.set(storageKey(), records);
  setRecords(records);
}

export async function upsertRecord(record) {
  const latest = (await loadData()) || state.records;
  const index = latest.findIndex((item) => item.id === record.id);
  if (index >= 0) latest[index] = record;
  else latest.push(record);
  await persist(latest);
}

export async function removeRecord(id) {
  const latest = (await loadData()) || state.records;
  await persist(latest.filter((item) => item.id !== id));
}

export function sanitizeRecords(records) {
  const seen = new Set();

  return records.map((raw, index) => {
    const record = {};
    RECORD_FIELDS.forEach((key) => {
      if (['permit', 'cash', 'hoursDiffers', 'cartDiffers'].includes(key)) {
        record[key] = !!raw[key];
      } else if (key === 'procReq') {
        record[key] = ['required', 'notRequired', 'conditional'].includes(raw[key]) ? raw[key] : 'required';
      } else if (key === 'updatedAt') {
        record[key] = raw[key] ? String(raw[key]) : '';
      } else {
        record[key] = String(raw[key] ?? '');
      }
    });

    if (!record.name) record.name = '名称未設定';
    if (!record.id || seen.has(record.id)) record.id = `imp-${Date.now()}-${index}`;
    seen.add(record.id);
    return record;
  });
}

export async function loadOrSeed() {
  const saved = await loadData();
  if (saved && Array.isArray(saved) && saved.length) {
    setRecords(sanitizeRecords(saved));
    return state.records;
  }
  setRecords(seedData());
  return state.records;
}

export async function refresh(redraw) {
  if (state.formDirty || $('overlay').classList.contains('show')) return;

  const saved = await loadData();
  if (!saved) return;

  const sanitized = sanitizeRecords(saved);
  if (JSON.stringify(sanitized) === JSON.stringify(state.records)) return;

  setRecords(sanitized);
  redraw();
}

export async function resetToSeed(redraw) {
  setRecords(seedData());
  await persist(state.records);
  redraw();
}

export async function importRecords(file, redraw) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    showToast('JSONの読み込みに失敗しました', { type: 'error' });
    return;
  }

  if (!Array.isArray(data)) {
    showToast('配列形式のJSONが必要です', { type: 'error' });
    return;
  }

  const imported = sanitizeRecords(data);
  const merge = confirm('OK＝統合（同名は上書き）\nキャンセル＝全置換');

  if (merge) {
    const map = new Map(state.records.map((record) => [normalize(record.name), record]));
    imported.forEach((record) => {
      const existing = map.get(normalize(record.name));
      if (existing) record.id = existing.id;
      map.set(normalize(record.name), record);
    });
    setRecords([...map.values()]);
  } else {
    setRecords(imported);
  }

  await persist(state.records);
  redraw();
  showToast(`${imported.length}件を読み込みました`, { type: 'success' });
}

export function exportRecords() {
  const blob = new Blob([JSON.stringify(state.records, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `配達メモ_backup_${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  showToast('バックアップを保存しました', { type: 'success' });
}

export function isSharedMode() {
  return localStorage.getItem(SHARED_KEY) === 'true';
}

export function setSharedMode(enabled) {
  localStorage.setItem(SHARED_KEY, String(enabled));
}
