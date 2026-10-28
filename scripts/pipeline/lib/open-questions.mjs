// Open questions per ticket (2026-10-27, night enhancement round 9).
//
// Charmain's questions register: "A question asked in a chat reply used to
// live only in that reply. The session ended and it was gone."
// [charmain-repo: test-scenarios/questions.yaml:1-5]; statuses open / answered /
// superseded [charmain-repo: test-scenarios/questions.yaml:16-21]. In the
// pipeline a character's "waiting" state holds only its FIRST question, and the
// next job (a rerun, a sync, the Sage's continuation) resets the state — so a
// question he never answered silently disappears. This derives the register
// from the chats themselves (no new store, nothing to keep in sync): a
// question is open when the character asked it after Faizuddin's last message
// in that chat and the answer registry does not already answer it.
// Round 15: questions for the BA / developer ("## Questions for the team",
// ASK_RULES 4) are tracked too, with their owner ("owner" field in
// [charmain-repo: test-scenarios/questions.yaml:23]).

import { readChat, readTicket, readSageList } from "../store.mjs";
import { extractQuestions, bestAnswer, normQuestion, similarity } from "../answers.mjs";

/** Two wordings of one question (a rerun rephrases it): keep the newest. */
const SAME_AT = 0.7;

const CHARS = ["scout", "scribe", "elf", "dwarf", "sage"];

const TEAM_HEAD = /^#{1,4}\s*Questions for the team.*$/im;

/** The numbered questions under "## Questions for the team" (continuation lines joined). */
export function extractTeamQuestions(text) {
  const part = String(text ?? "").split(TEAM_HEAD)[1];
  if (!part) return [];
  const out = [];
  for (const raw of part.split("\n")) {
    const line = raw.trim();
    if (/^#{1,4}\s/.test(line)) break;
    const m = line.match(/^\d+[.)]\s+(.*)$/);
    if (m) out.push(m[1].trim());
    else if (line && out.length) out[out.length - 1] += ` ${line}`;
  }
  return out.map(q => q.replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 10);
}

const ownerOf = q => (/\(for:\s*(the )?BA\)/i.test(q) ? "the BA" : /\(for:\s*(the )?dev(eloper)?\)/i.test(q) ? "the developer" : "the team");

/**
 * [{ character, question, askedAt, jobId?, for }] — unanswered questions of a
 * ticket, oldest first, deduplicated by meaning per character. `for` is
 * "faizuddin", "the BA", "the developer" or "the team".
 */
export function openQuestions(key, { ticket = readTicket(key), answers = readSageList("answers") } = {}) {
  const out = [];
  for (const c of CHARS) {
    const chat = readChat(key, c);
    let lastFaiz = -1;
    chat.forEach((e, i) => { if (e.from === "faizuddin") lastFaiz = i; });
    const mine = [];
    for (const e of chat.slice(lastFaiz + 1)) {
      if (e.from !== c) continue;
      const qs = [...extractQuestions(e.text).map(q => [q, "faizuddin"]), ...extractTeamQuestions(e.text).map(q => [q, ownerOf(q)])];
      for (const [q, owner] of qs) {
        const n = normQuestion(q);
        if (!n) continue;
        if (bestAnswer(q, ticket, answers)?.match) continue; // the Sage answers it from his earlier answer
        const i = mine.findIndex(m => m.n === n || similarity(m.n, n) >= SAME_AT);
        const item = { n, character: c, question: q, askedAt: e.at, ...(e.jobId ? { jobId: e.jobId } : {}), for: owner };
        if (i >= 0) mine[i] = item; else mine.push(item);
      }
    }
    out.push(...mine.map(({ n, ...rest }) => { void n; return rest; }));
  }
  return out.sort((a, b) => String(a.askedAt).localeCompare(String(b.askedAt)));
}
