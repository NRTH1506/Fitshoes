// Lightweight imperative toast — works outside React tree
let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText =
    'position:fixed;bottom:2rem;right:2rem;z-index:99999;display:flex;flex-direction:column;gap:.6rem;pointer-events:none;';
  document.body.appendChild(container);
  return container;
}

export function showToast(text, { duration = 2200, isError = false } = {}) {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = `
    background:${isError ? 'rgba(211,47,47,0.92)' : 'rgba(0,0,0,0.85)'};
    color:#fff;padding:.85rem 1.2rem;border-radius:.6rem;
    font-size:.95rem;font-family:'Be Vietnam Pro',sans-serif;
    box-shadow:0 4px 14px rgba(0,0,0,0.18);pointer-events:auto;
    animation:toastIn .3s ease;max-width:340px;word-break:break-word;
  `;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .35s, transform .35s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 350);
  }, duration);
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('toast-keyframes')) {
  const style = document.createElement('style');
  style.id = 'toast-keyframes';
  style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(style);
}
