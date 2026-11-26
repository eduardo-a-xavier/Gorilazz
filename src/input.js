export function numericShortcutIndex(key, total) {
  if (!/^[1-9]$/.test(key)) return -1;
  const index = Number(key) - 1;
  return index < total ? index : -1;
}

export function createInput({ onManual, onInteract, enabled = () => true, driftEnabled = () => true }) {
  const held = new Set(), pointers = new Map();
  let wheelSteer = 0;
  const keys = { w: 'throttle', ArrowUp: 'throttle', s: 'brake', ArrowDown: 'brake', a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right' };
  const interactive = target => target instanceof Element && target.closest('input, textarea, select, button, a, [contenteditable]');
  const modal = () => Boolean(document.querySelector('dialog[open]'));
  const buttons = [...document.querySelectorAll('[data-drive]')];
  function refresh() {
    const active = new Set([...held, ...pointers.values()]);
    for (const button of buttons) button.setAttribute('aria-pressed', String(active.has(button.dataset.drive)));
    return active;
  }
  function clear() { held.clear(); pointers.clear(); wheelSteer = 0; refresh(); }
  // Espaço e Shift (esquerdo/direito) acionam drift/cantar pneu; diálogos e campos mantêm seus atalhos.
  const isDriftCode = code => code === 'Space' || code === 'ShiftLeft' || code === 'ShiftRight';
  window.addEventListener('keydown', event => {
    if (!isDriftCode(event.code) || !enabled() || modal() || document.querySelector('[role=dialog]:not([hidden])') || event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (event.code === 'Space') { event.preventDefault(); event.stopImmediatePropagation(); }
    if (driftEnabled()) { held.add('drift'); refresh(); }
  }, true);
  window.addEventListener('keyup', event => { if (isDriftCode(event.code)) { held.delete('drift'); refresh(); } }, true);
  window.addEventListener('keydown', event => {
    if (!enabled() || modal() || interactive(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
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
  return { clear, setWheelSteer(value) { wheelSteer = Math.max(-1, Math.min(1, value)); if (wheelSteer) onManual(); }, read() { const active = refresh(); return { throttle: active.has('throttle'), brake: active.has('brake'), drift: active.has('drift') && driftEnabled(), steer: active.has('left') || active.has('right') ? Number(active.has('left')) - Number(active.has('right')) : wheelSteer, active: [...active].some(key => key !== 'drift') || Math.abs(wheelSteer) > .05 }; } };
}
