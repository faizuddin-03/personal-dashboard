// ── Video-narration + action-spotlight overlay ─────────────
// Injected on every page so the recorded video is easy to follow:
//   • a top caption banner that the run updates as it works
//   • a red pulse on every element the automation clicks/focuses
// Pure browser-side script text; page objects call page.addInitScript(this).

export const OVERLAY_INIT_SCRIPT = () => {
  const ensure = () => {
    if (!document.getElementById('e2e-banner')) {
      const b = document.createElement('div');
      b.id = 'e2e-banner';
      b.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:2147483647;font-family:Inter,Arial,sans-serif;' +
        'background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;padding:9px 16px;font-size:15px;' +
        'font-weight:600;letter-spacing:.2px;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;' +
        'align-items:center;gap:10px;';
      b.innerHTML = '<span id="e2e-badge" style="background:rgba(255,255,255,.22);padding:2px 9px;border-radius:20px;font-size:12px;">E2E</span><span id="e2e-banner-text">Starting…</span>';
      document.documentElement.appendChild(b);
    }
  };
  if (document.body) ensure();
  document.addEventListener('DOMContentLoaded', ensure);
  const style = document.createElement('style');
  style.textContent =
    '.e2e-pulse{outline:3px solid #ff2d55 !important;box-shadow:0 0 0 4px rgba(255,45,85,.28) !important;transition:outline .1s,box-shadow .1s;}';
  document.documentElement.appendChild(style);
  const pulse = (el: unknown) => {
    if (!(el instanceof HTMLElement)) return;
    el.classList.add('e2e-pulse');
    setTimeout(() => el.classList.remove('e2e-pulse'), 700);
  };
  document.addEventListener('click', (e) => pulse(e.target), true);
  document.addEventListener('focusin', (e) => pulse(e.target), true);
};
