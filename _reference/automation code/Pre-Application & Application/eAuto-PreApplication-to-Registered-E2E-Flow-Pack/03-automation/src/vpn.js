/**
 * Is the corporate network actually reachable?
 *
 * WHY THIS IS A MODULE AND NOT AN INLINE try/catch
 *
 * The support tool (src/support.js) lives on a PRIVATE address — 172.30.202.23 —
 * that only exists inside the company network. Off VPN, every failure mode it
 * produces is a lie about the feature:
 *
 *   - `page.goto` on an unroutable host hangs for the full navigation timeout and
 *     then reports "Timeout 30000ms exceeded", which reads as a slow server.
 *   - On some networks the ISP's DNS/captive layer answers instead, so the page
 *     LOADS, has no form on it, and the harness reports "no expiry field on the
 *     reset-expiry page" — a missing-feature bug against a page we never reached.
 *   - Chromium's own error page is a real document, so a bytes-based "did we get
 *     a page" check (the one src/obs.js uses for /obs) passes on it.
 *
 * A TCP connect answers in milliseconds and cannot be confused with any of that.
 * So: probe the socket first, and if it is shut, say VPN — by name — instead of
 * letting Playwright invent a diagnosis.
 *
 * This module deliberately does NOT connect the VPN. FortiClient wants a
 * password and (on this tenant) a second factor; typing either from a script
 * would put a credential in a place nothing here is allowed to keep one. The
 * preflight's job is to fail loudly and tell the operator which button to press.
 */
const net = require('node:net');
const { execFileSync } = require('node:child_process');

/**
 * Can we open a TCP connection to host:port?
 *
 * Resolves `{ ok, ms, code }` and never rejects — a preflight that throws on
 * ECONNREFUSED is just a second thing to wrap.
 */
function probe(host, port, timeoutMs = 4_000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    let settled = false;
    const done = (ok, code) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, ms: Date.now() - started, code: code || null });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false, 'ETIMEDOUT'));
    socket.once('error', (e) => done(false, e.code || String(e.message || e)));
    socket.connect({ host, port });
  });
}

/**
 * What the machine's network looks like right now — diagnostics only, gathered
 * ONLY on the failure path because each PowerShell call costs a few hundred ms.
 *
 * Reported rather than judged: "is this IP the VPN's" is not knowable from here
 * (the tunnel's address range is a site decision), so the error prints what it
 * found and lets the reader recognise it.
 */
function localState() {
  const ps = (cmd) => {
    try {
      return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], {
        encoding: 'utf-8', timeout: 15_000, windowsHide: true,
      }).trim();
    } catch { return ''; }
  };

  const ips = ps("Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.254.*' } | " +
    "ForEach-Object { $_.IPAddress + ' (' + $_.InterfaceAlias + ')' }")
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  // FortiClient runs several processes; FortiSSLVPNdaemon is present whether or
  // not a tunnel is up, so its presence proves the CLIENT is installed and
  // running, NOT that the tunnel is connected. Only the socket probe proves that.
  const procs = ps("Get-Process | Where-Object { $_.ProcessName -match 'forti|anyconnect|globalprotect|openvpn|wireguard|pulse' } | " +
    'ForEach-Object { $_.ProcessName } | Sort-Object -Unique')
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

  return { ips, procs, client: procs.some((p) => /forti/i.test(p)) ? 'FortiClient VPN' : (procs[0] || null) };
}

/** The message an operator can act on without reading this file. */
function offVpnError(host, port, result) {
  const s = localState();
  const lines = [
    `${host}:${port} is not reachable (${result.code || 'no connect'} after ${result.ms} ms) — the VPN is not connected.`,
    '',
    'The eAuto support tool lives on a private address that only routes inside the',
    'company network. Nothing on this side can be tested until the tunnel is up.',
    '',
    s.client
      ? `  1. Open ${s.client} (it is running) and connect the tunnel.`
      : '  1. Connect the corporate VPN (FortiClient VPN on this machine).',
    '  2. Re-run this command. The preflight takes milliseconds; it is not a retry loop.',
    '',
    `Local IPv4 right now: ${s.ips.length ? s.ips.join(', ') : '(none found)'}`,
  ];
  if (s.procs.length) lines.push(`VPN client processes seen: ${s.procs.join(', ')}`);
  lines.push('', 'Set SUPPORT_BASE if the tool has moved to a different host or port.');
  const e = new Error(lines.join('\n'));
  e.code = 'VPN_DOWN';
  e.probe = result;
  return e;
}

/**
 * Throw unless host:port answers. Returns the probe result on success so callers
 * can log the latency (a 3-second connect on a VPN is worth seeing in a log).
 */
async function requireReachable(host, port, timeoutMs) {
  const result = await probe(host, port, timeoutMs);
  if (!result.ok) throw offVpnError(host, port, result);
  return result;
}

module.exports = { probe, requireReachable, offVpnError, localState };
