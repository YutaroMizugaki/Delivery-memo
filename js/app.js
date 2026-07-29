const STORAGE_KEYS = {
  issuer: 'delivery-memo-issuer',
  draft: 'delivery-memo-draft',
};

const TAX_RATE = 0.1;

let items = [];
let itemIdCounter = 0;

const $ = (id) => document.getElementById(id);

function formatCurrency(amount) {
  return '¥' + Math.round(amount).toLocaleString('ja-JP');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function generateDocNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `DN-${y}${m}${d}-${rand}`;
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

function createDefaultItems() {
  return [
    { id: ++itemIdCounter, description: 'Webサイト制作（トップページ）', quantity: 1, unitPrice: 150000 },
    { id: ++itemIdCounter, description: 'レスポンシブ対応', quantity: 1, unitPrice: 50000 },
  ];
}

function addItem(data = {}) {
  items.push({
    id: ++itemIdCounter,
    description: data.description || '',
    quantity: data.quantity ?? 1,
    unitPrice: data.unitPrice ?? 0,
  });
  renderItemsEditor();
  updatePreview();
}

function removeItem(id) {
  items = items.filter((item) => item.id !== id);
  if (items.length === 0) addItem();
  else {
    renderItemsEditor();
    updatePreview();
  }
}

function renderItemsEditor() {
  const container = $('items-editor-list');
  container.innerHTML = items
    .map(
      (item) => `
    <div class="item-row" data-id="${item.id}">
      <input type="text" class="item-desc" value="${escapeHtml(item.description)}" placeholder="品名・仕様">
      <input type="number" class="item-qty" value="${item.quantity}" min="0" step="1" placeholder="数量">
      <input type="number" class="item-price" value="${item.unitPrice}" min="0" step="1" placeholder="単価">
      <input type="text" class="item-amount" value="${formatCurrency(item.quantity * item.unitPrice)}" readonly tabindex="-1">
      <button type="button" class="btn-remove" title="削除" aria-label="行を削除">×</button>
    </div>
  `
    )
    .join('');

  container.querySelectorAll('.item-row').forEach((row) => {
    const id = Number(row.dataset.id);

    row.querySelector('.item-desc').addEventListener('input', (e) => {
      const item = items.find((i) => i.id === id);
      if (item) item.description = e.target.value;
      updatePreview();
    });

    row.querySelector('.item-qty').addEventListener('input', (e) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        item.quantity = parseFloat(e.target.value) || 0;
        row.querySelector('.item-amount').value = formatCurrency(item.quantity * item.unitPrice);
      }
      updatePreview();
    });

    row.querySelector('.item-price').addEventListener('input', (e) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        item.unitPrice = parseFloat(e.target.value) || 0;
        row.querySelector('.item-amount').value = formatCurrency(item.quantity * item.unitPrice);
      }
      updatePreview();
    });

    row.querySelector('.btn-remove').addEventListener('click', () => removeItem(id));
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFormData() {
  return {
    issuer: {
      name: $('issuer-name').value,
      address: $('issuer-address').value,
      tel: $('issuer-tel').value,
      email: $('issuer-email').value,
      registration: $('issuer-registration').value,
    },
    recipient: {
      name: $('recipient-name').value,
      honorific: $('recipient-honorific').value,
      contact: $('recipient-contact').value,
      address: $('recipient-address').value,
    },
    document: {
      issueDate: $('issue-date').value,
      docNumber: $('doc-number').value,
      poNumber: $('po-number').value,
      subject: $('subject').value,
      showPrices: $('show-prices').checked,
      showTax: $('show-tax').checked,
      remarks: $('remarks').value,
    },
    items: items.map(({ description, quantity, unitPrice }) => ({
      description,
      quantity,
      unitPrice,
    })),
  };
}

function setFormData(data) {
  if (data.issuer) {
    $('issuer-name').value = data.issuer.name || '';
    $('issuer-address').value = data.issuer.address || '';
    $('issuer-tel').value = data.issuer.tel || '';
    $('issuer-email').value = data.issuer.email || '';
    $('issuer-registration').value = data.issuer.registration || '';
  }

  if (data.recipient) {
    $('recipient-name').value = data.recipient.name || '';
    $('recipient-honorific').value = data.recipient.honorific ?? '御中';
    $('recipient-contact').value = data.recipient.contact || '';
    $('recipient-address').value = data.recipient.address || '';
  }

  if (data.document) {
    $('issue-date').value = data.document.issueDate || '';
    $('doc-number').value = data.document.docNumber || '';
    $('po-number').value = data.document.poNumber || '';
    $('subject').value = data.document.subject || '';
    $('show-prices').checked = data.document.showPrices !== false;
    $('show-tax').checked = data.document.showTax !== false;
    $('remarks').value = data.document.remarks || '';
  }

  if (data.items?.length) {
    items = data.items.map((item) => ({
      id: ++itemIdCounter,
      description: item.description || '',
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
    }));
  }
}

function updatePreview() {
  const data = getFormData();

  $('preview-date').textContent = formatDate(data.document.issueDate);
  $('preview-number').textContent = data.document.docNumber || '—';

  const poRow = $('preview-po-row');
  if (data.document.poNumber) {
    poRow.classList.remove('hidden');
    $('preview-po').textContent = data.document.poNumber;
  } else {
    poRow.classList.add('hidden');
  }

  $('preview-recipient').textContent = data.recipient.name || '（納品先）';
  const honorificEl = $('preview-honorific');
  if (data.recipient.honorific) {
    honorificEl.textContent = data.recipient.honorific;
    honorificEl.classList.remove('hidden');
  } else {
    honorificEl.textContent = '';
    honorificEl.classList.add('hidden');
  }

  const contactEl = $('preview-contact');
  if (data.recipient.contact) {
    contactEl.textContent = `${data.recipient.contact} 様`;
    contactEl.classList.remove('hidden');
  } else {
    contactEl.classList.add('hidden');
  }

  $('preview-recipient-address').textContent = data.recipient.address || '';

  $('preview-issuer').textContent = data.issuer.name || '（発行元）';
  $('preview-issuer-address').textContent = data.issuer.address || '';
  $('preview-issuer-tel').textContent = data.issuer.tel ? `TEL: ${data.issuer.tel}` : '';
  $('preview-issuer-email').textContent = data.issuer.email || '';
  $('preview-issuer-registration').textContent = data.issuer.registration
    ? `登録番号: ${data.issuer.registration}`
    : '';

  const subjectEl = $('preview-subject');
  if (data.document.subject) {
    subjectEl.textContent = `件名: ${data.document.subject}`;
  } else {
    subjectEl.textContent = '';
  }

  const tbody = $('items-body');
  const minRows = 5;
  const displayItems = [...items];
  while (displayItems.length < minRows) {
    displayItems.push({ description: '', quantity: '', unitPrice: 0 });
  }

  tbody.innerHTML = displayItems
    .map((item, index) => {
      const amount = (item.quantity || 0) * (item.unitPrice || 0);
      const hasContent = item.description || item.quantity || item.unitPrice;
      return `
      <tr>
        <td class="text-center">${hasContent ? index + 1 : ''}</td>
        <td>${escapeHtml(item.description || '')}</td>
        <td class="text-right">${item.quantity !== '' && item.quantity != null ? item.quantity : ''}</td>
        <td class="text-right price-col">${hasContent && item.unitPrice ? formatCurrency(item.unitPrice) : ''}</td>
        <td class="text-right price-col">${hasContent && amount ? formatCurrency(amount) : ''}</td>
      </tr>
    `;
    })
    .join('');

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.floor(subtotal * TAX_RATE);
  const total = subtotal + tax;

  $('preview-subtotal').textContent = formatCurrency(subtotal);
  $('preview-tax').textContent = formatCurrency(tax);
  $('preview-total').textContent = formatCurrency(total);

  const doc = $('document');
  doc.classList.toggle('hide-prices', !data.document.showPrices);
  doc.classList.toggle('hide-tax', !data.document.showTax);

  $('preview-remarks').textContent = data.document.remarks || '';
}

function saveIssuer() {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEYS.issuer, JSON.stringify(data.issuer));
  showToast('発行元情報を保存しました');
}

function loadIssuer() {
  const saved = localStorage.getItem(STORAGE_KEYS.issuer);
  if (saved) {
    try {
      const issuer = JSON.parse(saved);
      setFormData({ issuer });
    } catch {
      /* ignore */
    }
  }
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(getFormData()));
  showToast('下書きを保存しました');
}

function loadDraft() {
  const saved = localStorage.getItem(STORAGE_KEYS.draft);
  if (saved) {
    try {
      setFormData(JSON.parse(saved));
      renderItemsEditor();
      return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function resetForm() {
  if (!confirm('入力内容をリセットしますか？')) return;

  $('recipient-name').value = '';
  $('recipient-honorific').value = '御中';
  $('recipient-contact').value = '';
  $('recipient-address').value = '';
  $('po-number').value = '';
  $('subject').value = '';
  $('remarks').value = '';
  $('issue-date').value = new Date().toISOString().slice(0, 10);
  $('doc-number').value = generateDocNumber();
  $('show-prices').checked = true;
  $('show-tax').checked = true;

  items = createDefaultItems();
  renderItemsEditor();
  updatePreview();
  showToast('新規作成しました');
}

function bindEvents() {
  const inputs = document.querySelectorAll(
    'input:not(.item-desc):not(.item-qty):not(.item-price), textarea, select'
  );
  inputs.forEach((el) => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  $('btn-add-item').addEventListener('click', () => addItem());
  $('btn-print').addEventListener('click', () => window.print());
  $('btn-save').addEventListener('click', saveDraft);
  $('btn-save-issuer').addEventListener('click', saveIssuer);
  $('btn-new').addEventListener('click', resetForm);
}

function init() {
  loadIssuer();

  if (!loadDraft()) {
    items = createDefaultItems();
    $('issue-date').value = new Date().toISOString().slice(0, 10);
    $('doc-number').value = generateDocNumber();
    $('recipient-name').value = '株式会社クライアント';
    $('issuer-name').value = $('issuer-name').value || '株式会社サンプル';
  }

  renderItemsEditor();
  bindEvents();
  updatePreview();
}

document.addEventListener('DOMContentLoaded', init);
