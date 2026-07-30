import { AREAS, FILTER_CHIPS } from './config.js';
import { highlight, normalize, searchText } from './search.js';
import { isCardOpen, state, toggleCardOpen } from './state.js';
import { escapeHtml, formatUpdatedAt, $ } from './utils.js';

const PROC_SECTION_TITLE = '防災センター・受付の手順';
const NOTES_SECTION_TITLE = 'その他注意点';

function getTags(record) {
  const tags = [];
  if (record.permit) tags.push({ text: '駐車許可証', cls: 'green' });
  if (record.procReq === 'required') tags.push({ text: '手続き必要', cls: 'red' });
  else if (record.procReq === 'conditional') tags.push({ text: '条件付き手続き', cls: 'blue' });
  else tags.push({ text: '手続き不要', cls: 'muted' });
  if (record.cartDiffers) tags.push({ text: '台車で変わる', cls: 'teal' });
  if (record.cash) tags.push({ text: '現金', cls: 'yellow' });
  if (record.notes) tags.push({ text: '注意', cls: 'purple' });
  return tags;
}

function tagsHtml(record) {
  return getTags(record)
    .map((tag) => `<span class="tag ${tag.cls}"><span class="dot"></span>${tag.text}</span>`)
    .join('');
}

function renderSection(title, content) {
  return `<section class="section"><h3 class="section-title">${title}</h3><p>${content}</p></section>`;
}

function buildCardBody(record) {
  const sections = [];

  if (record.parking) sections.push(renderSection('駐車場所', escapeHtml(record.parking)));
  if (record.proc) sections.push(renderSection(PROC_SECTION_TITLE, escapeHtml(record.proc)));

  if (record.cartDiffers) {
    let cartHtml = '<section class="section"><h3 class="section-title">台車の有無で変わる</h3>';
    if (record.cartNo) cartHtml += `<p><strong>台車なし:</strong> ${escapeHtml(record.cartNo)}</p>`;
    if (record.cartYes) cartHtml += `<p><strong>台車あり:</strong> ${escapeHtml(record.cartYes)}</p>`;
    cartHtml += '</section>';
    sections.push(cartHtml);
  }

  if (record.notes) sections.push(renderSection(NOTES_SECTION_TITLE, escapeHtml(record.notes)));

  sections.push(`<p class="updated-at">${escapeHtml(formatUpdatedAt(record.updatedAt))}</p>`);

  sections.push(`
    <div class="card-actions">
      <button type="button" data-action="edit" data-id="${record.id}">編集</button>
      <button type="button" class="del" data-action="delete" data-id="${record.id}">削除</button>
    </div>
  `);

  return sections.join('');
}

function recordSignature(record) {
  return JSON.stringify(record);
}

function buildCardShell(record, open, query) {
  const hasTime = record.time && record.time !== '—';
  return `
    <div class="card-head">
      <span class="card-chevron" aria-hidden="true"></span>
      <div class="card-info">
        <h2 class="card-name">${highlight(record.name, query)}</h2>
        <span class="card-area">${escapeHtml(record.area)}</span>
        <div class="tags">${tagsHtml(record)}</div>
      </div>
      <div class="time-box">
        <div class="label">所要</div>
        <div class="value ${hasTime ? '' : 'empty'}">${hasTime ? escapeHtml(record.time) : '—'}</div>
      </div>
    </div>
    <div class="card-body">${buildCardBody(record)}</div>
  `;
}

function syncCardHead(card, record, query) {
  const nameEl = card.querySelector('.card-name');
  const newNameHtml = highlight(record.name, query);
  if (nameEl.innerHTML !== newNameHtml) nameEl.innerHTML = newNameHtml;

  const areaEl = card.querySelector('.card-area');
  if (areaEl.textContent !== record.area) areaEl.textContent = record.area;

  const tagsEl = card.querySelector('.tags');
  const newTagsHtml = tagsHtml(record);
  if (tagsEl.innerHTML !== newTagsHtml) tagsEl.innerHTML = newTagsHtml;

  const timeEl = card.querySelector('.time-box .value');
  const hasTime = record.time && record.time !== '—';
  const timeText = hasTime ? record.time : '—';
  if (timeEl.textContent !== timeText) timeEl.textContent = timeText;
  timeEl.classList.toggle('empty', !hasTime);
}

function syncCard(card, record, open, query) {
  card.classList.toggle('open', open);
  syncCardHead(card, record, query);

  const signature = recordSignature(record);
  if (card.dataset.sig !== signature) {
    card.querySelector('.card-body').innerHTML = buildCardBody(record);
    card.dataset.sig = signature;
  }
}

function createCard(record, open, query) {
  const card = document.createElement('article');
  card.className = `card ${open ? 'open' : ''}`;
  card.dataset.id = record.id;
  card.dataset.sig = recordSignature(record);
  card.innerHTML = buildCardShell(record, open, query);
  return card;
}

function filteredRecords() {
  const query = normalize($('search').value.trim());

  return state.records.filter((record) => {
    if (state.activeFilters.cart && !record.cartDiffers) return false;
    if (state.activeFilters.proc && record.procReq !== 'required') return false;
    if (state.activeFilters.area && record.area !== state.activeFilters.area) return false;
    if (query && !searchText(record).includes(query)) return false;
    return true;
  });
}

function getAutoOpenId(records) {
  return records.length === 1 ? records[0].id : null;
}

export function renderList() {
  const listEl = $('list');
  const scrollY = window.scrollY;
  const records = filteredRecords();
  const autoOpenId = getAutoOpenId(records);
  const query = $('search').value.trim();

  if (records.length !== 1) state.dismissedAutoOpen.clear();

  $('count').textContent = `${records.length} / ${state.records.length} 件`;

  if (!records.length) {
    if (!listEl.querySelector('.empty')) {
      listEl.replaceChildren();
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '該当する物件がありません';
      listEl.appendChild(empty);
    }
    window.scrollTo(0, scrollY);
    return;
  }

  listEl.querySelector('.empty')?.remove();

  const existing = new Map();
  listEl.querySelectorAll('.card').forEach((card) => existing.set(card.dataset.id, card));

  const targetIds = new Set(records.map((record) => record.id));
  existing.forEach((card, id) => {
    if (!targetIds.has(id)) card.remove();
  });

  records.forEach((record) => {
    const open = isCardOpen(record.id, autoOpenId);
    const card = existing.get(record.id);
    if (card) syncCard(card, record, open, query);
    else listEl.appendChild(createCard(record, open, query));
  });

  records.forEach((record) => {
    const card = listEl.querySelector(`[data-id="${CSS.escape(record.id)}"]`);
    if (card) listEl.appendChild(card);
  });

  window.scrollTo(0, scrollY);
}

export function renderFilters() {
  const toggleButtons = FILTER_CHIPS.map((chip) => `
    <button type="button" class="chip ${state.activeFilters[chip.key] ? 'active' : ''}" data-filter="${chip.key}">
      ${chip.label}
    </button>
  `).join('');

  const areaButtons = AREAS.map((area) => `
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
    const records = filteredRecords();
    toggleCardOpen(card.dataset.id, getAutoOpenId(records));
    renderList();
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
