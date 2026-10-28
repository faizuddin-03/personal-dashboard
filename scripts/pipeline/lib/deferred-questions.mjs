// Deferred questions (2026-10-27, night enhancement round 17).
//
// Faizuddin parks some questions on purpose: "i will answer this later. dwarf
// or elf can ask me this later" (EAINT-11868 Scout chat, 2026-10-27 09:55),
// "i will give you this later. dwarf can ask me again later when he needs it"
// (EAINT-12097 Scribe chat, 09:53). Charmain's register has the same state:
// "deferred — real, parked on purpose, will not be chased now"
// [charmain-repo: test-scenarios/questions.yaml:16-21]. Two things went wrong
// before this module:
// 1. The Sage stored such replies as ANSWERS (answers.json), so the registry
//    would "answer" Dwarf's later question with "i will give you this later"
//    and Dwarf would never ask. answers.mjs now skips deferral-only answers
//    (isDeferral below).
// 2. Nobody reminded the named character. deferredFor() lists them, and
//    run-character.mjs adds them to that character's next prompt.

import { readChat } from "../store.mjs";
import { extractQuestions, isDeferral, DEFER_RE } from "../answers.mjs";

export { isDeferral };

const CHARS = ["scout", "scribe", "elf", "dwarf", "sage"];

/** Which character he named to ask again ("dwarf can ask me later"), else null. */
function namedCharacters(text) {
  const t = String(text ?? "").toLowerCase();
  return CHARS.filter(c => new RegExp(`\\b${c}\\b`).test(t));
}

/** His reply split into per-question parts: numbered lines pair with numbered questions; else the whole text. */
function partsFor(reply, count) {
  const lines = String(reply ?? "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^\d+[.)]\s+/.test(l));
  if (numbered.length && count > 1) {
    const out = new Array(count).fill(null);
    for (const l of numbered) { const n = Number(l.match(/^(\d+)/)[1]); if (n >= 1 && n <= count) out[n - 1] = l.replace(/^\d+[.)]\s+/, ""); }
    return out;
  }
  if (lines.length === count && count > 1) return lines;
  return new Array(Math.max(count, 1)).fill(String(reply ?? ""));
}

/**
 * Deferred questions of a ticket: [{ askedBy, question, deferredAt, reply, to[] }].
 * `to` = characters he named ("dwarf or elf can ask me later"), else [] (any
 * later step). Drops one once a named character (or, with none named, Elf or
 * Dwarf) replied in its chat after `since` and after the deferral: it saw the
 * reminder in that job's prompt.
 */
export function deferredQuestions(key, { since = "2026-10-27T12:20:00Z" } = {}) {
  const out = [];
  const chats = Object.fromEntries(CHARS.map(c => [c, readChat(key, c)]));
  for (const c of CHARS) {
    const chat = chats[c];
    for (let i = 0; i < chat.length; i++) {
      const e = chat[i];
      if (e.from !== "faizuddin" || !DEFER_RE.test(e.text ?? "")) continue;
      const prev = [...chat.slice(0, i)].reverse().find(x => x.from === c);
      const qs = prev ? extractQuestions(prev.text) : [];
      if (!qs.length) continue;
      const parts = partsFor(e.text, qs.length);
      qs.forEach((q, n) => {
        const part = parts[n] ?? "";
        if (!part || !isDeferral(part)) return;
        out.push({ askedBy: c, question: q, deferredAt: e.at, reply: part.slice(0, 300), to: namedCharacters(part.length < String(e.text).length ? part : e.text) });
      });
    }
  }
  const seenAfter = (who, at) => (chats[who] ?? []).some(x => x.from === who && x.at > at && x.at > since);
  return out.filter(d => {
    const targets = d.to.length ? d.to : ["elf", "dwarf"];
    return !targets.some(t => seenAfter(t, d.deferredAt));
  });
}

/** Prompt block for `character`'s next job, or "" (none for the Sage or help jobs). */
export function deferredBlock(key, character) {
  if (character === "sage") return "";
  const mine = deferredQuestions(key).filter(d => d.to.includes(character) || (!d.to.length && (character === "elf" || character === "dwarf")));
  if (!mine.length) return "";
  return `Questions Faizuddin parked for later (he said you may ask them again at your step):
${mine.map((d, i) => `${i + 1}. ${d.question.replace(/\s+/g, " ").slice(0, 300)} — first asked by ${d.askedBy[0].toUpperCase()}${d.askedBy.slice(1)}; his reply on ${String(d.deferredAt).slice(0, 10)}: "${d.reply}"`).join("\n")}
If your task needs one of them now, ask it ONCE under "## Questions for Faizuddin" (the same wording, so he recognises it). If not, do not mention it.`;
}
