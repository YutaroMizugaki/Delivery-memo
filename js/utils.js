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

export function formatUpdatedAt(iso) {
  if (!iso) return '未記録';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '未記録';

  const diffDays = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return '今日更新';
  if (diffDays === 1) return '昨日更新';
  if (diffDays < 30) return `${diffDays}日前更新`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前更新`;
  return `${Math.floor(diffDays / 365)}年前更新`;
}

export function nowIso() {
  return new Date().toISOString();
}
