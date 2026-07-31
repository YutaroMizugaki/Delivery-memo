import { SEARCH_DEBOUNCE_MS } from './config.js';
import { bindSelectEvents, readForm, syncChecks, updateDuplicateWarning, writeForm } from './form.js';
import { bindFilterEvents, bindListEvents, redraw, renderList } from './render.js';
import { findDuplicate } from './search.js';
import { clearOpenCards, state } from './state.js';
import {
  exportRecords,
  importRecords,
  isSharedMode,
  loadOrSeed,
  refresh,
  removeRecord,
  resetToSeed,
  setSharedMode,
  upsertRecord,
} from './storage.js';
import { showToast } from './toast.js';
import { debounce, $, nowIso } from './utils.js';

function openEditById(id) {
  closeModal(true);
  openModal(state.records.find((item) => item.id === id));
}

function duplicateWarningHandlers() {
  return {
    onEditExisting: openEditById,
    onEditSimilar: openEditById,
  };
}

function setModalOpen(open) {
  $('overlay').classList.toggle('show', open);
  document.body.classList.toggle('modal-open', open);
}

function openModal(record = null) {
  state.editingId = record?.id || null;
  state.formDirty = false;
  $('modal-title').textContent = record ? '物件を編集' : '物件を追加';
  writeForm(record || { procReq: 'required' });
  updateDuplicateWarning(duplicateWarningHandlers());
  setModalOpen(true);
  $('f-name').focus();
}

function closeModal(force = false) {
  if (!force && state.formDirty && !confirm('未保存の変更があります。閉じますか？')) return;
  setModalOpen(false);
  state.editingId = null;
  state.formDirty = false;
  $('dup-warn').classList.remove('show');
}

async function saveForm(event) {
  event.preventDefault();
  const record = readForm();
  record.updatedAt = nowIso();

  if (!record.name) {
    showToast('物件名は必須です', { type: 'error' });
    return;
  }

  const { exact } = findDuplicate(record.name);
  if (exact && exact.id !== record.id) {
    showToast(`「${exact.name}」と同名の物件が既にあります`, { type: 'error' });
    return;
  }

  const isNew = !state.editingId;
  await upsertRecord(record);
  state.formDirty = false;
  closeModal(true);
  redraw();
  showToast(isNew ? '物件を追加しました' : '保存しました', { type: 'success' });
}

async function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record || !confirm(`「${record.name}」を削除しますか？`)) return;
  await removeRecord(id);
  state.openCards.delete(id);
  redraw();
  showToast('削除しました', { type: 'success' });
}

const handleSearch = debounce(renderList, SEARCH_DEBOUNCE_MS);

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register(
      new URL('sw.js', window.location.href),
      { scope: new URL('./', window.location.href).pathname }
    );

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showToast('新しいバージョンがあります。ページを再読み込みしてください', {
            type: 'info',
            duration: 5000,
          });
        }
      });
    });
  } catch {
    // オフライン機能は任意
  }
}

async function init() {
  $('shared').checked = isSharedMode();
  $('shared').addEventListener('change', async (event) => {
    setSharedMode(event.target.checked);
    await loadOrSeed();
    redraw();
    showToast(event.target.checked ? 'チーム共有モードに切り替えました' : '個人モードに切り替えました');
  });

  await loadOrSeed();

  $('search').addEventListener('input', handleSearch);
  $('btn-add').addEventListener('click', () => openModal());
  $('modal-close').addEventListener('click', () => closeModal());
  $('overlay').addEventListener('click', (event) => {
    if (event.target === $('overlay')) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $('overlay').classList.contains('show')) {
      closeModal();
    }
  });
  $('form').addEventListener('submit', saveForm);
  $('form').addEventListener('input', () => {
    state.formDirty = true;
  });
  $('f-name').addEventListener('input', () => {
    updateDuplicateWarning(duplicateWarningHandlers());
  });

  ['permit', 'cash', 'cartDiffers'].forEach((field) => {
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
  $('btn-refresh').addEventListener('click', async () => {
    const updated = await refresh(redraw);
    if (updated) showToast('最新のデータに更新しました', { type: 'success' });
  });
  $('btn-reset').addEventListener('click', async () => {
    const message = $('shared').checked
      ? '共有モードです。全員のデータが初期状態に戻ります。よろしいですか？'
      : '初期データに戻しますか？';
    if (!confirm(message)) return;
    await resetToSeed(() => {
      clearOpenCards();
      redraw();
    });
    showToast('初期データに戻しました', { type: 'success' });
  });

  window.addEventListener('focus', () => refresh(redraw));

  bindSelectEvents();
  bindFilterEvents();
  bindListEvents({
    onEdit: (id) => openModal(state.records.find((item) => item.id === id)),
    onDelete: deleteRecord,
  });

  redraw();
  registerServiceWorker();
}

init();
