#!/usr/bin/env node
// Pull one person's own Teams messages for a single day, straight from Microsoft
// Graph as themselves. No Task Tracker, no browser, no foreground Chrome.
//
// Why this exists: the Teams *web UI* route caps search at ~30 rows, bottoms out
// around noon, needs Chrome in the foreground, and one search only buys one chat
// visit. Graph has none of those limits.
//
// NO NAME IS CONFIGURED ANYWHERE, on purpose. "Their own messages" means
// from.user.id === the id GET /me returns for whoever signed in, so the same
// script works unchanged for every QA who shares this skill — they run `login`
// once with their own work account and it reads their day, not anyone else's.
// Matching on display name would break on the two people here who share a first
// name, and on anyone whose Teams name is not what they are called.
//
//   node teams-day.mjs login              device-code sign-in, stores a refresh token
//   node teams-day.mjs whoami             which account is signed in
//   node teams-day.mjs logout             forget the token
//   node teams-day.mjs day [YYYY-MM-DD]   the extraction (default: today)
//
// day flags
//   --context N   messages either side of each of hers to keep (default 3, 0 = none)
//   --all         every message in the window, not just hers + context
//   --json FILE   write the full result as JSON
//   --tz +08:00   local offset used for the day boundary (default +08:00)

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';

const AUTH_HOST = 'https://login.microsoftonline.com';
const GRAPH = 'https://graph.microsoft.com/v1.0';

// The app registration this borrows is named "Automate Teams group chat - WeiTing"
// in Entra, and THAT is the name the consent screen shows. Warn the person before
// they open the link — an unexpected app name reads as phishing.
//
// It is borrowed, not ours: if it is renamed, re-permissioned or deleted, every
// user of this script loses source 2 at once. A dedicated read-only registration
// is the durable fix; set GRAPH_CLIENT_ID / GRAPH_TENANT_ID to point at one.
// Client and tenant ids are not secrets.
const CLIENT_ID = process.env.GRAPH_CLIENT_ID || '8af3b0b6-dcc2-42d5-8a55-873cac47557d';
const TENANT_ID = process.env.GRAPH_TENANT_ID || '027a0104-2605-4ade-9f44-39f4e04df92c';

// Chat.ReadWrite, NOT Chat.Read — and that is not a mistake.
//
// Admin consent is recorded per app AND per permission. This tenant blocks users
// from self-consenting, and the permissions an admin already approved on this app
// registration are the ones the QA Portal uses: Chat.ReadWrite, Chat.Create,
// ChatMember.ReadWrite, User.ReadBasic.All. Asking for the NARROWER Chat.Read
// bounces to "Need admin approval" (confirmed 8 Sep 2026) because nobody ever
// approved that specific permission — being less powerful does not help.
//
// So the token can technically post. THIS SCRIPT NEVER DOES: every Graph call
// goes through graphGet(), which hardcodes GET. There is no write path to reach.
const SCOPES = (process.env.GRAPH_SCOPES || 'offline_access User.Read Chat.ReadWrite').split(/\s+/).filter(Boolean);

// Deliberately OUTSIDE the skill folder: skills get uploaded, tokens must not.
const TOKEN_PATH = process.env.GRAPH_TOKEN_PATH || path.join(os.homedir(), '.claude', '.graph-timesheet-token.json');

const MAX_MESSAGE_PAGES = 12;   // 50/page — 600 messages back per chat is plenty for a day
const MAX_CHAT_PAGES = 40;

// --- token store -------------------------------------------------------------

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function saveStore(obj) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(obj, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(TOKEN_PATH, 0o600);
  } catch {
    /* Windows ACLs — best effort */
  }
}

async function formPost(url, fields) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  const text = await res.text();
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new Error(`OAuth endpoint returned non-JSON (HTTP ${res.status}):\n${text.slice(0, 400)}`);
  }
}

// AADSTS7000218 looks like six other things: the app registration is a
// CONFIDENTIAL client, so Entra wants a secret device-code never sends.
function oauthHint(err, desc) {
  const blob = `${err} ${desc}`;
  if (blob.includes('7000218')) {
    return '\n\nFix: in Entra → App registrations → Authentication, turn ON "Allow public client flows".';
  }
  if (blob.includes('65001') || blob.includes('consent')) {
    return '\n\nFix: the scopes are not consented. Try GRAPH_SCOPES="offline_access User.Read Chat.ReadWrite".';
  }
  return '';
}

async function login() {
  const dc = await formPost(`${AUTH_HOST}/${TENANT_ID}/oauth2/v2.0/devicecode`, {
    client_id: CLIENT_ID,
    scope: SCOPES.join(' '),
  });
  if (!dc.device_code) {
    throw new Error(`Device code refused: ${dc.error || '?'}\n${dc.error_description || ''}${oauthHint(dc.error, dc.error_description)}`);
  }

  console.log('');
  console.log(`  Open   ${dc.verification_uri}`);
  console.log(`  Code   ${dc.user_code}`);
  console.log('');
  console.log('  Sign in with your work account. Waiting...');

  const interval = Math.max(2, Number(dc.interval || 5));
  const deadline = Date.now() + Number(dc.expires_in || 900) * 1000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    const tok = await formPost(`${AUTH_HOST}/${TENANT_ID}/oauth2/v2.0/token`, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID,
      device_code: dc.device_code,
    });
    if (tok.access_token) {
      const me = await graphGet('/me?$select=id,displayName,mail,userPrincipalName', tok.access_token);
      saveStore({
        refresh_token: tok.refresh_token,
        access_token: tok.access_token,
        expires_at: Math.floor(Date.now() / 1000) + Number(tok.expires_in || 3600) - 120,
        scope: tok.scope || SCOPES.join(' '),
        user: { id: me.id, displayName: me.displayName, upn: me.userPrincipalName || me.mail },
      });
      console.log(`\n  Signed in as ${me.displayName} <${me.userPrincipalName || me.mail}>`);
      console.log(`  Token stored at ${TOKEN_PATH}`);
      return;
    }
    if (tok.error === 'authorization_pending') continue;
    if (tok.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    throw new Error(`Sign-in failed: ${tok.error}\n${tok.error_description || ''}${oauthHint(tok.error, tok.error_description)}`);
  }
  throw new Error('Device code expired before sign-in completed. Run login again.');
}

async function accessToken() {
  const store = loadStore();
  if (!store || !store.refresh_token) {
    throw new Error(`Not signed in. Run:  node ${path.basename(process.argv[1])} login`);
  }
  if (store.access_token && Number(store.expires_at || 0) > Math.floor(Date.now() / 1000)) {
    return store.access_token;
  }
  const tok = await formPost(`${AUTH_HOST}/${TENANT_ID}/oauth2/v2.0/token`, {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: store.refresh_token,
    scope: SCOPES.join(' '),
  });
  if (!tok.access_token) {
    throw new Error(`Token refresh failed: ${tok.error}\n${tok.error_description || ''}\n\nRun login again.`);
  }
  saveStore({
    ...store,
    refresh_token: tok.refresh_token || store.refresh_token,
    access_token: tok.access_token,
    expires_at: Math.floor(Date.now() / 1000) + Number(tok.expires_in || 3600) - 120,
  });
  return tok.access_token;
}

// --- Graph -------------------------------------------------------------------

async function graphGet(pathOrUrl, tokenOverride) {
  const token = tokenOverride || (await accessToken());
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${GRAPH}${pathOrUrl}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (res.status === 429 || res.status === 503) {
      const wait = Math.max(1, Number(res.headers.get('retry-after') || 2 ** attempt));
      process.stderr.write(`  throttled, waiting ${wait}s\n`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`GET ${url.replace(GRAPH, '')} -> HTTP ${res.status}\n${text.slice(0, 500)}`);
      err.status = res.status;
      throw err;
    }
    return JSON.parse(text || '{}');
  }
  throw new Error(`GET ${url} kept throttling after 5 attempts.`);
}

// Every chat the signed-in person is in - group, oneOnOne and meeting alike.
// listMyGroupChats() in the Task Tracker drops oneOnOne, and the 1:1s are where
// the actual defect investigation lands, so this keeps all three.
// ⚠ NEVER prune on chat.lastUpdatedDateTime. It is the chat's METADATA time —
// roster and topic changes — not the last message. Confirmed 8 Sep 2026: a 1:1
// whose last message was that morning reported lastUpdatedDateTime of
// 2025-03-07, and pruning on it skipped 612 of 613 chats and returned an empty
// day. The last-message time is lastMessagePreview/createdDateTime, which needs
// $expand=lastMessagePreview.
function lastMessageMs(c) {
  const t = Date.parse(c.lastMessagePreview?.createdDateTime || '');
  if (Number.isFinite(t)) return t;
  return NaN; // unknown — caller keeps the chat rather than risk dropping it
}

// Every chat the signed-in person is in, newest message first, stopping as soon
// as the list drops past the window. `ordered` says whether the early stop was
// trustworthy; if the server refused $orderby we page everything and filter.
async function listAllChats(startMs) {
  const attempts = [
    { url: '/me/chats?$select=id,topic,chatType,webUrl&$expand=members,lastMessagePreview&$orderby=lastMessagePreview/createdDateTime desc&$top=50', ordered: true },
    { url: '/me/chats?$select=id,topic,chatType,webUrl&$expand=members,lastMessagePreview&$top=50', ordered: false },
    { url: '/me/chats?$expand=lastMessagePreview&$top=50', ordered: false },
    { url: '/me/chats?$top=50', ordered: false },
  ];
  let lastErr;
  for (const attempt of attempts) {
    try {
      const out = [];
      let url = attempt.url;
      let scanned = 0;
      let stoppedEarly = false;
      for (let i = 0; url && i < MAX_CHAT_PAGES; i++) {
        const res = await graphGet(url);
        for (const c of res.value || []) {
          scanned += 1;
          const t = lastMessageMs(c);
          if (attempt.ordered && Number.isFinite(t) && t < startMs) {
            stoppedEarly = true;
            break;
          }
          if (Number.isFinite(t) && t < startMs) continue; // unordered: just skip
          out.push(c);
        }
        if (stoppedEarly) break;
        url = res['@odata.nextLink'] || null;
      }
      return { chats: out, scanned, ordered: attempt.ordered, query: attempt.url };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// A readable name for a chat. Group chats have a topic; 1:1s and unnamed group
// chats do not, so fall back to the other members' names.
function chatName(chat, myId) {
  const topic = (chat.topic || '').trim();
  if (topic) return topic;
  const others = (chat.members || [])
    .filter((m) => m.userId && m.userId !== myId)
    .map((m) => (m.displayName || '').trim())
    .filter(Boolean);
  if (others.length) return others.join(', ');
  return chat.chatType === 'oneOnOne' ? '(1:1, unnamed)' : '(unnamed chat)';
}

// Teams posts are HTML. Every block close has to become a newline or a daily
// update's bullet list comes back glued into one unreadable run.
function stripHtml(s) {
  let out = String(s)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|ul|ol|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  const ents = [['&nbsp;', ' '], ['&amp;', '&'], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'], ['&#39;', "'"]];
  for (const [a, b] of ents) out = out.split(a).join(b);
  return out.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
}

// Newest-first history, stopping as soon as it reaches past the window start.
async function readWindow(chatId, startMs) {
  const out = [];
  let url = `/chats/${chatId}/messages?$top=50`;
  for (let page = 0; url && page < MAX_MESSAGE_PAGES; page++) {
    let res;
    try {
      res = await graphGet(url);
    } catch (e) {
      if (e.status === 403 || e.status === 404) return { messages: out, error: `HTTP ${e.status}` };
      throw e;
    }
    let reachedPast = false;
    for (const m of res.value || []) {
      const t = Date.parse(m.createdDateTime || '');
      if (Number.isFinite(t) && t < startMs) {
        reachedPast = true;
        continue;
      }
      if (m.messageType !== 'message') continue; // joins, renames, system events
      if (m.deletedDateTime) continue;
      out.push(m);
    }
    if (reachedPast) break;
    url = res['@odata.nextLink'] || null;
  }
  return { messages: out, error: null };
}

// --- the day -----------------------------------------------------------------

function localHM(iso, tz) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '??:??';
  const sign = tz.startsWith('-') ? -1 : 1;
  const [h, m] = tz.slice(1).split(':').map(Number);
  const shifted = new Date(t + sign * ((h * 60 + (m || 0)) * 60_000));
  return shifted.toISOString().slice(11, 16);
}

async function day(argv) {
  const tz = flagValue(argv, '--tz') || '+08:00';
  const contextN = argv.includes('--context') ? Math.max(0, Number(flagValue(argv, '--context')) || 0) : 3;
  const wantAll = argv.includes('--all');
  const jsonPath = flagValue(argv, '--json');

  // "Today" means today in THEIR offset, so derive it from --tz rather than
  // assuming +08:00 — the same script has to work for a QA in another timezone.
  const tzMinutes = (tz.startsWith('-') ? -1 : 1) * (() => {
    const [h, m] = tz.slice(1).split(':').map(Number);
    return h * 60 + (m || 0);
  })();
  const date = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a))
    || new Date(Date.now() + tzMinutes * 60_000).toISOString().slice(0, 10);
  const startMs = Date.parse(`${date}T00:00:00${tz}`);
  const endMs = startMs + 24 * 3600_000;
  if (!Number.isFinite(startMs)) throw new Error(`Bad date or --tz: ${date} ${tz}`);

  const store = loadStore();
  const me = await graphGet('/me?$select=id,displayName,userPrincipalName');
  const myId = me.id;

  process.stderr.write(`Reading ${date} (${tz}) as ${me.displayName}\n`);

  const { chats: candidates, scanned, ordered } = await listAllChats(startMs);
  process.stderr.write(`  scanned ${scanned} chats${ordered ? ' (newest first, stopped at the window)' : ''}\n`);
  process.stderr.write(`  ${candidates.length} with a message on or after ${date}, reading those\n`);

  const results = [];
  for (const chat of candidates) {
    const { messages, error } = await readWindow(chat.id, startMs);
    const inWindow = messages
      .filter((m) => {
        const t = Date.parse(m.createdDateTime || '');
        return Number.isFinite(t) && t >= startMs && t < endMs;
      })
      .sort((a, b) => Date.parse(a.createdDateTime) - Date.parse(b.createdDateTime));

    const mine = inWindow.filter((m) => m.from?.user?.id === myId);
    if (!mine.length && !(wantAll && inWindow.length)) continue;

    // Keep hers, plus contextN either side, so the dev's reply that carries the
    // outcome travels with the message that asked for it.
    const keep = new Set();
    if (wantAll) {
      inWindow.forEach((_, i) => keep.add(i));
    } else {
      inWindow.forEach((m, i) => {
        if (m.from?.user?.id !== myId) return;
        for (let j = Math.max(0, i - contextN); j <= Math.min(inWindow.length - 1, i + contextN); j++) keep.add(j);
      });
    }

    results.push({
      chatId: chat.id,
      name: chatName(chat, myId),
      chatType: chat.chatType || '?',
      webUrl: chat.webUrl || '',
      error,
      mineCount: mine.length,
      firstMine: mine.length ? mine[0].createdDateTime : null,
      lastMine: mine.length ? mine[mine.length - 1].createdDateTime : null,
      messages: [...keep].sort((a, b) => a - b).map((i) => {
        const m = inWindow[i];
        return {
          mine: m.from?.user?.id === myId,
          from: m.from?.user?.displayName || m.from?.application?.displayName || '?',
          at: m.createdDateTime,
          local: localHM(m.createdDateTime, tz),
          text: stripHtml(m.body?.content || ''),
          webUrl: m.webUrl || '',
          attachments: (m.attachments || []).map((a) => ({ name: a.name || '', contentType: a.contentType || '' })),
        };
      }),
    });
  }

  results.sort((a, b) => Date.parse(a.firstMine || a.messages[0]?.at || 0) - Date.parse(b.firstMine || b.messages[0]?.at || 0));

  const payload = {
    date,
    tz,
    me: { id: myId, displayName: me.displayName, upn: me.userPrincipalName },
    scope: store?.scope || '',
    chatsScanned: scanned,
    chatsRead: candidates.length,
    chatsWithHerMessages: results.filter((r) => r.mineCount > 0).length,
    totalHerMessages: results.reduce((n, r) => n + r.mineCount, 0),
    chats: results,
  };

  if (jsonPath) {
    fs.mkdirSync(path.dirname(path.resolve(jsonPath)), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    process.stderr.write(`  JSON -> ${jsonPath}\n`);
  }

  printDay(payload);
  return payload;
}

function printDay(p) {
  console.log('');
  console.log(`# Teams, ${p.date} (${p.tz}) — ${p.me.displayName}`);
  console.log(`${p.totalHerMessages} of their messages across ${p.chatsWithHerMessages} chats (${p.chatsRead} active chats read, ${p.chatsScanned} scanned)`);

  for (const c of p.chats) {
    console.log('');
    console.log(`## ${c.name}  [${c.chatType}]  — ${c.mineCount} from her`);
    if (c.error) console.log(`   (partial: ${c.error})`);
    for (const m of c.messages) {
      const who = m.mine ? '>>' : '  ';
      const lines = m.text.split('\n');
      console.log(`${who} ${m.local}  ${m.from}: ${lines[0] || '(no text)'}`);
      for (const l of lines.slice(1)) console.log(`${who}        ${l}`);
      for (const a of m.attachments) if (a.name) console.log(`${who}        [attachment: ${a.name}]`);
    }
  }
  console.log('');
}

// --- cli ---------------------------------------------------------------------

function flagValue(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}

async function whoami() {
  const store = loadStore();
  if (!store) {
    console.log('Not signed in.');
    return;
  }
  const me = await graphGet('/me?$select=id,displayName,mail,userPrincipalName');
  console.log(`${me.displayName} <${me.userPrincipalName || me.mail}>`);
  console.log(`scope: ${store.scope || '(unknown)'}`);
  console.log(`token: ${TOKEN_PATH}`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'login') await login();
  else if (cmd === 'whoami') await whoami();
  else if (cmd === 'logout') {
    fs.rmSync(TOKEN_PATH, { force: true });
    console.log('Token forgotten.');
  } else if (cmd === 'day' || !cmd) await day(rest);
  else {
    console.log('Commands: login | whoami | logout | day [YYYY-MM-DD] [--context N] [--all] [--json FILE] [--tz +08:00]');
    process.exit(1);
  }
} catch (e) {
  console.error(`\n${e.message}\n`);
  process.exit(1);
}
