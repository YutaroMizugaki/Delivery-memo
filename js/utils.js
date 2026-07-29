export function debounce(fn, ms = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export const $ = (id) => document.getElementById(id);

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STALE_MS = 90 * 24 * 60 * 60 * 1000;

export function formatUpdatedAt(iso) {
  if (!iso) return { label: '未記録', stale: true };

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { label: '未記録', stale: true };

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  let label;
  if (diffDays <= 0) label = '今日更新';
  else if (diffDays === 1) label = '昨日更新';
  else if (diffDays < 30) label = `${diffDays}日前更新`;
  else if (diffDays < 365) label = `${Math.floor(diffDays / 30)}ヶ月前更新`;
  else label = `${Math.floor(diffDays / 365)}年前更新`;

  return { label, stale: diffMs > STALE_MS };
}

export function nowIso() {
  return new Date().toISOString();
}
