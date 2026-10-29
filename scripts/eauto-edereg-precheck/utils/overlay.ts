// ── Action-spotlight overlay for the run video ──────────────
// Pulses every element the automation clicks / focuses / types into, so the
// recorded run is easy to follow. Injected via page.addInitScript.
// Identical to scripts/eauto-estm/utils/overlay.ts — copied rather than
// shared since _reference/ conventions keep each script's suite standalone.
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

// ── Live timestamp overlay for the run video ────────────────
// Burns a small fixed clock onto every recorded frame — added 2026-08-27
// per Faizuddin, specifically so multiple SEPARATELY recorded videos (main
// page + each sub-context — User B, BackOffice, etc.) can be lined up by
// eye when concurrent actions across different browsers/companies happen
// close together in real time. Without a shared, visible clock, two
// separately-published videos give no way to tell what happened
// simultaneously once they're no longer ffmpeg-concatenated into one file
// (see utils/videoManifest.ts's own doc comment for that change).
// Injected via `page.addInitScript`/`context.addInitScript` — re-runs on
// every navigation within that page/context, unlike a one-off DOM
// injection that a page reload would wipe out.
export const TIMESTAMP_OVERLAY_INIT_SCRIPT = () => {
  const render = () => {
    let el = document.getElementById('__qa_timestamp_overlay__');
    if (!el) {
      el = document.createElement('div');
      el.id = '__qa_timestamp_overlay__';
      Object.assign(el.style, {
        position: 'fixed', top: '4px', right: '4px', zIndex: '2147483647',
        background: 'rgba(0,0,0,0.72)', color: '#39ff6a',
        font: '13px/1.3 Consolas, monospace', padding: '3px 8px',
        borderRadius: '4px', pointerEvents: 'none', letterSpacing: '0.02em',
      });
      (document.documentElement || document.body).appendChild(el);
    }
    el.textContent = new Date().toLocaleString('en-GB', { hour12: false });
  };
  render();
  setInterval(render, 1000);
  document.addEventListener('DOMContentLoaded', render);
};
