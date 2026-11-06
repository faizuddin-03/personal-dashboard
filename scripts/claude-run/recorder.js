async (page) => {
  // ── Claude-driven test recorder (Playwright MCP plugin) ──────────────────
  // Lets Claude run a TS itself in the browser and leave the same evidence as a
  // suite run in demo mode: one 1920x1080 video per TS with amber / green / red
  // highlights (BasePage.demoHighlight look), a step caption bottom-left, a
  // screenshot per check, downloads saved into the TS folder.
  // Guide: knowledge/claude-driven-testing.md
  //
  // Load (once per Claude session, the file path must be inside the repo):
  //   browser_run_code_unsafe  filename: scripts/claude-run/recorder.js
  // Set in a run_code call BEFORE loading:
  //   page.__PASS = '<shared staging BO password>'   REQUIRED for R.doLogin. Never written in
  //       this file (it is pushed to GitHub): take it from the dashboard's own default,
  //       SHARED_STAGING_PASS in app/eauto/12028/Runner.tsx, or ask Faizuddin.
  //   page.__ROOT = '<abs path>/_reference/tickets/<KEY>/claude-run-<date>'   (evidence folder, optional)
  //   page.__BASE = 'https://staging.eauto.my/uat1'                          (BO base, optional)
  // Then per TS: R = page.__R; await R.start('<TS>'); … R.doLogin / R.openListing /
  // R.click / R.check / R.download …; await R.stop()  (writes <TS>.webm).
  // globalThis does NOT persist between run_code calls; page.__R does.
  const browser = page.context().browser();
  // Default evidence folder for the EAINT-12028 run of 2026-11-04 on the second laptop (user "faizu").
  // On the main laptop (user "Faizuddin") set page.__ROOT first.
  const ROOT = 'C:/Users/faizu/Documents/GitHub/personal-dashboard/_reference/tickets/EAINT-12028/claude-run-2026-11-04';
  const palette = { amber: '#f59e0b', green: '#22c55e', red: '#ef4444' };
  const R = page.__R = { ROOT: page.__ROOT || ROOT, BASE: page.__BASE || 'https://staging.eauto.my/uat1', PASS: page.__PASS || '', HOLD: 1200 };

  R.start = async (ts) => {
    if (R.ctx) { try { await R.ctx.close(); } catch {} }
    R.ts = ts; R.dir = `${R.ROOT}/${ts}`; R.shots = 0; R.log = [];
    R.ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true, recordVideo: { dir: R.dir, size: { width: 1920, height: 1080 } } });
    R.ctx.setDefaultTimeout(30000);
    R.page = await R.ctx.newPage();
    R.ctx.on('page', (pg) => { R.lastPopup = pg; });
    return R.dir;
  };

  // Step caption, bottom-left of every frame
  R.caption = async (text, color = '#f59e0b') => {
    R.log.push(text);
    try {
      await R.page.evaluate(({ t, ts, color }) => {
        let d = document.getElementById('__cap');
        if (!d) { d = document.createElement('div'); d.id = '__cap'; document.body.appendChild(d); }
        d.style.cssText = `position:fixed;left:12px;bottom:12px;z-index:2147483647;background:rgba(15,23,42,.9);color:#fff;font:600 16px Segoe UI,Arial;padding:9px 14px;border-radius:6px;max-width:1100px;pointer-events:none;border-left:6px solid ${color}`;
        d.textContent = ts + ' · ' + t;
      }, { t: text, ts: R.ts, color });
    } catch {}
  };

  // Same look as BasePage.demoHighlight: 3px outline + 4px glow, amber/green/red
  R.hl = async (target, color = 'amber', hold) => {
    const loc = (typeof target === 'string' ? R.page.locator(target) : target).first();
    const c = palette[color];
    try {
      await loc.scrollIntoViewIfNeeded({ timeout: 4000 });
      const h = await loc.elementHandle({ timeout: 4000 });
      await R.page.evaluate(({ node, c }) => {
        node.__p = [node.style.outline, node.style.boxShadow, node.style.outlineOffset];
        node.style.outline = `3px solid ${c}`; node.style.outlineOffset = '2px'; node.style.boxShadow = `0 0 0 4px ${c}66`;
        node.scrollIntoView({ block: 'center' });
      }, { node: h, c });
      await R.page.waitForTimeout(hold ?? R.HOLD);
      R._last = h; return true;
    } catch (e) { return 'hl-fail: ' + e.message.split('\n')[0]; }
  };
  R.unhl = async () => {
    try { if (R._last) await R.page.evaluate((n) => { if (n.__p) { [n.style.outline, n.style.boxShadow, n.style.outlineOffset] = n.__p; } }, R._last); } catch {}
    R._last = null;
  };
  R.click = async (target, text) => {
    if (text) await R.caption(text);
    const loc = (typeof target === 'string' ? R.page.locator(target) : target).first();
    await R.hl(loc, 'amber'); await R.unhl(); await loc.click();
  };
  // Observed result: green when it matches, red when it does not. Keeps the
  // highlight on while the screenshot is taken.
  R.check = async (target, text, ok = true, name) => {
    await R.caption((ok ? '✔ ' : '✘ ') + text, ok ? '#22c55e' : '#ef4444');
    const r = await R.hl(target, ok ? 'green' : 'red', 1800);
    const f = await R.shot(name || (ok ? 'ok' : 'FAIL'));
    await R.unhl(); return r === true ? f : r;
  };
  R.shot = async (name) => {
    R.shots++;
    const f = `${R.dir}/${String(R.shots).padStart(2, '0')}-${name || 'step'}.png`;
    await R.page.screenshot({ path: f }); return f;
  };

  R.doLogin = async (user) => {
    if (!R.PASS) throw new Error('No password: set page.__PASS before loading the recorder (see the header of scripts/claude-run/recorder.js).');
    const p = R.page;
    await p.goto(`${R.BASE}/public/login/`, { waitUntil: 'load' });
    await R.caption(`Log in to BackOffice uat1 as ${user}`);
    const u = p.locator('input[name="username"], input[placeholder="Username"]').first();
    await R.hl(u, 'amber', 700); await u.fill(user); await R.unhl();
    const pw = p.locator('input[name="password"], input[placeholder="Password"]').first();
    await R.hl(pw, 'amber', 700); await pw.fill(R.PASS); await R.unhl();
    await R.click(p.locator('button:has-text("Login"), input[type="submit"], button[type="submit"]'), 'Click Login');
    await p.waitForLoadState('load');
    const name = await p.locator('span.user-name').first().textContent({ timeout: 15000 }).catch(() => null);
    return { url: p.url(), name: name && name.trim() };
  };

  // BO Logout from BO Home. The link asks "Sure to logout?" (browser confirm); an unanswered confirm is
  // dismissed = Cancel and the user stays logged in, so accept it like a person clicking OK.
  // Returns the URL after logout (expected .../public/login/).
  R.logout = async () => {
    const p = R.page;
    if (!/\/uat1\/home\//.test(p.url())) { await p.goto(`${R.BASE}/home/`, { waitUntil: 'load' }); }
    const once = async (d) => { R.lastLogoutDialog = d.message(); await p.waitForTimeout(700); await d.accept().catch(() => {}); };
    p.once('dialog', once);
    await R.click(p.getByRole('link', { name: 'Logout', exact: true }), 'Click Logout, then OK on "Sure to logout?"');
    await p.waitForURL(/public\/login/, { timeout: 15000 }).catch(() => {});
    await p.waitForTimeout(1500);
    if (!/public\/login/.test(p.url())) throw new Error('Logout did not reach the login page: ' + p.url());
    return p.url();
  };

  R.reportsBlock = () => R.page.locator('span.category', { hasText: /^\s*Reports\s*$/ }).locator('xpath=..');
  R.listingLink = () => R.reportsBlock().getByRole('link', { name: 'Association Payment Listing', exact: true });

  // BO home → Reports → Association Payment Listing; follows a new tab if one opens.
  R.openListing = async () => {
    await R.caption('BO Home → Reports menu');
    await R.hl(R.reportsBlock().first(), 'amber'); await R.unhl();
    const link = R.listingLink();
    if (!(await link.count()) || !(await link.first().isVisible())) return { linkVisible: false };
    R.lastPopup = null;
    await R.click(link, 'Click "Association Payment Listing" under Reports');
    await R.page.waitForTimeout(2500);
    if (R.lastPopup) { R.page = R.lastPopup; }
    await R.page.waitForLoadState('load');
    await R.page.waitForTimeout(1500);
    return { linkVisible: true, newTab: !!R.lastPopup, url: R.page.url(), title: await R.page.title() };
  };

  R.text = async (sel = 'body', n = 2500) => (await R.page.locator(sel).first().innerText().catch(() => '')).slice(0, n);

  // Clicks a download button (highlighted) and saves the file into the TS folder
  // as NN-<name><ext>, keeping the server's file name in the return value.
  R.download = async (target, text, name) => {
    const loc = (typeof target === 'string' ? R.page.locator(target) : target).first();
    const wait = R.page.waitForEvent('download', { timeout: 60000 });
    await R.click(loc, text);
    const d = await wait;
    const suggested = d.suggestedFilename();
    const ext = (suggested.match(/\.[A-Za-z0-9]+$/) || ['.pdf'])[0];
    R.shots++;
    const f = `${R.dir}/${String(R.shots).padStart(2, '0')}-${name || 'download'}${ext}`;
    await d.saveAs(f);
    return { file: f, serverName: suggested, failure: await d.failure() };
  };

  // Ends the TS: closes the context so the video is written. Saves each video
  // as a copy named <TS>.webm (or <TS>-tab2.webm for an extra tab) and returns the paths.
  R.stop = async () => {
    const vids = [];
    for (const pg of R.ctx.pages()) if (pg.video()) vids.push(pg.video());
    if (R._closedVids) vids.push(...R._closedVids);
    await R.ctx.close(); R.ctx = null;
    const out = [];
    let i = 0;
    for (const v of vids) {
      i++;
      const f = `${R.dir}/${R.ts}${i > 1 ? '-tab' + i : ''}.webm`;
      try { await v.saveAs(f); await v.delete(); out.push(f); } catch (e) { out.push('video-fail: ' + e.message.split('\n')[0]); }
    }
    return out;
  };
  // ── EAINT-12028 Association Payment Listing helpers (live DOM after the 2026-11-03 rebuild) ──
  R.MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  R.APL = 'https://staging.eauto.my/backoffice/admin/association';
  R.goMonth = async (month, year = 2026) => {
    await R.caption(`Open ${month} ${year} Details`);
    await R.page.goto(`${R.APL}/${year}/${R.MONTHS.indexOf(month) + 1}`, { waitUntil: 'load' });
    await R.page.waitForTimeout(2000);
  };
  // Opens a month by clicking its View link on the Summary (what a person does).
  R.viewMonth = async (month) => {
    const p = R.page;
    if (!/\/backoffice\/admin\/association(\?|$)/.test(p.url())) { await p.goto(`${R.APL}?year=2026`, { waitUntil: 'load' }); await p.waitForTimeout(1500); }
    const row = p.locator('table tr', { has: p.locator('td', { hasText: new RegExp('^' + month + '$') }) });
    await R.hl(row, 'amber', 700); await R.unhl();
    await R.click(row.getByText('View', { exact: true }), `Click [View] on ${month} 2026`);
    await p.waitForLoadState('load'); await p.waitForTimeout(2000);
  };
  R.state = async () => R.page.evaluate(() => {
    const chip = (r) => { const e = document.querySelector(`#chip-${r} .ap-chip-status`); return e ? e.innerText.trim().replace(/\s+/g, ' ') : null; };
    const ap = document.querySelector('#action-panel');
    const note = document.querySelector('#ap-note .ap-note-text') || document.querySelector('#ap-note');
    const t = document.querySelector('#tbl-log');
    const log = t ? [...t.querySelectorAll('tr')].slice(1).map(tr => [...tr.querySelectorAll('td')].map(c => c.innerText.trim().replace(/\s+/g, ' '))).filter(r => r.length > 1) : [];
    const pdf = document.querySelector('#pdf-bar');
    return {
      drafter: chip('drafter'), reviewer: chip('reviewer'), approver: chip('approver'),
      buttons: ap ? [...ap.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.innerText.trim()) : [],
      note: note ? note.innerText.trim().replace(/\s+/g, ' ') : null,
      log, // [When, Actor, Role, Action, Payment Date, Remarks], newest first
      pdf: pdf ? pdf.innerText.trim().replace(/\s+/g, ' ') : null,
      pdfLinks: pdf ? [...pdf.querySelectorAll('a,button')].filter(b => b.offsetParent).map(b => b.innerText.trim()) : [],
    };
  });
  R.btn = (name) => R.page.locator('#action-panel button', { hasText: new RegExp('^\\s*' + name + '\\s*$') });
  // Collects alert/confirm messages; accepts confirms (the person clicking OK).
  R.dialogs = [];
  R.watchDialogs = () => { if (R._dw === R.page) return; R._dw = R.page; R.page.on('dialog', async d => { R.dialogs.push(`${d.type()}: ${d.message()}`); try { await d.accept(); } catch {} }); };
  R.drawSignature = async () => {
    const pad = R.page.locator('#sig-pad'); const box = await pad.boundingBox();
    if (!box) throw new Error('#sig-pad has no size on screen');
    await R.hl(pad, 'amber', 600); await R.unhl();
    const m = R.page.mouse;
    await m.move(box.x + box.width * 0.15, box.y + box.height * 0.6); await m.down();
    for (let i = 1; i <= 12; i++) await m.move(box.x + box.width * (0.15 + i * 0.055), box.y + box.height * (0.6 - Math.sin(i / 2) * 0.25), { steps: 3 });
    await m.up();
  };
  // [Approve] for Drafter / Reviewer; signs on the pad only if it appears. Returns { padShown }.
  R.approve = async (label = 'Click [Approve]') => {
    R.watchDialogs();
    await R.click(R.btn('Approve'), label);
    const sig = R.page.locator('#sig-modal');
    const padShown = await sig.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false);
    if (padShown) {
      await R.caption('Signature pad shown: sign and click [Save & Approve]');
      await R.drawSignature();
      await R.click(sig.getByRole('button', { name: 'Save & Approve', exact: true }), 'Click [Save & Approve]');
      await sig.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }
    await R.page.waitForTimeout(2500);
    return { padShown };
  };
  R.kiv = async (label = 'Click [KIV]') => {
    R.watchDialogs();
    await R.click(R.btn('KIV'), label);
    const c = R.page.locator('.ui-dialog:visible .confirm-dialog-btn');
    if (await c.first().isVisible({ timeout: 2000 }).catch(() => false)) await R.click(c.first(), 'Confirm KIV');
    await R.page.waitForTimeout(2500);
  };
  R.undoKiv = async (label = 'Click [Undo KIV]') => {
    R.watchDialogs();
    await R.click(R.btn('Undo KIV'), label);
    const c = R.page.locator('.ui-dialog:visible .confirm-dialog-btn');
    if (await c.first().isVisible({ timeout: 2000 }).catch(() => false)) await R.click(c.first(), 'Confirm Undo KIV');
    await R.page.waitForTimeout(2500);
  };
  // Opens the Reject popup; returns the popup state. Use R.rejectSubmit to finish.
  R.rejectOpen = async () => {
    R.watchDialogs();
    await R.click(R.btn('Reject'), 'Click [Reject]');
    const m = R.page.locator('#rmk-modal');
    await m.waitFor({ state: 'visible', timeout: 10000 });
    return { submitDisabled: await R.page.locator('#rmk-submit').isDisabled() };
  };
  R.rejectType = async (text) => {
    const t = R.page.locator('#rmk-text'); await R.hl(t, 'amber', 600); await t.fill(text); await R.unhl();
    return { submitDisabled: await R.page.locator('#rmk-submit').isDisabled() };
  };
  R.rejectSubmit = async () => {
    await R.click('#rmk-submit', 'Click [Submit Reject]');
    await R.page.locator('#rmk-modal').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await R.page.waitForTimeout(2500);
  };
  // Approver [Approve]: sign if the pad appears, then the payment-date popup.
  // The date field blocks typing and pasting (onkeydown / onpaste return false), so the value
  // is SET directly (Playwright fill on a native date input), the only scriptable way; a
  // person uses the browser's date picker. Use it for setup steps; say so when a TS uses it.
  // `dateISO` = 'YYYY-MM-DD'. Returns { padShown, dateModal, dialogs }.
  R.approverApprove = async (dateISO, label = 'Click [Approve]') => {
    R.watchDialogs();
    await R.click(R.btn('Approve'), label);
    const sig = R.page.locator('#sig-modal'), dm = R.page.locator('#date-modal');
    const first = await Promise.race([
      sig.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'sig', () => null),
      dm.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'date', () => null),
    ]);
    let padShown = false;
    if (first === 'sig') {
      padShown = true;
      await R.caption('Signature pad shown: sign and click [Save & Approve]');
      await R.drawSignature();
      await R.click(sig.getByRole('button', { name: 'Save & Approve', exact: true }), 'Click [Save & Approve]');
      await dm.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    }
    const dateModal = await dm.isVisible().catch(() => false);
    if (dateModal) {
      const pd = R.page.locator('#pay-date');
      await R.caption(`Payment date popup: set ${dateISO} (date picker value set directly)`);
      await R.hl(pd, 'amber', 800); await pd.fill(dateISO); await R.unhl();
      await R.click(dm.getByRole('button', { name: 'Confirm Approve', exact: true }), 'Click [Confirm Approve]');
      await dm.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }
    await R.page.waitForTimeout(2500);
    return { padShown, dateModal, dialogs: R.dialogs.splice(0) };
  };
  // Wording evidence: a tight, cropped screenshot with a solid red (ok=false) or green (ok=true) box
  // drawn around exactly `target`, plus a small label tag above it. `ctx` = the area to keep around it
  // (defaults to the target itself); the crop is that area padded by `pad` px. Works on any page,
  // including the SA mock-up. Returns the file path.
  R.boxShot = async (target, name, { ok = false, ctx, label, pad = 28 } = {}) => {
    const p = R.page;
    const loc = (typeof target === 'string' ? p.locator(target) : target).first();
    await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    const c = ok ? '#16a34a' : '#dc2626';
    const h = await loc.elementHandle({ timeout: 5000 });
    await p.evaluate(({ node, c, label }) => {
      node.scrollIntoView({ block: 'center' });
      const r = node.getBoundingClientRect();
      const b = document.createElement('div'); b.className = '__wbox';
      b.style.cssText = `position:fixed;left:${r.left - 5}px;top:${r.top - 5}px;width:${r.width + 10}px;height:${r.height + 10}px;border:4px solid ${c};border-radius:4px;z-index:2147483646;pointer-events:none;box-sizing:border-box`;
      document.body.appendChild(b);
      if (label) {
        const t = document.createElement('div'); t.className = '__wbox';
        t.style.cssText = `position:fixed;left:${r.left - 5}px;top:${Math.max(0, r.top - 34)}px;background:${c};color:#fff;font:600 14px Segoe UI,Arial;padding:4px 9px;border-radius:4px;z-index:2147483647;pointer-events:none;white-space:nowrap`;
        t.textContent = label; document.body.appendChild(t);
      }
    }, { node: h, c, label });
    await p.waitForTimeout(250);
    const area = ctx ? (typeof ctx === 'string' ? p.locator(ctx) : ctx).first() : loc;
    const bx = await area.boundingBox(); const ex = await loc.boundingBox();
    const vp = p.viewportSize();
    const x1 = Math.max(0, Math.min(bx.x, ex.x) - pad), y1 = Math.max(0, Math.min(bx.y, ex.y) - pad - 34);
    const x2 = Math.min(vp.width, Math.max(bx.x + bx.width, ex.x + ex.width) + pad), y2 = Math.min(vp.height, Math.max(bx.y + bx.height, ex.y + ex.height) + pad);
    R.shots++;
    const f = `${R.dir}/${String(R.shots).padStart(2, '0')}-${name}.png`;
    await p.screenshot({ path: f, clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } });
    await p.evaluate(() => document.querySelectorAll('.__wbox').forEach(e => e.remove()));
    return f;
  };
  // Browser alerts cannot be screenshotted: this draws the alert's exact text into the page as a box
  // ("Browser alert:" + text) so R.boxShot can capture it. Returns a locator for the box.
  R.alertCard = async (text) => {
    await R.page.evaluate((t) => {
      const d = document.createElement('div'); d.id = '__alert';
      d.style.cssText = 'position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);background:#fff;color:#111;font:16px Segoe UI,Arial;padding:18px 22px;border:1px solid #999;box-shadow:0 8px 30px rgba(0,0,0,.35);z-index:2147483645;max-width:640px';
      d.innerHTML = '<div style="font:600 12px Segoe UI,Arial;color:#666;margin-bottom:6px">Browser alert (text copied exactly from the alert box)</div>';
      const s = document.createElement('div'); s.id = '__alert-text'; s.textContent = t; d.appendChild(s);
      document.body.appendChild(d);
    }, text);
    return R.page.locator('#__alert-text');
  };
  R.clearAlertCard = () => R.page.evaluate(() => document.getElementById('__alert')?.remove());

  R.isoDate = (addDays = 0) => { const d = new Date(); d.setDate(d.getDate() + addDays); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  R.today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; };
  // Rows in the Audit Log for role+action (case-insensitive, e.g. 'Drafter','Approved').
  R.logCount = (st, role, action) => st.log.filter(r => (r[2] || '').toLowerCase() === role.toLowerCase() && (r[3] || '').toLowerCase().startsWith(action.toLowerCase())).length;

  return 'recorder ready';
}
