// ── Action-spotlight overlay for the eSTM video ────────────
// Pulses every element the automation clicks / focuses / types into, so the
// recorded run is easy to follow. Injected via page.addInitScript.
export const OVERLAY_INIT_SCRIPT = () => {
  const style = document.createElement('style');
  style.textContent = `
    .pw-action-highlight {
      outline: 3px solid #ff2d55 !important;
      box-shadow: 0 0 0 4px rgba(255, 45, 85, 0.25) !important;
      transition: outline 0.12s ease, box-shadow 0.12s ease;
    }
  `;
  document.documentElement.appendChild(style);
  const pulse = (el: unknown) => {
    if (!(el instanceof HTMLElement)) return;
    el.classList.add('pw-action-highlight');
    window.setTimeout(() => el.classList.remove('pw-action-highlight'), 650);
  };
  document.addEventListener('click', (e) => pulse(e.target), true);
  document.addEventListener('focusin', (e) => pulse(e.target), true);
  document.addEventListener('input', (e) => pulse(e.target), true);
};
