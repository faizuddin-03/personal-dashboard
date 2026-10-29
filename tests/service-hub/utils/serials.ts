/**
 * Generates Device Serial No. values that stay unique no matter how many
 * times this suite has already run against the shared environment, or
 * whether someone else's run is executing at the same moment — per
 * knowledge/flow-device-purchase.md, "no two devices can share a serial" is
 * a SYSTEM-WIDE rule, not scoped to one transaction. A hardcoded literal
 * serial (the original "TS01SN0000" style) collides with its own prior run
 * after the very first execution, which trips the app's native duplicate-SN
 * alert() on submit — unhandled, it gets auto-dismissed by Playwright, the
 * popup never actually saves, and Delivery Status is silently left at "New".
 *
 * Combines a millisecond timestamp with random chars (base36) so two
 * processes starting in the same millisecond still don't collide, then pads
 * a per-device index onto it. Always returns exactly 12 characters — within
 * the field's own validated 8-12 character range.
 */
export function uniqueSerials(count: number): string[] {
  const indexWidth = String(Math.max(count - 1, 0)).length;
  const stampLen = 12 - indexWidth;
  const raw = (Date.now().toString(36) + Math.random().toString(36).slice(2))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const stamp = raw.slice(0, stampLen).padEnd(stampLen, "0");
  return Array.from({ length: count }, (_, i) => `${stamp}${i}`);
}

/** Single-serial convenience wrapper. */
export function uniqueSerial(): string {
  return uniqueSerials(1)[0];
}
