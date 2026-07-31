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
  return isSharedMode() ? `${STORAGE_KEY}-shared` : STORAGE_KEY;
}

async function loadData() {
  return storage.get(storageKey());
}

async function persistRecords(records, { warnOnFallback = false } = {}) {
  const ok = await storage.set(storageKey(), records);
  setRecords(records);
  if (!ok && warnOnFallback) {
    showToast('保存領域が使えません。このタブを閉じるとデータが消える可能性があります', {
      type: 'error',
      duration: 5000,
    });
  }
  return ok;
}

export async function persist(records) {
  await persistRecords(records, { warnOnFallback: true });
}

export async function upsertRecord(record) {
  const saved = await loadData();
  const latest = saved ? [...saved] : [...state.records];
  const index = latest.findIndex((item) => item.id === record.id);
  if (index >= 0) latest[index] = record;
  else latest.push(record);
  await persist(latest);
}

export async function removeRecord(id) {
  const saved = await loadData();
  const latest = saved ? [...saved] : [...state.records];
  await persist(latest.filter((item) => item.id !== id));
}

export function sanitizeRecords(records) {
  const seen = new Set();
  const stamp = Date.now();

  return records.map((raw, index) => {
    const record = {};
    RECORD_FIELDS.forEach((key) => {
      if (['permit', 'cash', 'cartDiffers'].includes(key)) {
        record[key] = !!raw[key];
      } else if (key === 'procReq') {
        record[key] = ['required', 'notRequired', 'conditional'].includes(raw[key]) ? raw[key] : 'required';
      } else if (key === 'updatedAt') {
        record[key] = raw[key] ? String(raw[key]) : '';
      } else {
        record[key] = String(raw[key] ?? '');
      }
    });

    const legacyNotes = [];
    if (raw.procOut?.trim()) legacyNotes.push(raw.procOut.trim());
    if (legacyNotes.length) {
      record.notes = [legacyNotes.join('\n'), record.notes].filter(Boolean).join('\n');
    }

    if (!record.name) record.name = '名称未設定';
    if (!record.id || seen.has(record.id)) record.id = `imp-${stamp}-${index}`;
    seen.add(record.id);
    return record;
  });
}

export async function loadOrSeed() {
  const saved = await loadData();

  // 空配列も「保存済み」として扱う（全削除後に初期データへ勝手に戻さない）
  if (Array.isArray(saved)) {
    const sanitized = sanitizeRecords(saved);
    setRecords(sanitized);
    if (JSON.stringify(sanitized) !== JSON.stringify(saved)) {
      await storage.set(storageKey(), sanitized);
    }
    return state.records;
  }

  const seeded = seedData();
  setRecords(seeded);
  await storage.set(storageKey(), seeded);
  return state.records;
}

export async function refresh(redraw) {
  if (state.formDirty || $('overlay').classList.contains('show')) return false;

  const saved = await loadData();
  if (!Array.isArray(saved)) return false;

  const sanitized = sanitizeRecords(saved);
  if (JSON.stringify(sanitized) === JSON.stringify(state.records)) return false;

  setRecords(sanitized);
  redraw();
  return true;
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

  // 旧実装は「キャンセル＝全置換」だったため、誤操作で全消去しやすかった
  let mode = null;
  if (confirm(`${imported.length}件を読み込みます。\nOK＝既存と統合（同名は上書き）\nキャンセル＝次の選択肢へ`)) {
    mode = 'merge';
  } else if (confirm('全データを置き換えますか？\nOK＝全置換\nキャンセル＝中止')) {
    mode = 'replace';
  } else {
    showToast('読み込みをキャンセルしました');
    return;
  }

  if (mode === 'merge') {
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
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = `配達メモ_backup_${stamp}.json`;
  anchor.click();
  // 即 revoke すると一部ブラウザでダウンロードが失敗する
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('バックアップを保存しました', { type: 'success' });
}

export function isSharedMode() {
  try {
    return localStorage.getItem(SHARED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSharedMode(enabled) {
  try {
    localStorage.setItem(SHARED_KEY, String(enabled));
  } catch {
    showToast('共有モードの設定を保存できませんでした', { type: 'error' });
  }
}
