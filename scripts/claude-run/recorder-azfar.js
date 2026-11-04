async (page) => {
  // ── Claude-driven recorder, AZFAR STYLE (EAINT-12406, Faizuddin 2026-11-04: "for the recording on this
  // one, i want you to follow Azfar's style of recording") ─────────────────────────────────────────────
  // Copies the look of Azfar's `ts` fixture (scripts/eauto-12406/automation/src/fixtures/ts-run.ts,
  // highlight.ts, window-video.ts):
  //   - one 1920x1080 video per TS, starting and ending on a navy (#172B4D) full-screen title card;
  //   - a "Now: Secarang" / "Now: CIBO" card at every switch between sites;
  //   - a live "● REC hh:mm:ss" clock at top centre on every page, so a wait does not look frozen;
  //   - every proof: a red (#DE350B) box round the element(s) plus a navy banner along the bottom
  //     ("<time> MYT · staging/ia · <side> · <path> · <TS> · E1: <what it shows>"), held 1.2 s, then a screenshot;
  //   - the Fiuu payment window: its own video, laid into the TS video afterwards as a picture-in-picture
  //     at the bottom right with an orange frame (scripts/claude-run/merge-window-video.mjs);
  //   - files in the TS folder: NN-<name>.png, video_<TS>.webm, checks.txt and proofs.json
  //     (scripts/claude-run/finish-ts.mjs), and the receipt PDF and other downloads in downloadable/.
  //
  // Load with: browser_run_code_unsafe  filename: scripts/claude-run/recorder-azfar.js
  // Before loading it, set this in a run_code call:
  //   page.__ROOT = '<abs>/_reference/tickets/EAINT-12406/claude-run-2026-11-04'
  // Optionally also: page.__INST = 'ia'.
  // Per TS:
  //   R = page.__R; await R.start('12406_E2E_TS1', '<situation>', points)
  //   R.site('Secarang', why) / R.portal('CIBO', why)
  //   R.click(loc, note) / R.fill(loc, value, note) / R.prove('E1', { shows, match, hl, name, expected })
  //   R.shot(name, what, hl) / R.download(loc, name) / R.payWindow(true|false)
  //   await R.finish()
  // finish() returns { log, proofs, notes, windows, videos }. Claude then runs, from the shell:
  //   node scripts/claude-run/finish-ts.mjs <TS folder> <json of that return>
  // That writes checks.txt and proofs.json and merges the payment window into the TS video.
  // Runs in a sandbox: no node:fs here. Files are written only through Playwright
  // (screenshot path, video.saveAs, download.saveAs).
  const browser = page.context().browser();
  const NAVY = '#172B4D', RED = '#DE350B';
  const R = page.__R = { ROOT: page.__ROOT || '', INST: page.__INST || 'ia', HOLD: 1200 };
  const myt = () => new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const slug = (s) => String(s).replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  const pathOf = (u) => { try { return new URL(u).pathname; } catch { return ''; } };
  const loc = (t) => (typeof t === 'string' ? R.page.locator(t) : t);

  R.start = async (ts, situation = '', points = []) => {
    if (!R.ROOT) throw new Error('Set page.__ROOT before loading recorder-azfar.js');
    if (R.ctx) { try { await R.ctx.close(); } catch {} }
    Object.assign(R, { ts, situation, points, dir: `${R.ROOT}/${ts}`, n: 0, log: [], proofs: [], notes: [], windows: [], side: '', confirmOk: false, dialogs: [] });
    R.ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, acceptDownloads: true, recordVideo: { dir: `${R.ROOT}/${ts}/_raw`, size: { width: 1920, height: 1080 } } });
    R.ctx.setDefaultTimeout(30000);
    // Live clock, as in Azfar's ts.start()
    await R.ctx.addInitScript(() => {
      const tick = () => {
        if (!document.body) return;
        let d = document.getElementById('qa-rec-clock');
        if (!d) {
          d = document.createElement('div'); d.id = 'qa-rec-clock';
          Object.assign(d.style, { position: 'fixed', top: '2px', left: '50%', transform: 'translateX(-50%)', zIndex: '2147483646',
            background: 'rgba(23,43,77,.75)', color: '#fff', font: 'bold 11px Arial', padding: '1px 8px', borderRadius: '8px', pointerEvents: 'none' });
          document.body.appendChild(d);
        }
        d.textContent = '● REC ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour12: false });
      };
      setInterval(tick, 1000); document.addEventListener('DOMContentLoaded', tick);
    });
    R.page = await R.ctx.newPage();
    R.t0 = Date.now();
    R.page.on('dialog', async (d) => {
      R.dialogs.push(`${d.type()}: ${d.message()}`); R.note(`dialog ${d.type()}: ${d.message()}`);
      if (d.type() === 'confirm' && !R.confirmOk) await d.dismiss().catch(() => {}); else await d.accept().catch(() => {});
    });
    // A window the site opens (Fiuu) is kept open and timed, so it can be laid into the TS video.
    R.ctx.on('page', (pg) => {
      if (pg === R.page) return;
      const w = { at: (Date.now() - R.t0) / 1000, url: '', closedAt: null, page: pg };
      pg.once('close', () => { w.closedAt = (Date.now() - R.t0) / 1000; });
      pg.once('domcontentloaded', () => { w.url = pg.url(); });
      R.windows.push(w); R.lastPopup = pg;
      R.note(`window opened by the site and kept (payment window ${R.windows.length})`);
    });
    await R.page.setContent(`<html><body style='margin:0;background:${NAVY}'></body></html>`);
    await R.page.waitForTimeout(600);
    R.log.push(`# ${ts} — ${situation}`);
    R.log.push(`# Claude-driven run (Playwright MCP) on staging /${R.INST}, started ${myt()} MYT`);
    R.log.push('# lines: when | point | expected | page shows | matches | screenshot');
    await R.card(ts, situation, `staging /${R.INST} · ${myt()} MYT`);
    return R.dir;
  };

  R.note = (t) => { R.notes.push(t); R.log.push(`${myt()} | note: ${t}`); };

  // Full-screen title card on a blank page (Azfar's ts.card)
  R.card = async (big, l2 = '', l3 = '', ms = 2200) => {
    await R.page.setContent(`<html><body style="margin:0;background:${NAVY};color:#fff;font-family:Arial;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="text-align:center;max-width:1500px"><div style="font-size:54px;font-weight:bold">${esc(big)}</div>
      <div style="font-size:30px;margin-top:22px">${esc(l2)}</div><div style="font-size:22px;margin-top:16px;opacity:.8">${esc(l3)}</div></div></body></html>`);
    await R.page.waitForTimeout(ms);
  };
  // Switch sites behind a card; cookies cleared so the site gate / login shows again (ts.site / ts.portal)
  R.site = async (name, why = '', url = '') => {
    await R.card(`Now: ${name}`, why, `${url || name} · no user login`, 1800);
    await R.ctx.clearCookies(); R.side = name; R.note(`on the site: ${name}${url ? ' (' + url + ')' : ''}`);
  };
  R.portal = async (name, why = '', who = '') => {
    await R.card(`Now: ${name}`, why, who ? `signing in as ${who}` : '', 1800);
    await R.ctx.clearCookies(); R.side = name; R.note(`portal: ${name}${who ? ' (' + who + ')' : ''}`);
  };
  R.offscreen = async (what, detail = '') => { await R.card(what, detail, myt() + ' MYT', 1800); R.note(`off screen: ${what}${detail ? ' — ' + detail : ''}`); };

  // Actions: Azfar's videos show the action itself; a short red/yellow highlight.ts mark shows where.
  R.mark = async (t, label = '', ms = 700) => {
    const l = loc(t).first();
    try {
      await l.scrollIntoViewIfNeeded({ timeout: 4000 });
      await l.evaluate((e, label) => {
        e.setAttribute('data-qa-hl-el', '1'); e.style.outline = '3px solid #e11d48'; e.style.outlineOffset = '2px'; e.style.backgroundColor = 'rgba(250, 204, 21, 0.35)';
        if (label) { const r = e.getBoundingClientRect(); const b = document.createElement('div'); b.setAttribute('data-qa-hl', '1'); b.textContent = label;
          b.style.cssText = 'position:absolute;z-index:2147483647;background:#e11d48;color:#fff;font:bold 12px/1.4 system-ui,sans-serif;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.4)';
          b.style.left = Math.max(0, r.left + scrollX) + 'px'; b.style.top = Math.max(0, r.top + scrollY - 20) + 'px'; document.body.appendChild(b); }
      }, label);
      await R.page.waitForTimeout(ms);
    } catch {}
  };
  R.clear = async (pg = R.page) => pg.evaluate(() => {
    document.querySelectorAll('[data-qa-hl],.qa-mark').forEach((b) => b.remove());
    document.querySelectorAll('[data-qa-hl-el]').forEach((e) => { e.style.outline = ''; e.style.outlineOffset = ''; e.style.backgroundColor = ''; e.removeAttribute('data-qa-hl-el'); });
  }).catch(() => {});
  R.click = async (t, note = '') => { const l = loc(t).first(); await R.mark(l, note); await R.clear(); await l.click(); if (note) R.note(`click: ${note}`); };
  R.fill = async (t, v, note = '') => { const l = loc(t).first(); await R.mark(l, note); await l.fill(v); await R.clear(); if (note) R.note(`typed: ${note}`); };

  // Numbered screenshot with red boxes + bottom banner (Azfar's ts.shot). pg = another page (e.g. the Fiuu window).
  R.shot = async (name, what, hl, pg = R.page) => {
    R.n += 1; const file = `${String(R.n).padStart(2, '0')}-${slug(name)}.png`;
    const marks = Array.isArray(hl) ? hl : hl ? [hl] : [];
    let first = true;
    for (const m0 of marks) {
      const m = typeof m0 === 'string' ? pg.locator(m0) : m0;
      if (!(await m.count().catch(() => 0))) continue;
      if (first) { await m.first().evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' })).catch(() => {}); first = false; }
      await m.first().evaluate((e, RED) => { const r = e.getBoundingClientRect(); const d = document.createElement('div'); d.className = 'qa-mark';
        Object.assign(d.style, { position: 'absolute', left: r.left + scrollX - 4 + 'px', top: r.top + scrollY - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px', border: `3px solid ${RED}`, borderRadius: '3px', zIndex: '999998', pointerEvents: 'none' });
        document.body.appendChild(d); }, RED).catch(() => {});
    }
    await pg.evaluate((t) => { const b = document.createElement('div'); b.className = 'qa-mark'; b.textContent = t;
      Object.assign(b.style, { position: 'fixed', left: '0', right: '0', bottom: '0', background: '#172B4D', color: '#fff', font: 'bold 13px Arial', padding: '4px 10px', zIndex: '999999' });
      document.body.appendChild(b); }, `${myt()} MYT · staging/${R.INST} · ${R.side} · ${pathOf(pg.url())} · ${R.ts} · ${what}`).catch(() => {});
    await pg.waitForTimeout(R.HOLD);
    await pg.screenshot({ path: `${R.dir}/${file}` });
    await R.clear(pg);
    return file;
  };

  // Prove one expected point (Azfar's ts.prove): logged as when | point | expected | page shows | matches | screenshot
  R.prove = async (point, o) => {
    const p = (R.points || []).find((x) => x.id === point);
    const expected = o.expected ?? (p ? p.text : '');
    const shot = o.shot === false ? undefined : await R.shot(o.name ?? point, `${point}: ${o.shows}`.slice(0, 160), o.hl, o.page || R.page);
    const proof = { point, expected, shows: o.shows, match: !!o.match, shot, at: myt(), url: pathOf((o.page || R.page).url()), side: R.side };
    R.proofs.push(proof);
    R.log.push(`${proof.at} | ${point} | expected: ${String(expected).replace(/\s+/g, ' ')} | page shows: ${o.shows} | ${o.match ? 'matches' : 'DOES NOT MATCH'}${shot ? ' | ' + shot : ''}`);
    return proof;
  };

  R.download = async (t, name, note = 'Download') => {
    const wait = R.page.waitForEvent('download', { timeout: 90000 });
    await R.click(t, note);
    const d = await wait; const f = `${R.dir}/downloadable/${name || d.suggestedFilename()}`;
    await d.saveAs(f); R.note(`downloaded: ${name || d.suggestedFilename()} (server name ${d.suggestedFilename()})`);
    return f;
  };

  R.text = async (sel = 'body', n = 3000, pg = R.page) => (await pg.locator(sel).first().innerText().catch(() => '')).slice(0, n);

  // End card, close everything, save videos: main → video_<TS>.webm, windows → _raw/window<N>.webm
  R.finish = async (stoppedEarly = '') => {
    await R.card(`End of ${R.ts}`, stoppedEarly ? 'stopped early — see checks.txt' : '', myt() + ' MYT', 1200).catch(() => {});
    const mainV = R.page.video();
    const winV = R.windows.map((w) => w.page.video());
    for (const w of R.windows) { if (w.closedAt == null) w.closedAt = (Date.now() - R.t0) / 1000; }
    await R.ctx.close(); R.ctx = null;
    const videos = {};
    try { await mainV.saveAs(`${R.dir}/video_${R.ts}.webm`); await mainV.delete(); videos.main = `video_${R.ts}.webm`; } catch (e) { videos.main = 'video-fail: ' + e.message.split('\n')[0]; }
    videos.windows = [];
    for (let i = 0; i < winV.length; i++) {
      const f = `_raw/window${i + 1}.webm`;
      try { await winV[i].saveAs(`${R.dir}/${f}`); await winV[i].delete(); videos.windows.push(f); } catch (e) { videos.windows.push('video-fail: ' + e.message.split('\n')[0]); }
    }
    return { ts: R.ts, inst: R.INST, points: R.points, log: R.log, proofs: R.proofs, notes: R.notes, dialogs: R.dialogs,
      windows: R.windows.map((w, i) => ({ n: i + 1, at: w.at, closedAt: w.closedAt, url: w.url, file: videos.windows[i] })), videos };
  };
  return 'recorder-azfar ready';
}
