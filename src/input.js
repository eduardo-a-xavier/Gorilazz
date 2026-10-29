export function createInput({ onManual, onInteract }) {
  const held = new Set(), pointers = new Map();
  const keys = { w: 'throttle', ArrowUp: 'throttle', s: 'brake', ArrowDown: 'brake', a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right' };
  const interactive = target => target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable]');
  const modal = () => Boolean(document.querySelector('dialog[open]'));
  const buttons = [...document.querySelectorAll('[data-drive]')];
  function refresh() {
    const active = new Set([...held, ...pointers.values()]);
    for (const button of buttons) button.setAttribute('aria-pressed', String(active.has(button.dataset.drive)));
    return active;
  }
  function clear() { held.clear(); pointers.clear(); refresh(); }
  window.addEventListener('keydown', event => {
    if (modal() || interactive(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === 'e' && !event.repeat) { event.preventDefault(); onInteract(); }
    if (keys[key]) { event.preventDefault(); held.add(keys[key]); refresh(); onManual(); }
  });
  window.addEventListener('keyup', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (keys[key]) { held.delete(keys[key]); refresh(); }
  });
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  for (const button of buttons) {
    button.addEventListener('pointerdown', event => {
      if (modal() || event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, button.dataset.drive); refresh(); onManual();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => { pointers.delete(event.pointerId); refresh(); });
    button.addEventListener('keydown', event => {
      if ([' ', 'Enter'].includes(event.key) && !modal()) { event.preventDefault(); pointers.set(button, button.dataset.drive); refresh(); onManual(); }
    });
    button.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); pointers.delete(button); refresh(); } });
    button.addEventListener('blur', () => { pointers.delete(button); refresh(); });
  }
  return { clear, read() { const active = refresh(); return { throttle: active.has('throttle'), brake: active.has('brake'), steer: Number(active.has('left')) - Number(active.has('right')), active: active.size > 0 }; } };
}
