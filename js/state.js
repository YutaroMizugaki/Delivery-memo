export const state = {
  records: [],
  formDirty: false,
  editingId: null,
  openCards: new Set(),
  dismissedAutoOpen: new Set(),
  activeFilters: { cart: false, proc: false, area: null },
};

export function setRecords(records) {
  state.records = records;
}

export function isCardOpen(id, autoOpenId) {
  if (state.dismissedAutoOpen.has(id)) return state.openCards.has(id);
  return state.openCards.has(id) || id === autoOpenId;
}

export function toggleCardOpen(id, autoOpenId) {
  if (isCardOpen(id, autoOpenId)) {
    state.dismissedAutoOpen.add(id);
    state.openCards.delete(id);
  } else {
    state.dismissedAutoOpen.delete(id);
    state.openCards.add(id);
  }
}

export function clearOpenCards() {
  state.openCards.clear();
  state.dismissedAutoOpen.clear();
}
