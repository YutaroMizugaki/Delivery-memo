import { FILTER_AREAS, FILTER_CHIPS } from './config.js';
import { highlight, hoursState, normalize, searchText } from './search.js';
import { state, toggleCard } from './state.js';
import { escapeHtml, formatUpdatedAt, $ } from './utils.js';

function getTags(record) {
  const tags = [];
  if (record.permit) tags.push({ text: '駐車許可証', cls: 'green' });
  if (record.procReq === 'required') tags.push({ text: '手続き必要', cls: 'red' });
  else if (record.procReq === 'conditional') tags.push({ text: '条件付き手続き', cls: 'blue' });
  else tags.push({ text: '手続き不要', cls: 'green' });
  if (record.cartDiffers) tags.push({ text: '台車で変わる', cls: 'teal' });
  if (record.cash) tags.push({ text: '現金', cls: 'yellow' });
  if (record.notes) tags.push({ text: '注意あり', cls: 'purple' });
  return tags;
}

function renderSection(title, content) {
  return `<section class="section"><h3 class="section-title">${title}</h3><p>${content}</p></section>`;
}

function buildCardBody(record) {
  const sections = [];
  const hours = hoursState(record);

  if (record.parking) sections.push(renderSection('駐車場所', escapeHtml(record.parking)));
  if (record.proc) sections.push(renderSection('手続き', escapeHtml(record.proc)));

  if (record.hours) {
    const badge = hours.inHours
      ? '<span class="hours-badge in">時間内</span>'
      : '<span class="hours-badge out">時間外</span>';
    let hoursHtml = `<section class="section"><h3 class="section-title">対応時間 ${badge}</h3><p>${escapeHtml(record.hours)}</p>`;
    if (record.hoursDiffers && record.procOut) {
      hoursHtml += `<div class="out-box ${hours.inHours ? '' : 'active'}"><div class="label">時間外の手順</div><p>${escapeHtml(record.procOut)}</p></div>`;
    }
    hoursHtml += '</section>';
    sections.push(hoursHtml);
  }

  if (record.cartDiffers) {
    let cartHtml = '<section class="section"><h3 class="section-title">台車の有無で変わる</h3>';
    if (record.cartNo) cartHtml += `<p><strong>台車なし:</strong> ${escapeHtml(record.cartNo)}</p>`;
    if (record.cartYes) cartHtml += `<p><strong>台車あり:</strong> ${escapeHtml(record.cartYes)}</p>`;
    cartHtml += '</section>';
    sections.push(cartHtml);
  }

  if (record.notes) sections.push(renderSection('注意', escapeHtml(record.notes)));

  const updated = formatUpdatedAt(record.updatedAt);
  const staleBadge = updated.stale
    ? '<span class="updated-badge updated-badge--stale">要確認</span>'
    : '';
  sections.push(`
    <p class="updated-at">${staleBadge}<span>${escapeHtml(updated.label)}</span></p>
  `);

  sections.push(`
    <div class="card-actions">
      <button type="button" data-action="edit" data-id="${record.id}">編集</button>
      <button type="button" class="del" data-action="delete" data-id="${record.id}">削除</button>
    </div>
  `);

  return sections.join('');
}

function cardHtml(record, open, query) {
  const tags = getTags(record)
    .map((tag) => `<span class="tag ${tag.cls}"><span class="dot"></span>${tag.text}</span>`)
    .join('');
  const hasTime = record.time && record.time !== '—';

  return `
    <article class="card ${open ? 'open' : ''}" data-id="${record.id}">
      <div class="card-head">
        <div class="card-info">
          <h2 class="card-name">${highlight(record.name, query)}</h2>
          <span class="card-area">${escapeHtml(record.area)}</span>
          <div class="tags">${tags}</div>
        </div>
        <div class="time-box">
          <div class="label">TIME</div>
          <div class="value ${hasTime ? '' : 'empty'}">${hasTime ? escapeHtml(record.time) : '—'}</div>
        </div>
      </div>
      <div class="card-body">${buildCardBody(record)}</div>
    </article>
  `;
}

function filteredRecords() {
  const query = normalize($('search').value.trim());

  return state.records.filter((record) => {
    if (state.activeFilters.cart && !record.cartDiffers) return false;
    if (state.activeFilters.proc && record.procReq !== 'required') return false;
    if (state.activeFilters.hours && !record.hoursDiffers) return false;
    if (state.activeFilters.area && record.area !== state.activeFilters.area) return false;
    if (query && !searchText(record).includes(query)) return false;
    return true;
  });
}

export function renderList() {
  const list = filteredRecords();
  const autoOpenId = list.length === 1 ? list[0].id : null;

  $('count').textContent = `${list.length} / ${state.records.length} 件`;

  if (!list.length) {
    $('list').innerHTML = '<p class="empty">該当する物件がありません</p>';
    return;
  }

  const query = $('search').value.trim();
  $('list').innerHTML = list
    .map((record) => {
      const open = state.openCards.has(record.id) || record.id === autoOpenId;
      return cardHtml(record, open, query);
    })
    .join('');
}

export function renderFilters() {
  const toggleButtons = FILTER_CHIPS.map((chip) => `
    <button type="button" class="chip ${state.activeFilters[chip.key] ? 'active' : ''}" data-filter="${chip.key}">
      ${chip.label}
    </button>
  `).join('');

  const areaButtons = FILTER_AREAS.map((area) => `
    <button type="button" class="chip ${state.activeFilters.area === area ? 'active' : ''}" data-area="${area}">
      ${area}
    </button>
  `).join('');

  $('filters').innerHTML = toggleButtons + areaButtons;
}

export function redraw() {
  renderFilters();
  renderList();
}

export function bindListEvents({ onEdit, onDelete }) {
  $('list').addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      event.stopPropagation();
      const { action, id } = actionButton.dataset;
      if (action === 'edit') onEdit(id);
      if (action === 'delete') onDelete(id);
      return;
    }

    const card = event.target.closest('.card');
    if (!card) return;
    toggleCard(card.dataset.id);
    card.classList.toggle('open');
  });
}

export function bindFilterEvents() {
  $('filters').addEventListener('click', (event) => {
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) {
      const key = filterButton.dataset.filter;
      state.activeFilters[key] = !state.activeFilters[key];
      redraw();
      return;
    }

    const areaButton = event.target.closest('[data-area]');
    if (!areaButton) return;
    const area = areaButton.dataset.area;
    state.activeFilters.area = state.activeFilters.area === area ? null : area;
    redraw();
  });
}
