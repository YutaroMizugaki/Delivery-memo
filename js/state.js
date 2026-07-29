export const state = {
  records: [],
  formDirty: false,
  editingId: null,
  openCards: new Set(),
  activeFilters: { cart: false, proc: false, hours: false, area: null },
};

export function setRecords(records) {
  state.records = records;
}

export function toggleCard(id) {
  if (state.openCards.has(id)) state.openCards.delete(id);
  else state.openCards.add(id);
}

export function clearOpenCards() {
  state.openCards.clear();
}
