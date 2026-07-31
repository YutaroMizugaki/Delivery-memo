import { ALIASES, KANJI_FOLD, SIMILAR_THRESHOLD } from './config.js';
import { state } from './state.js';
import { escapeHtml } from './utils.js';

/** 長いエイリアスを先に置換（hill が hills を壊さないようにする） */
const ALIAS_ENTRIES = Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length);

/**
 * 正規化しつつ、正規化後の各文字が元テキストのどの位置由来かを追跡する。
 * ハイライト位置のずれ防止に使う。
 */
function normalizeTracked(text) {
  if (!text) return { value: '', origins: [] };

  let value = '';
  const origins = [];

  for (let i = 0; i < text.length; i += 1) {
    let char = text[i].toLowerCase();
    if (/[Ａ-Ｚａ-ｚ０-９]/.test(char)) {
      char = String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    }
    if (/[\u3041-\u3096]/.test(char)) {
      char = String.fromCharCode(char.charCodeAt(0) + 0x60);
    }
    value += char;
    origins.push(i);
  }

  const replacements = [
    ...KANJI_FOLD.map(([pattern, replacement]) => [pattern, replacement]),
    ...ALIAS_ENTRIES.map(([alias, japanese]) => [new RegExp(alias, 'gi'), japanese.toLowerCase()]),
  ];

  for (const [pattern, replacement] of replacements) {
    const flags = pattern.global ? pattern.flags : `${pattern.flags}g`;
    const re = new RegExp(pattern.source, flags);
    let newValue = '';
    const newOrigins = [];
    let lastIndex = 0;
    let match = re.exec(value);

    while (match) {
      for (let i = lastIndex; i < match.index; i += 1) {
        newValue += value[i];
        newOrigins.push(origins[i]);
      }

      const originStart = origins[match.index] ?? origins[origins.length - 1] ?? 0;
      for (let i = 0; i < replacement.length; i += 1) {
        newValue += replacement[i];
        newOrigins.push(originStart);
      }

      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) re.lastIndex += 1;
      match = re.exec(value);
    }

    for (let i = lastIndex; i < value.length; i += 1) {
      newValue += value[i];
      newOrigins.push(origins[i]);
    }

    value = newValue;
    origins.length = 0;
    origins.push(...newOrigins);
  }

  return { value, origins };
}

export function normalize(text) {
  return normalizeTracked(text).value;
}

export function searchText(record) {
  return normalize([
    record.name,
    record.area,
    record.parking,
    record.proc,
    record.route,
    record.cartNo,
    record.cartYes,
    record.notes,
  ].join(' '));
}

export function highlight(text, query) {
  if (!query || !text) return escapeHtml(text || '');

  const { value: normalizedText, origins } = normalizeTracked(text);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return escapeHtml(text);

  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0 || !origins.length) return escapeHtml(text);

  const start = origins[index];
  const endIndex = index + normalizedQuery.length - 1;
  const end = (origins[endIndex] ?? origins[origins.length - 1]) + 1;

  if (start == null || end <= start) return escapeHtml(text);

  return `${escapeHtml(text.slice(0, start))}<mark>${escapeHtml(text.slice(start, end))}</mark>${escapeHtml(text.slice(end))}`;
}

function bigrams(text) {
  const map = new Map();
  const normalized = normalize(text);
  for (let i = 0; i < normalized.length - 1; i += 1) {
    const gram = normalized.slice(i, i + 2);
    map.set(gram, (map.get(gram) || 0) + 1);
  }
  return map;
}

function similarity(a, b) {
  const left = bigrams(a);
  const right = bigrams(b);
  if (!left.size && !right.size) return 1;

  let intersection = 0;
  let total = 0;
  left.forEach((count, gram) => {
    intersection += Math.min(count, right.get(gram) || 0);
    total += count;
  });
  right.forEach((count, gram) => {
    if (!left.has(gram)) total += count;
  });

  return total ? (2 * intersection) / total : 0;
}

export function findDuplicate(name) {
  const normalizedName = normalize(name);
  if (!normalizedName) return { exact: null, similar: [] };

  let exact = null;
  const similar = [];

  state.records.forEach((record) => {
    if (record.id === state.editingId) return;
    if (normalize(record.name) === normalizedName) {
      exact = record;
      return;
    }
    const score = similarity(record.name, name);
    if (score >= SIMILAR_THRESHOLD) similar.push({ ...record, score });
  });

  similar.sort((a, b) => b.score - a.score);
  return { exact, similar };
}
