let timer;

export function showToast(message, { type = 'info', duration = 2800 } = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  clearTimeout(timer);
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  timer = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, duration);
}
