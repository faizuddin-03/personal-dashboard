// Tiny DOM confetti. No dependency, no stylesheet: Web Animations API on a
// throwaway fixed layer. Does nothing when the viewer prefers reduced motion.

const COLORS = ["#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444"];

function reducedMotion(): boolean {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  catch { return false; }
}

/** Burst from a point (viewport coords). `big` = the "day cleared" celebration. */
export function burst(x: number, y: number, big = false) {
  if (typeof document === "undefined" || reducedMotion()) return;
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(layer);

  const count = big ? 90 : 18;
  let longest = 0;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = big ? 6 + Math.random() * 6 : 4 + Math.random() * 4;
    const round = Math.random() > 0.5;
    p.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${round ? size : size * 0.45}px;` +
      `background:${COLORS[i % COLORS.length]};border-radius:${round ? "50%" : "2px"};will-change:transform,opacity`;
    layer.appendChild(p);

    const angle = big ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const dist = big ? 160 + Math.random() * 320 : 30 + Math.random() * 50;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const fall = big ? 220 + Math.random() * 200 : 40 + Math.random() * 30;
    const dur = big ? 1400 + Math.random() * 900 : 650 + Math.random() * 300;
    longest = Math.max(longest, dur);
    p.animate(
      [
        { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + fall}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    );
  }
  window.setTimeout(() => layer.remove(), longest + 100);
}

/** Burst from the centre of an element, or the screen centre. */
export function burstFrom(el?: Element | null, big = false) {
  if (typeof window === "undefined") return;
  if (el) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, big);
  } else {
    burst(window.innerWidth / 2, window.innerHeight / 3, big);
  }
}
