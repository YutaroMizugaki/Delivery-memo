import { SELECT_FIELDS } from './config.js';
import { bindSelectEvents, readForm, syncChecks, updateDuplicateWarning, writeForm } from './form.js';
import { bindFilterEvents, bindListEvents, redraw } from './render.js';
import { findDuplicate } from './search.js';
import { clearOpenCards, state } from './state.js';
import {
  exportRecords,
  importRecords,
  isSharedMode,
  loadOrSeed,
  persist,
  refresh,
  removeRecord,
  resetToSeed,
  setSharedMode,
  upsertRecord,
} from './storage.js';
import { $ } from './utils.js';

function openModal(record = null) {
  state.editingId = record?.id || null;
  state.formDirty = false;
  $('modal-title').textContent = record ? '物件を編集' : '物件を追加';
  writeForm(record || { procReq: 'required' });
  updateDuplicateWarning({
    onEditExisting: (id) => {
      closeModal(true);
      openModal(state.records.find((item) => item.id === id));
    },
    onEditSimilar: (id) => {
      closeModal(true);
      openModal(state.records.find((item) => item.id === id));
    },
  });
  $('overlay').classList.add('show');
  $('f-name').focus();
}

function closeModal(force = false) {
  if (!force && state.formDirty && !confirm('未保存の変更があります。閉じますか？')) return;
  $('overlay').classList.remove('show');
  state.editingId = null;
  state.formDirty = false;
  $('dup-warn').classList.remove('show');
}

async function saveForm(event) {
  event.preventDefault();
  const record = readForm();

  if (!record.name) {
    alert('物件名は必須です');
    return;
  }

  const { exact } = findDuplicate(record.name);
  if (exact && exact.id !== record.id) {
    alert(`「${exact.name}」と同名の物件が既にあります`);
    return;
  }

  await upsertRecord(record);
  state.formDirty = false;
  closeModal(true);
  redraw();
}

async function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !confirm(`「${record.name}」を削除しますか？`)) return;
  await removeRecord(id);
  state.openCards.delete(id);
  redraw();
}

async function init() {
  $('shared').checked = isSharedMode();
  $('shared').addEventListener('change', async (event) => {
    setSharedMode(event.target.checked);
    await loadOrSeed();
    redraw();
  });

  await loadOrSeed();

  $('search').addEventListener('input', redraw);
  $('btn-add').addEventListener('click', () => openModal());
  $('modal-close').addEventListener('click', () => closeModal());
  $('overlay').addEventListener('click', (event) => {
    if (event.target === $('overlay')) closeModal();
  });
  $('form').addEventListener('submit', saveForm);
  $('form').addEventListener('input', () => {
    state.formDirty = true;
  });
  $('f-name').addEventListener('input', () => {
    state.formDirty = true;
    updateDuplicateWarning({
      onEditExisting: (id) => {
        closeModal(true);
        openModal(state.records.find((item) => item.id === id));
      },
      onEditSimilar: (id) => {
        closeModal(true);
        openModal(state.records.find((item) => item.id === id));
      },
    });
  });

  ['permit', 'cash', 'cartDiffers', 'hoursDiffers'].forEach((field) => {
    $(`f-${field}`).addEventListener('change', () => {
      state.formDirty = true;
      syncChecks();
    });
  });

  $('btn-export').addEventListener('click', exportRecords);
  $('btn-import').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) await importRecords(file, redraw);
    event.target.value = '';
  });
  $('btn-refresh').addEventListener('click', () => refresh(redraw));
  $('btn-reset').addEventListener('click', async () => {
    const message = $('shared').checked
      ? '共有モードです。全員のデータが初期状態に戻ります。よろしいですか？'
      : '初期データに戻しますか？';
    if (!confirm(message)) return;
    await resetToSeed(() => {
      clearOpenCards();
      redraw();
    });
  });

  window.addEventListener('focus', () => refresh(redraw));

  bindSelectEvents();
  bindFilterEvents();
  bindListEvents({
    onEdit: (id) => openModal(state.records.find((item) => item.id === id)),
    onDelete: deleteRecord,
  });

  redraw();
}

init();
