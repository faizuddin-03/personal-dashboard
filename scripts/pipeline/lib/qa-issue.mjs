// QA-Issue builder and creator for the pipeline (Faizuddin, 2026-10-27).
//
// Format: .claude/skills/eauto-qa-issue-ticket/SKILL.md +
// references/description-template.json — purple note panel (Testing
// Environment / Browser / Module), orange "Staging Test:" IDs, and the
// Item / Actual (red) / Expected (green) table.
// FORCED rule (synced skill, the QA lead, 14-10-2026): a High or Highest
// issue is created On Hold (transition 28) and assigned to the QA who raised
// it, with a comment saying why; the Developer field is still set.
// Only /api/pipeline/issue calls createQaIssue, after Faizuddin presses Raise.
// dryRun builds everything and writes nothing.

import fs from "node:fs";
import path from "node:path";
import { repoPath, jiraCreds, jiraFetch } from "../store.mjs";

const RED_HEAD = "#bf2600";
const GREEN = "#006644";
const BLUE = "#0747A6";
const RED_WORD = "#DE350B";
const ORANGE = "#ff991f";
const ON_HOLD = "28";
const HOLD_PRIORITIES = new Set(["High", "Highest"]);
const MAX_ATTACH = 10 * 1024 * 1024;

const strong = { type: "strong" };
const color = c => ({ type: "textColor", attrs: { color: c } });
const t = (text, marks) => ({ type: "text", text: String(text), ...(marks?.length ? { marks } : {}) });
const para = (...content) => ({ type: "paragraph", content: content.filter(x => x && x.text !== "") });
const li = node => ({ type: "listItem", content: [node] });

/**
 * Splits "Invoice !!still shows 1 line!!" into text nodes, the marked words
 * coloured + bold. With no marks, the whole text takes the colour (Actual
 * and Expected are a few words each).
 */
function marked(text, mark, c) {
  const s = String(text ?? "").trim();
  const re = mark === "!!" ? /!!(.+?)!!/g : /\+\+(.+?)\+\+/g;
  if (!re.test(s)) return [t(s, [color(c), strong])];
  re.lastIndex = 0;
  const out = [];
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push(t(s.slice(last, m.index)));
    out.push(t(m[1], [color(c), strong]));
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(t(s.slice(last)));
  return out.filter(n => n.text);
}
const plain = s => String(s ?? "").replace(/!!(.+?)!!/g, "$1").replace(/\+\+(.+?)\+\+/g, "$1");

/** Jira attachment name: the file name without the findings folder's "evidence-01-" prefix. */
const attachName = p => path.basename(String(p)).replace(/^evidence-\d+-/, "");

/** Short title for the table's blue step title: the symptom without the "[eAuto - X]" prefix. */
const symptom = title => String(title ?? "").replace(/^\s*\[[^\]]*\]\s*/, "").trim();

/**
 * ADF description from a QaIssueDraft. ticket is optional (PipelineTicket),
 * used only for the fallback module text.
 */
export function buildAdf(draft, ticket) {
  const modulePath = draft.module || (ticket?.title ? `eAuto > ${ticket.title}` : "eAuto");
  const ids = (draft.stagingIds ?? []).filter(Boolean);
  const steps = (draft.steps ?? []).filter(Boolean);
  // Same names the upload uses, so the text matches the attachments in Jira.
  const attachNames = [...new Set((draft.attachments ?? []).map(attachName))];
  const actualItems = [para(...marked(draft.actual, "!!", RED_WORD))];
  if (attachNames.length) actualItems.push(para(t("Evidence attached: "), t(attachNames.join(", "))));
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "panel",
        attrs: { panelType: "note" },
        content: [
          para(t("Testing Environment: ", [strong]), t(draft.environment || "-")),
          para(t("Browser: ", [strong]), t(draft.browser || "Google Chrome")),
          para(t("Module: ", [strong]), t(modulePath)),
        ],
      },
      para(
        t("Staging Test: ", [strong]),
        ...(ids.length ? [t(`(${ids.join(", ")}) `, [color(ORANGE)])] : []),
        t(symptom(plain(draft.title)) || "See the steps below."),
      ),
      {
        type: "table",
        attrs: { isNumberColumnEnabled: false, layout: "default" },
        content: [
          {
            type: "tableRow",
            content: [
              { type: "tableHeader", attrs: {}, content: [para(t("Item / Step to Simulate", [strong]))] },
              { type: "tableHeader", attrs: {}, content: [para(t("Actual Result", [color(RED_HEAD), strong]))] },
              { type: "tableHeader", attrs: {}, content: [para(t("Expected Result", [color(GREEN), strong]))] },
            ],
          },
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                attrs: {},
                content: [
                  para(t(symptom(plain(draft.title)) || "Steps", [color(BLUE), strong])),
                  ...(steps.length ? [{ type: "orderedList", attrs: { order: 1 }, content: steps.map(s => li(para(t(s)))) }] : []),
                ],
              },
              { type: "tableCell", attrs: {}, content: [{ type: "bulletList", content: actualItems.map(li) }] },
              { type: "tableCell", attrs: {}, content: [{ type: "bulletList", content: [li(para(...marked(draft.expected, "++", GREEN)))] }] },
            ],
          },
        ],
      },
    ],
  };
}

/** A few distinctive words of the symptom for the duplicate search. */
export function duplicateWords(title) {
  const stop = new Set(["the", "a", "an", "is", "are", "not", "does", "do", "on", "in", "of", "to", "for", "and", "or", "when", "after", "with", "still", "shows", "show", "page", "eauto"]);
  return plain(symptom(title))
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w.toLowerCase()))
    .slice(0, 5)
    .join(" ");
}

export function duplicateJql(parent, title) {
  const words = duplicateWords(title);
  return `parent = ${parent} AND issuetype = "QA-Issue"${words ? ` AND summary ~ "${words.replace(/"/g, "")}"` : ""} ORDER BY created DESC`;
}

/** Existing QA-Issues under the parent that look like this one (read only). */
export async function findDuplicates(parent, title) {
  const jql = duplicateJql(parent, title);
  const res = await jiraFetch("/rest/api/3/search/jql", {
    method: "POST",
    body: JSON.stringify({ jql, fields: ["summary", "status"], maxResults: 20 }),
  });
  const data = await res.json();
  return { jql, issues: (data.issues ?? []).map(i => ({ key: i.key, summary: i.fields?.summary ?? "", status: i.fields?.status?.name })) };
}

/** Attachment list: existing image files, under 10 MB, de-duplicated by name. */
function attachmentFiles(draft) {
  const seen = new Set();
  const out = [];
  for (const rel of draft.attachments ?? []) {
    const abs = rel.startsWith("/qa-artifacts/") ? repoPath(`public${rel}`) : repoPath(rel);
    let size = 0;
    try { size = fs.statSync(abs).size; } catch { continue; }
    const name = attachName(abs);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ path: rel, abs, name, size, skip: size > MAX_ATTACH ? "over 10 MB" : undefined });
  }
  return out;
}

/** Throws with a plain message when a required field is missing. */
export function checkDraft(draft) {
  const missing = [];
  if (!draft) return ["the QA-Issue draft"];
  if (!draft.parent) missing.push("parent ticket");
  if (!draft.title) missing.push("title");
  if (!draft.priority) missing.push("priority");
  if (!draft.developerAccountId) missing.push("developer");
  if (!draft.actual) missing.push("actual result");
  if (!draft.expected) missing.push("expected result");
  return missing;
}

/**
 * Night round 28: advisory checks on Scout's draft (never block the Raise).
 * Never invent an ID ("No invented terms" [charmain-repo: docs/replying.md:53];
 * "A case issue names its evidence path" [charmain-repo: docs/replying.md:57]),
 * Actual = the symptom in a few words (Faizuddin's QA-Issue rule), Expected ends
 * with its source. `evidenceText` = finding.json + context.json text.
 * Returns plain warning lines ([] when clean).
 */
export function lintDraft(draft, evidenceText = "") {
  const w = [];
  if (!draft) return w;
  const title = symptom(plain(draft.title));
  if (/https?:\/\/|\?\w+=|\b\d{6,}\b|\b[A-Z]{2,}\d{5,}\b/.test(title)) w.push("Title carries an ID / URL / number: keep the title to the symptom and move IDs to Staging Test IDs.");
  const actualWords = plain(draft.actual).split(/\s+/).filter(Boolean).length;
  if (actualWords > 12) w.push(`Actual has ${actualWords} words: say the symptom in a few words (e.g. "Invoice still shows 1 line").`);
  if (draft.actual && !/!!.+?!!/.test(draft.actual)) w.push("Actual has no !!red!! words: mark the failing words.");
  if (draft.expected && !/\+\+.+?\+\+/.test(draft.expected)) w.push("Expected has no ++green++ words: mark the correct result.");
  if (draft.expected && !/\b(SRD|REQ[-\s]?\d|§|section|per TS|_TS\d)/i.test(draft.expected)) w.push("Expected names no source: end it with the SRD reference or \"per TS <id>\".");
  const steps = draft.steps ?? [];
  if (steps.length && (steps.length < 3 || steps.length > 5)) w.push(`${steps.length} steps: use 3 to 5 short steps.`);
  const hay = String(evidenceText).toLowerCase();
  if (hay) {
    for (const s of draft.stagingIds ?? []) {
      const value = String(s).split(/[=:]/).slice(1).join("=").trim() || String(s).trim();
      if (value && !hay.includes(value.toLowerCase())) w.push(`Staging Test ID "${s}" is not in the run's evidence (finding / context): check it is real.`);
    }
  }
  return w;
}

/**
 * Builds the create payload and plan. Faizuddin's accountId comes from
 * data/agents/jira.json (the QA field and, for High/Highest, the assignee).
 */
export function buildCreate(draft, ticket) {
  const qa = jiraCreds()?.accountId;
  const hold = HOLD_PRIORITIES.has(draft.priority);
  const fields = {
    project: { key: "EAINT" },
    issuetype: { name: "QA-Issue" },
    parent: { key: draft.parent },
    summary: plain(draft.title).slice(0, 250),
    description: buildAdf(draft, ticket),
    priority: { name: draft.priority },
    ...(qa ? { customfield_10041: [{ accountId: qa }] } : {}),
    customfield_10040: [{ accountId: draft.developerAccountId }],
    assignee: { accountId: hold ? (qa ?? draft.developerAccountId) : draft.developerAccountId },
  };
  return {
    payload: { fields },
    hold,
    qaAccountId: qa,
    transitions: hold ? [{ id: ON_HOLD, to: "On Hold", why: `${draft.priority} priority: On Hold for a QA manual check, assigned to the QA who raised it` }] : [],
    comment: hold ? `On hold for QA manual check before release to dev (${draft.priority} priority).` : null,
  };
}

const commentAdf = text => ({ type: "doc", version: 1, content: [para(t(text))] });

/**
 * Creates the QA-Issue. Steps: duplicate check (unless allowDuplicate),
 * create, On Hold + comment for High/Highest, attachments, read back.
 * Returns { issueKey, url, warnings, attached, status?, assignee? }, or for
 * dryRun { dryRun: true, payload, attachments, transitions, comment, duplicates }.
 * Throws an Error with .duplicates when a likely duplicate exists.
 */
export async function createQaIssue({ draft, finding, ticket, dryRun = false, allowDuplicate = false }) {
  const missing = checkDraft(draft);
  if (missing.length) throw Object.assign(new Error(`Missing: ${missing.join(", ")}`), { status: 400 });
  const plan = buildCreate(draft, ticket);
  const files = attachmentFiles(draft);
  if (!plan.qaAccountId) throw Object.assign(new Error("Faizuddin's Jira accountId is missing from the saved Jira login (data/agents/jira.json)"), { status: 400 });

  let dup = { jql: duplicateJql(draft.parent, draft.title), issues: [] };
  let dupError;
  try { dup = await findDuplicates(draft.parent, draft.title); } catch (e) { dupError = e.message; }

  if (dryRun) {
    return {
      dryRun: true,
      payload: plan.payload,
      attachments: files.map(f => ({ path: f.path, name: f.name, size: f.size, ...(f.skip ? { skip: f.skip } : {}) })),
      transitions: plan.transitions,
      comment: plan.comment,
      duplicates: dup.issues,
      duplicateJql: dup.jql,
      ...(dupError ? { duplicateCheckError: dupError } : {}),
      finding: finding?.id,
    };
  }
  if (dupError) throw Object.assign(new Error(`Duplicate check failed, nothing created: ${dupError}`), { status: 502 });
  if (dup.issues.length && !allowDuplicate) {
    throw Object.assign(new Error(`Possible duplicate under ${draft.parent}: ${dup.issues.map(i => `${i.key} "${i.summary}"`).join("; ")}`), { status: 409, duplicates: dup.issues });
  }

  const created = await (await jiraFetch("/rest/api/3/issue", { method: "POST", body: JSON.stringify(plan.payload) })).json();
  const issueKey = created.key;
  const base = jiraCreds().baseUrl.replace(/\/$/, "");
  const url = `${base}/browse/${issueKey}`;
  const warnings = [];

  if (plan.hold) {
    let held = false;
    try {
      await jiraFetch(`/rest/api/3/issue/${issueKey}/transitions`, { method: "POST", body: JSON.stringify({ transition: { id: ON_HOLD } }) });
      held = true;
    } catch (e) {
      // 28 refused: take whatever transition leads to "On Hold" (skill step 3).
      try {
        const list = await (await jiraFetch(`/rest/api/3/issue/${issueKey}/transitions`)).json();
        const tr = (list.transitions ?? []).find(x => /on hold/i.test(x.to?.name ?? x.name ?? ""));
        if (tr) {
          await jiraFetch(`/rest/api/3/issue/${issueKey}/transitions`, { method: "POST", body: JSON.stringify({ transition: { id: tr.id } }) });
          held = true;
        } else warnings.push(`Could not move to On Hold: ${e.message}`);
      } catch (e2) { warnings.push(`Could not move to On Hold: ${e2.message}`); }
    }
    if (held) {
      try {
        await jiraFetch(`/rest/api/3/issue/${issueKey}/comment`, { method: "POST", body: JSON.stringify({ body: commentAdf(plan.comment) }) });
      } catch (e) { warnings.push(`On Hold comment not added: ${e.message}`); }
    }
  }

  const attached = [];
  for (const f of files) {
    if (f.skip) { warnings.push(`${f.name} not attached (${f.skip})`); continue; }
    try {
      const form = new FormData();
      form.append("file", new Blob([fs.readFileSync(f.abs)], { type: /\.png$/i.test(f.name) ? "image/png" : "application/octet-stream" }), f.name);
      await jiraFetch(`/rest/api/3/issue/${issueKey}/attachments`, { method: "POST", body: form, headers: { "X-Atlassian-Token": "no-check" } });
      attached.push(f.name);
    } catch (e) { warnings.push(`${f.name} not attached: ${e.message}`); }
  }

  // Read back: High/Highest must be On Hold and assigned to the QA (skill step 5).
  let status, assignee;
  try {
    const issue = await (await jiraFetch(`/rest/api/3/issue/${issueKey}?fields=status,assignee`)).json();
    status = issue.fields?.status?.name;
    assignee = issue.fields?.assignee?.accountId;
    if (plan.hold && !/on hold/i.test(status ?? "")) warnings.push(`Status is "${status}", not On Hold. Move it by hand.`);
    const wantAssignee = plan.payload.fields.assignee.accountId;
    if (assignee !== wantAssignee) warnings.push("Assignee did not save as expected. Check it in Jira.");
  } catch (e) { warnings.push(`Could not read the new issue back: ${e.message}`); }

  return { issueKey, url, warnings, attached, status, assignee };
}
