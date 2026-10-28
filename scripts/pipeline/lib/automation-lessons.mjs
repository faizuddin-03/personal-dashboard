// Automation lessons for Dwarf (2026-10-27, night enhancement round 4).
// Failures another QA already paid for, from Charmain's QA repo
// (docs/lessons.md, docs/writing-tests.md) and the patterns knowledge/
// automation-playbook.md already records from it. Kept as one prompt block so
// prompts-common.mjs AUTOMATION_RULES (owned by the engine) stays unchanged.
// Each line says the trap and what to do; sources in the comment per line.

export const AUTOMATION_LESSONS = `Automation lessons already paid for (another QA's repo + our knowledge; apply them, they are not obvious from the code):
1. **Popups are queued, not simultaneous.** Dismissing one reveals the next, and any of them eats menu clicks. Sweep until a whole pass closes nothing; pick the campaign dialog with :visible (the page ships several, only one shown).
2. **A listing with a mandatory date range returns nothing without one,** and UCD/BO listings show nothing until searched. Fill the range (one month at most), press search, read the record count, and only then say "the record is not there".
3. **Exported identifiers repeat.** Match an export or listing row on several fields (ref + date + amount ...), never on one id; read a column by its header text, never by index.
4. **Repeated logins look like a wrong password.** The shared instance throttles accounts that sign in over and over. Log in once per TS session and reuse it; on a refused login wait, do not retry into a lockout.
5. **A .catch(() => {}) still pays the full action timeout.** Give optional waits a short explicit timeout and log what was swallowed.
6. **A helper that cannot find its control throws, naming what it could not find** (and the URL), never returns quietly: the next red then lands on the right step.
7. **Suspect your own script first.** Before reporting a product fault, check for a step that took far longer than usual or passed without changing anything (filled a hidden control, clicked a covered button).
8. **An assertion loose enough for a broken build to pass is not an assertion.** Assert the exact value / status / message from the TS on the screen the user sees; check that the old behaviour would fail it.
9. **Playwright filters are regular expressions, not globs.** A path filter like "**/*.spec.ts" or an unescaped TS title in --grep selects nothing and looks green: keep the run route's escaping (app/api/eauto-12153/run/route.ts builds --grep with every regex character escaped).
10. **Act on THIS run's record.** Create or find the record in the TS itself and keep its reference; never .first() on a shared listing when the TS needs its own row.
11. **Say exactly which state you mean.** "absent" = not in the page (count 0, the claim a permission TS makes); "hidden" = in the page but not shown; "disabled" (greyed) is not "readonly" (looks editable, refuses input); an input's value is not its text (that may be the placeholder): use toHaveValue for inputs.
12. **Wait for the success words, not for the busy sign to go.** Wait for the screen's own result text (e.g. "Verification Passed"); a "Scanning IC" / spinner may never disappear on success.
13. **Card-reader (MyKad) and thumbprint steps:** read knowledge/mykad-emulator.md first. The card must be the logged-in dealer's (read the number the screen asks for); the thumbprint bypass skips the reader and proves nothing about it; say in the TS which one was used.
14. **Confirm every submit by the page's own words.** After Submit / Save / Approve / Pay, read the success banner, the new status cell or the validation message the page shows: a click that is never confirmed may have been rejected client-side, in plain words, in every screenshot.
15. **Every locator traces to markup you can point at:** a saved capture (_reference/html/), this ticket's HTML mock-up, or a working suite. Put the source in a one-line comment above the page-object method ("// from _reference/html/esim/x.html" or "// copied from scripts/eauto-12153/pages/BoPage.ts"); the suite check lists selectors with no source.
16. **Check the host before typing a password.** A redirect can land on another environment whose login form looks identical; the login helper compares the page's host AND its instance path segment (staging.eauto.my/eauto vs another instance on the same host) with the configured environment's and throws on a mismatch before any credential is typed.
17. **A test value needs a failing branch.** Ask "what would this TS show if the feature were broken?" If the same thing, it proves nothing: e.g. setting a field to the value it already holds. Pick the new value against the record's CURRENT value (read it first, choose one that differs) and assert the change.
18. **Never pass what was not reached.** If a screen or record cannot be reached (no such record, feature off, network), the TS fails or is skipped WITH the reason; a shared "done" path must not report success for a step that could fail.
19. **Check the environment before the long part.** A Playwright globalSetup (or the first step) opens the environment's login page, a few tries a few seconds apart, and stops the whole run with one plain message ("staging/eauto did not answer") if it never loads, so ten TS do not each fail on a site that is down.
20. **Tag each test with its TS priority** from scenarios.json ("priority": P1 / P2 / P3) as a Playwright tag, never in the title: test("<id>: <title>", { tag: ["@P1"] }, async ...). The title must stay exactly "<id>: <title>"; a TS with no priority gets no tag.
21. **Evidence for a "who can see / do it" TS shows who is logged in.** The screenshot includes the portal's own header with the user name or company (scroll it into view or capture it separately); a role label the script prints proves nothing.
22. **Look for a working flow before writing one.** For data setup or a long journey (eSTM, insurance, STMS, SSM / onboarding data, Service Hub), check our scripts/eauto-* suites first, then knowledge/script-inventory-team.md §4 (other QAs' reusable flows, e.g. the eSTM / insurance / STMS creators). Code under _reference/ is read only: copy what you need into the new suite (with a "// copied from <path>" line), never import from _reference/.`;
// Sources: 1 [charmain-repo: docs/lessons.md:10-15]; 2 [charmain-repo: docs/lessons.md:17-20],
// spec-reviewer row 16 [charmain-repo: .claude/agents/spec-reviewer.md:54], memory "eAuto date filters: max one month";
// 3 [charmain-repo: docs/lessons.md:22-24], [charmain-repo: docs/writing-tests.md:46-54];
// 4 [charmain-repo: docs/lessons.md:26-29]; 5 [charmain-repo: docs/lessons.md:58-60];
// 6 [charmain-repo: docs/writing-tests.md:63-67], knowledge/automation-playbook.md "requireVisible";
// 7 [charmain-repo: docs/lessons.md:44-48]; 8 [charmain-repo: docs/lessons.md:53-56];
// 9 [charmain-repo: docs/layout.md:40-43]; 10 spec-reviewer row 15 [charmain-repo: .claude/agents/spec-reviewer.md:53].
// Night round 11: 11 [charmain-repo: docs/writing-tests.md:147-161] (element states); 12 [charmain-repo: docs/lessons.md:89-90];
// 13 [charmain-repo: docs/lessons.md:84-87], [charmain-repo: docs/writing-tests.md:84-98], knowledge/mykad-emulator.md.
// Night round 19: 14 [charmain-repo: docs/qa-principles.md:116-119] (the unchecked press);
// 15 [charmain-repo: .claude/skills/spec-author/SKILL.md:85-87], spec-reviewer row 2 [charmain-repo: .claude/agents/spec-reviewer.md:40].
// Night round 22: 16 [charmain-repo: docs/qa-principles.md:84-95], instance segment [charmain-repo: docs/lessons.md:37-41] (round 27); 17 [charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:131-137];
// 18 [charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:77-83]; 19 [charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:85].
// Night round 24: 20 [charmain-repo: .claude/skills/spec-author/SKILL.md:73-75] (exactly one @P1..@P3 tag), [charmain-repo: .claude/skills/scenario-ledger/SKILL.md:77].
// Night round 31: 21 [charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:87-93].
// Night round 37: 22 knowledge/script-inventory-team.md §4 row 1 (quoting [charmain-repo: intake/sources.yaml:151]); AGENTS.md "_reference/ is read-only".
