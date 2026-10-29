// One-off: extract the real eAuto design stylesheet (embedded as a JS string in
// the standalone bundle) into apps/web/src/styles/eauto-design.css.
const fs = require('fs');
const path = require('path');

const htmlPath = 'docs/design/WhatsApp Blaster (offline).html';
const outPath = 'apps/web/src/styles/eauto-design.css';

const s = fs.readFileSync(htmlPath, 'utf8');
const anchor = s.indexOf('--brand-700:#2440C8');
if (anchor < 0) { console.error('anchor not found'); process.exit(1); }

// Find the enclosing JS string literal delimiter (nearest unescaped quote before anchor).
function unescapedQuoteBefore(str, pos) {
  for (let j = pos; j >= 0; j--) {
    const c = str[j];
    if (c === '"' || c === "'" || c === '`') {
      let bs = 0, k = j - 1;
      while (k >= 0 && str[k] === '\\') { bs++; k--; }
      if (bs % 2 === 0) return { q: c, idx: j };
    }
  }
  return null;
}
function unescapedQuoteAfter(str, pos, q) {
  for (let j = pos; j < str.length; j++) {
    if (str[j] === q) {
      let bs = 0, k = j - 1;
      while (k >= 0 && str[k] === '\\') { bs++; k--; }
      if (bs % 2 === 0) return j;
    }
  }
  return -1;
}

// The embedded CSS is a DOUBLE-QUOTED JS string (internal " are escaped as \",
// newlines as \n). Find the enclosing " boundaries and JSON.parse to un-escape.
function lastUnescapedDQuoteBefore(str, pos) {
  for (let j = pos; j >= 0; j--) {
    if (str[j] === '"') {
      let bs = 0, k = j - 1;
      while (k >= 0 && str[k] === '\\') { bs++; k--; }
      if (bs % 2 === 0) return j;
    }
  }
  return -1;
}
const open = { q: '"', idx: lastUnescapedDQuoteBefore(s, anchor) };
if (open.idx < 0) { console.error('open " not found'); process.exit(1); }
const close = unescapedQuoteAfter(s, anchor + 1, '"');
if (close < 0) { console.error('close " not found'); process.exit(1); }

const literal = s.slice(open.idx, close + 1); // includes the quotes
const embeddedHtml = JSON.parse(literal); // robust un-escape → a full HTML doc string
// The real "Aurora" design stylesheet is a <style> block inside that embedded HTML.
const styleBlocks = [...embeddedHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const css = styleBlocks.find((c) => c.includes('--brand-500') && c.includes('.v-card'))
  || styleBlocks.sort((a, b) => b.length - a.length)[0]
  || '';

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, css, 'utf8');

console.log('delimiter:', JSON.stringify(open.q));
console.log('css length:', css.length);
console.log('checks:',
  '.v-card=', css.includes('.v-card'),
  '.chip=', css.includes('.chip'),
  '.tab=', css.includes('.tab'),
  '.btn-primary=', css.includes('.btn-primary'),
  '.nav-item=', css.includes('.nav-item'),
  ':root=', css.includes(':root'),
  'data-theme=', css.includes('data-theme'),
  '--brand-500=', css.includes('--brand-500'),
);
console.log('--- HEAD (250) ---\n' + css.slice(0, 250));
console.log('--- TAIL (200) ---\n' + css.slice(-200));
