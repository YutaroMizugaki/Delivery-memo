import { ALIASES, KANJI_FOLD, SIMILAR_THRESHOLD } from './config.js';
import { state } from './state.js';
import { escapeHtml } from './utils.js';

export function normalize(text) {
  if (!text) return '';
  let value = text.toLowerCase();
  value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));
  value = value.replace(/[\u3041-\u3096]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
  for (const [pattern, replacement] of KANJI_FOLD) {
    value = value.replace(pattern, replacement);
  }
  for (const [alias, japanese] of Object.entries(ALIASES)) {
    value = value.replace(new RegExp(alias, 'gi'), japanese.toLowerCase());
  }
  return value;
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

  const normalizedQuery = normalize(query);
  const normalizedText = normalize(text);
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) return escapeHtml(text);

  let start = 0;
  let normalizedIndex = 0;
  while (normalizedIndex < index && start < text.length) {
    const chunk = normalize(text[start]);
    normalizedIndex += chunk.length;
    start += 1;
  }

  let end = start;
  let matched = 0;
  while (matched < normalizedQuery.length && end < text.length) {
    matched += normalize(text[end]).length;
    end += 1;
  }

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
