import { AREAS, CHECK_FIELDS, HOURS_OPTS, SELECT_FIELDS, TEXT_FIELDS, TIMES } from './config.js';
import { findDuplicate } from './search.js';
import { state } from './state.js';
import { escapeHtml, $ } from './utils.js';

function fillSelect(select, options, value, newInputId) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option || '（未設定）')}</option>`)
    .join('') + '<option value="__new__">＋ 新規入力</option>';

  const newInput = $(newInputId);
  if (value && options.includes(value)) {
    select.value = value;
    newInput.classList.remove('show');
    newInput.value = '';
  } else if (value) {
    select.value = '__new__';
    newInput.value = value;
    newInput.classList.add('show');
  } else {
    select.value = options[0] || '';
    newInput.classList.remove('show');
    newInput.value = '';
  }
}

export function populateSelects(record = {}) {
  fillSelect($('f-area'), AREAS, record.area, 'f-area-new');
  fillSelect($('f-time'), TIMES, record.time, 'f-time-new');
  fillSelect($('f-hours'), HOURS_OPTS, record.hours, 'f-hours-new');
}

export function toggleNew(field) {
  const select = $(`f-${field}`);
  const input = $(`f-${field}-new`);
  input.classList.toggle('show', select.value === '__new__');
}

function pickValue(field) {
  const select = $(`f-${field}`);
  if (select.value === '__new__') return $(`f-${field}-new`).value.trim();
  return select.value;
}

export function syncChecks() {
  CHECK_FIELDS.forEach((field) => {
    const input = $(`f-${field}`);
    input.closest('.check-label').classList.toggle('on', input.checked);
  });

  $('cond-procOut').classList.toggle('show', $('f-hoursDiffers').checked);
  $('cond-cartNo').classList.toggle('show', $('f-cartDiffers').checked);
  $('cond-cartYes').classList.toggle('show', $('f-cartDiffers').checked);
}

export function writeForm(record = {}) {
  $('f-id').value = record.id || '';
  $('f-name').value = record.name || '';
  populateSelects(record);
  $('f-procReq').value = record.procReq || 'required';

  TEXT_FIELDS.forEach((field) => {
    if (SELECT_FIELDS.includes(field) || field === 'name') return;
    const input = $(`f-${field}`);
    if (input) input.value = record[field] || '';
  });

  CHECK_FIELDS.forEach((field) => {
    $(`f-${field}`).checked = !!record[field];
  });

  syncChecks();
  updateDuplicateWarning();
}

export function readForm() {
  const record = {
    id: $('f-id').value || `u-${Date.now()}`,
    name: $('f-name').value.trim(),
    area: pickValue('area'),
    time: pickValue('time'),
    hours: pickValue('hours'),
    procReq: $('f-procReq').value,
  };

  TEXT_FIELDS.forEach((field) => {
    if (SELECT_FIELDS.includes(field) || field === 'name') return;
    record[field] = $(`f-${field}`).value.trim();
  });

  CHECK_FIELDS.forEach((field) => {
    record[field] = $(`f-${field}`).checked;
  });

  return record;
}

export function updateDuplicateWarning({ onEditExisting, onEditSimilar } = {}) {
  const name = $('f-name').value.trim();
  const warning = $('dup-warn');
  const { exact, similar } = findDuplicate(name);

  if (!name) {
    warning.classList.remove('show');
    return;
  }

  if (exact) {
    $('dup-msg').textContent = `「${exact.name}」と同名の物件が既にあります`;
    const editButton = $('dup-edit');
    editButton.hidden = false;
    editButton.onclick = () => onEditExisting?.(exact.id);
    $('similar-list').innerHTML = '';
    warning.classList.add('show');
    return;
  }

  if (similar.length) {
    $('dup-msg').textContent = '類似する物件があります：';
    $('dup-edit').hidden = true;
    $('similar-list').innerHTML = similar
      .map((record) => `
        <button type="button" data-id="${record.id}">
          ${escapeHtml(record.name)}（${escapeHtml(record.area)}・${Math.round(record.score * 100)}%）
        </button>
      `)
      .join('');
    $('similar-list').querySelectorAll('button').forEach((button) => {
      button.onclick = () => onEditSimilar?.(button.dataset.id);
    });
    warning.classList.add('show');
    return;
  }

  warning.classList.remove('show');
}

export function bindSelectEvents() {
  SELECT_FIELDS.forEach((field) => {
    $(`f-${field}`).addEventListener('change', () => toggleNew(field));
  });
}
