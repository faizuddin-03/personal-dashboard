# Driving CapacityTrack in Chrome — verified mechanics

The log panel is a long right-hand column and it fights naive automation. Everything here was
learned the hard way and confirmed live. Follow it rather than improvising.

**Use the browser tools against your own logged-in Chrome session** — CapacityTrack needs your
session, so a fresh sandboxed browser will not work.

## When Chrome will not connect at all

The extension can simply be unreachable. On 30 Aug 2026 `list_connected_browsers` returned `[]` on
six attempts over two hours, so CapacityTrack could be neither read nor written.

**First, check it is the extension and not a tab problem.** `list_connected_browsers` returning `[]`
means no browser is paired with the account at all — that is not something `tabs_context` can fix.
Tell them to open the **Claude side panel** in Chrome (it has to be open, not just installed) and
confirm it is signed in with the same account as this session. If it looks signed in already,
`chrome://extensions`, toggle Claude off and on, reopen the panel.

**Two fallbacks, in order.**

1. **Write the drafts to a local HTML file with copy buttons and let them submit by hand.** Entry
   notes need real `<ul>` markup — pasting plain text into Trix gives no bullets, and the bullet
   markers are what survive CapacityTrack's card flattening. Render each note as real HTML in the
   page, and copy it with `navigator.clipboard.write` using a `text/html` blob so the formatting
   comes across on paste. Fall back to selecting the block for Ctrl+C, which preserves it too.
   **The week wrap-up boxes are plain text**, so copy those with `writeText` instead.

2. **To READ page state, ask them to screen-record it.** A 39 second recording of the timesheet
   recovered a full week — five days of entries, durations, note text, the week strip and the
   totals. Extract scene-change frames rather than every frame:

   ```
   ffmpeg -v error -i "recording.mp4" -vf "select='gt(scene,0.08)'+eq(n\,0),scale=1100:-1" -fps_mode vfr -q:v 4 frames/scene_%03d.jpg
   ```

   That gave **10 frames out of 1171** — one per screen they paused on, no duplicates. Notes:

   - **`-vsync` was removed in ffmpeg 9** and errors with `Unrecognized option 'vsync'`. Use
     **`-fps_mode vfr`**.
   - `scale=1100:-1` keeps the text readable while cutting the image cost. Ten frames ran to roughly
     30k tokens, against 31.6k for a *single* live screenshot.
   - Raise the `0.08` threshold if scrolling produces near-identical frames.
   - Tell them to pause a beat on each screen and to open each entry they want captured — the
     filter keys on visible change.

   This is also the **only** way to reconstruct a **closed** day, since past days are read-only and
   there is nothing to re-read even once Chrome returns.

## Step 7 — Submit in Chrome, one entry at a time

Open the day; the **Log time** panel opens with it:

```
https://capacity.modefair.com/log/YYYY-MM-DD                 # add an entry
https://capacity.modefair.com/log/YYYY-MM-DD?editing=<id>    # edit an existing one
https://capacity.modefair.com/log/YYYY-MM-DD?panel=none      # close the panel
```

### Verified mechanics — learned the hard way, 17 Aug 2026

The panel is a long right-hand column and it fights naive automation. What actually works:

- **Read the current values** by dumping the form's named fields — do this before every edit so
  the *before* half of the draft is real rather than remembered. They are `time_entry[...]`:
  `billable` (`true`/`false`) · `billable_kind` (`delivery`/`meeting`) · `project_id` ·
  `nonbillable_category` · `task_ref` · `task_url` · `submission_links][]` · `duration` ·
  `blocked` (`0`/`1`) · `incident` · `notes` (HTML) · `worked_on`. The edit form's action is
  `/time_entries/<id>` with a hidden `_method=patch`.
- **The notes field is Trix** (Rails ActionText). Set it with
  `document.querySelector('trix-editor').editor.loadHTML('<div>line</div><div>line</div>')` — one
  `<div>` per line. Then check `input[name="time_entry[notes]"]` actually picked it up before
  saving. Typing character by character is slow and mangles the formatting.
- **Do NOT scroll the panel.** `scroll` on this page zooms the whole viewport instead of scrolling
  it, which invalidates every coordinate you had. It resets after a navigation.
- **Do NOT use `form.requestSubmit()`** — it froze the renderer and timed out CDP.
- **Submit with the named button in JS** — `f.querySelector('[name="commit"]').click()`, per the
  faster path below. That is the default and it needs no screenshot.
  **FALLBACK ONLY, if the JS submit genuinely fails:** click `Save changes` / `Add entry` by
  coordinate from a fresh screenshot — a `ref` click on the submit button reported success without
  submitting. If the button sits below the fold, get its position via `getBoundingClientRect()` and
  scale by `screenshotWidth / window.innerWidth`. On a 1568-wide screenshot the button landed at
  roughly `(1327, 662)`. This path costs a screenshot per entry, so do not reach for it first.
- **NEVER submit a form picked by action URL alone.** The edit form and the delete form for an
  entry share the same action (`/time_entries/<id>`); they differ only in the hidden `_method`
  (`patch` vs `delete`). On 19 Aug 2026 a fetch() aimed at the edit form grabbed the delete form
  first and wiped the entry. If you must submit programmatically, select the form that does NOT
  contain `input[name=_method][value=delete]`, and check `_method` in the FormData before sending.
- **Deleting an entry pops a NATIVE confirm dialog ("Delete this entry?") that freezes CDP.**
  Every screenshot, script and click times out while it is up, and Return does not reach it.
  Ask the user to click OK in the browser, or avoid JS-driven delete clicks entirely. Verify the
  delete from the page afterwards like any other write.
- **The week wrap-up: click `Save draft`, never `Submit wrap-up`.** Charmain submits herself after
  checking the page (her instruction, 6 Sep 2026). Fill the four `week_plan[...]` textareas and the
  two radio groups with plain `.value` / `.checked` — ordinary fields, no Trix — read the lengths
  back, then click the `Save draft` button: the `commit` button whose text is `Save draft`. It has
  no confirm dialog, so a plain JS `.click()` is safe; still schedule it with
  `setTimeout(() => btn.click(), 200)` and return a short string so the evaluation comes back before
  Turbo posts. Confirm by reading the page: the wrap-up card should say **Draft**, not `Submitted`.
  For the record, `Submit wrap-up` carries `data-turbo-confirm` and a JS click on it hangs CDP for
  45s — one more reason it is not the skill's button to press.
- **Confirm from the page, never from the click — and confirm by READING, never by screenshot.**
  A real save shows a green **`Entry updated.`** flash *and* the card's own text changes. If the card
  still shows the old text, it did not save — check for validation errors before retrying, and don't
  retry blind. Read all of that with `javascript_tool` (return a small object such as
  `{saved: true, total: "6.9h"}`), which is ~100x cheaper than a screenshot and is the same answer.
  See golden rule 7.
- **⚠ The submit click often misses on the first try, silently.** Verified 17 Aug 2026: the same
  coordinate saved three entries and failed twice on a fourth. Retrying — sometimes at a slightly
  different x within the button — worked. The staged Trix content **survives** a missed click, so a
  retry is safe and does not duplicate anything.
- **So verify each save before moving to the next entry, and never navigate away on trust.** Batching
  four edits and navigating between them lost all four: each `?editing=` navigation resets the form,
  so an unconfirmed save is a silently discarded one.
- **Check the card, not `document.body.innerText`.** The panel still holds the staged text after a
  failed save, so a body-wide string match returns a false positive. Walk up from the entry's
  `a[href*="editing=<id>"]` link and read that card. Two reliable signals a save landed: the URL drops
  `?editing=`, and the card loses its `Editing in panel →` badge.
- **The `Who else was there` picker needs a literal `@`.** Typing just `Azila` shows no dropdown at
  all — the placeholder means it. Type `@Azila`, wait for the option row, click it. A chip appears
  and the form gains a hidden
  `time_entry[entry_participants_attributes][<timestamp>][user_id]=<id>`; check for that field to
  confirm the person actually attached rather than trusting the chip's appearance.
- **⚠ Click-and-type is unreliable on the fresh `Log time` panel — it silently loses the value.**
  Verified 17 Aug 2026: clicking Project / Task reference / Task link / Duration and typing into each
  left **all four empty** at submit time, with no error and no visual clue until the values were read
  back. The panel re-renders (Hotwire) and drops input that hasn't been committed. Typing worked on
  the `?editing=` form and failed on the add form, so **don't trust either** — use the method below
  for both.
- **Set the scalar fields directly, then verify.** They are ordinary form inputs, so a normal submit
  picks them up:
  ```js
  const set = (sel, val) => { const el = document.querySelector(sel); el.value = val;
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true})); return el.value; };
  set('[name="time_entry[project_id]"]', '1');              // 1 = eAuto Core; see the id table below
  set('[name="time_entry_project_search"]', 'eAuto Core');  // cosmetic, keeps the box readable
  set('[name="time_entry[task_ref]"]', 'EAINT-12131');
  set('[name="time_entry[task_url]"]', 'https://mfservices.atlassian.net/browse/EAINT-12131');
  set('[name="time_entry[duration]"]', '1h');
  ```
  `time_entry[project_id]` is the hidden field that actually counts; `time_entry_project_search` is
  only the visible search text. Setting the search box alone selects nothing.
- **⚠ The mention picker: focus-then-type does NOT work.** Verified 27 Aug 2026 — focusing
  `[name="mention_search"]` with JS and then sending a `type` action leaves the field empty, with
  no error and no dropdown. A coordinate click is no better: it can land elsewhere when the project
  dropdown is open (that dropdown renders whenever `time_entry_project_search` has a value, and it
  steals the click).

  **What actually works** — set the value, then fire a synthetic `keyup`, because the Stimulus
  controller behind the field listens on `keyup`, not on `input`:

  ```js
  const mi = form.querySelector('[name="mention_search"]');
  mi.focus();
  mi.value = '@Azfar';
  mi.dispatchEvent(new Event('input', {bubbles:true}));
  mi.dispatchEvent(new KeyboardEvent('keyup', {bubbles:true, key:'r'}));
  ```

  Wait about 1.8s, then click the option: `[data-mentions-target="option"]`.

  **⚠ The dropdown does NOT filter — it returns the whole roster.** Confirmed 7 Sep 2026: typing
  `@Yi Link` rendered all ~35 accounts, not a filtered list. So do not treat an unfiltered list as a
  failure, do not retype to narrow it, and never click the first option assuming it matched. Open the
  list with a bare `@` and **find your person by regex over the option text**, which also carries
  their job title:

  ```js
  const o = [...document.querySelectorAll('[data-mentions-target="option"]')]
    .find(x => /^\s*May Chin Mei Theng/.test(x.innerText));
  o.click();   // a plain JS click on the OPTION works — verified 7 Sep, 5 attachments, no misses
  ```

  Anchor the regex (`/^\s*Name/`) rather than matching loosely: the roster holds
  `May Chin Mei Theng`, `May Chin, +2` and `May Chin and Unknown User`, and a loose match takes the
  wrong one. Some accounts are listed under their full legal name — Azfar is
  `Muhammad Amirul Azfar Bin ...`, so match on the distinctive fragment (`/Amirul Azfar/`), not on
  what she calls them.

  **To attach several people, re-trigger between each pick.** The dropdown closes after a selection,
  so loop: set `@`, fire `keyup`, wait ~1.6s, click the option, wait ~1s, repeat. Verified 7 Sep
  attaching three to one entry (ids `3`, `43`, `19`) in a single call.

- **The chip is not proof.** Confirm the person actually attached by checking for the hidden
  `time_entry[entry_participants_attributes][<timestamp>][user_id]` field. A visible chip with no
  hidden field means nothing was attached.
- **Verify every field by reading `time_entry[...]` back, in one call, immediately before submitting.**
  This is not belt-and-braces; it is the step that catches the silent-empty failure above. Never
  submit a form you have not read back.

**A faster, safer submit path — verified 26 Aug 2026, five entries in a row, no misses.**
The coordinate-click dance above still works, but `scrollIntoView` on the submit button **zooms the
viewport** (same defect as wheel-scrolling) and leaves every coordinate wrong. This avoids it:

```js
// 1. Select the CREATE form explicitly. NEVER querySelector('form[action*="time_entries"]') —
//    once one entry exists, that returns its DELETE form first. Verified again 26 Aug 2026.
const f = [...document.querySelectorAll('form[action$="/time_entries"]')]
  .find(x => !x.querySelector('input[name="_method"]') && x.querySelector('trix-editor'));
// 2. Set the scalars, load Trix, then READ EVERY FIELD BACK and throw on a mismatch.
// 3. Submit with the named button — not requestSubmit(), not a coordinate:
f.querySelector('[name="commit"]').click();
// 4. Wait ~2.5s, then confirm from the page:
document.body.innerText.match(/·\s*\d+ entr\w+\s*·\s*[^\n]*/)[0]   // "· 3 entries · 6.9h"
```

Wrap it in a `window.__submitEntry(cfg)` helper on the first call and reuse it — the page is Turbo,
so `window` survives between entries and each call re-queries the form after the re-render. The
entry-count-and-total string is the cheapest reliable confirmation: it increments only on a real save.

**Re-confirmed 7 Sep 2026: seven entries plus one edit, no missed clicks.** The pattern that did it,
and worth copying exactly:

- Install three helpers on the **first** call and reuse them — `window.__F()` re-queries the create
  form (it must be re-queried every entry, Turbo replaces it), `window.__set(f,name,val)` sets a
  scalar and fires `input` + `change`, `window.__radio(f,name,val)` sets a radio and clicks it.
- **Schedule the submit rather than calling it inline:** `setTimeout(() => f.querySelector('[name="commit"]').click(), 150)`
  and return a short string. The evaluation returns before Turbo posts, so CDP never waits on the
  navigation. This is what stopped the "submit click often misses" problem from recurring.
- **Gate the submit on the readback in the same call.** Compute an `ok` boolean from every field and
  only schedule the click `if (ok)`. That way a mis-set field means nothing was submitted, instead
  of a bad entry you then have to edit:
  ```js
  const ok = chk.bil==='true' && chk.kind==='meeting' && chk.dur==='20m' && chk.li===2;
  if (ok) setTimeout(() => f.querySelector('[name="commit"]').click(), 150);
  ```
- **Count `<li>` in the notes as the readback check**, not the note's length — it catches a Trix
  `loadHTML` that silently dropped the list.
- Confirm with the entry-count string, which stepped `1 → 7` and `4.92h → 8h` cleanly.

**Non-billable needs the radio first, then a wait.** Switching `time_entry[billable]` to `false`
re-renders the panel, so `nonbillable_category` is not reliably settable in the same tick. Sequence
that worked: set the radio → `await` ~800ms → clear `project_id` **and** `time_entry_project_search`
to `''` → set `nonbillable_category`. The saved card then shows `General / Support` and the category
label, which is the confirmation.

**Editing an existing entry: `?editing=<id>` renders only the patch form.** Contrary to the delete-form
warning above, on 7 Sep 2026 `form[action$="/time_entries/2590"]` returned exactly one form, with
`_method=patch` and a `trix-editor`. **Keep the guard anyway** — select on `_method === 'patch'` and
the presence of `trix-editor`, and assert `_method` in the readback before submitting. Confirm the
edit landed by three signals together: the URL drops `?editing=`, the card loses `Editing in panel`,
and the card's own text shows the new wording (check for the new string **and** the absence of the
old one).

**⚠ A saved entry can differ from what you submitted — because she edits them by hand.** On
8 Sep 2026 two references had changed by the time they were read back: `Staging/uat3 regression`
had become `14 September Night Deployment` with a Jira version URL, and
`CR automation selection (08/09/2026)` had lost its date. This was first written up as the server
rewriting the fields; that was wrong — she was editing in parallel.

So re-read a reference before assuming your value is what's stored, and if it differs, **take her
version as the correction rather than putting yours back**. Do not diagnose a server-side mechanism
you have not observed.

**Project selection:** setting `time_entry[project_id]` (hidden) plus `time_entry_project_search`
(cosmetic) is enough — confirmed by the saved card showing `eAuto Core`.

**The ids, read off the combobox 3 Sep 2026.** Which one a ticket belongs to is decided by its
*title*, not its key — see *Choosing the project* in SKILL.md.

| id | Project | Client / group |
|---|---|---|
| 1 | eAuto Core | eAuto Sdn Bhd |
| 2 | eAuto Wholesale | eAuto Sdn Bhd |
| 3 | MyInspector Core | MyInspector Malaysia Sdn Bhd |
| 4 | Accounting System | Finance |
| 5 | WHT System | Finance |
| 6 | HRMS System | HR |
| 7 | Recruitment System | HR |
| 8 | CC System | Call Centre |
| 9 | Whatsapp & Email Blaster | General |
| 10 | Content | General |

**Re-read the ids rather than trusting this table** if a project is missing or a name looks wrong —
they are seeded rows and a new project gets the next id. Every option is in the DOM already, so one
call gets the live list without typing in the search box:

```js
[...document.querySelectorAll('[data-combobox-target="option"]')]
  .map(o => ({id: +o.dataset.value, name: o.dataset.name, label: o.innerText.trim()}))
```

The first row is a pinned recent-project shortcut, so ids repeat — dedupe by `id`.
Non-billable takes `time_entry[nonbillable_category]`; the live values are
`internal_meeting` · `standup` · `training` · `documentation` · `internal_tools` ·
`process_improvement` · `company_initiative` · `competition` · `ai_knowledge_sharing` ·
`buddy_mentoring` · `other`. Saved non-billable entries display their project as `General / Support`.

Per entry, set the fields in this order (later ones depend on earlier choices):

1. **Billable / Non-billable** radio.
2. **What kind** — `Delivery` or `Meeting` (billable only).
3. **Project** — decided by the **ticket title**, not its key (*Choosing the project*, SKILL.md).
   The combobox is a search; type the project name and pick the option under the right client, or
   set the id from the table above. *Non-billable takes no project — pick a **Category** instead.*
4. **Task reference** + **Task link**. Optional for meetings; Delivery needs a ticket *or* notes.
5. **Submission links** — `+ Add link` per extra one.
6. **Who else was there** — appears on non-billable entries and billable meetings. Type `@`,
   then pick real accounts; never free text. Your lead sees whether the named people logged the
   hour too.
   **⭐ REQUIRED on every meeting entry — you cannot meet yourself** (Charmain, 10 Sep 2026;
   May Chin made it the team rule on 11 Sep 2026). Billable `Meeting` and the non-billable meeting
   categories alike. **The eAuto QA huddle splits by role**: she attended → tag the **host**,
   nobody else; she hosted → picker empty, `Attendees: All eAuto QA, BA and Dev.` in the note.
   **The weekly `AI knowledge sharing` session is exempt** — picker empty, whoever presented
   (Charmain, 14 Sep 2026: *"can ignore tagging for weekly ai sharing session"*).
   Not applicable to solo Delivery entries, where the picker does not render. See *Every meeting
   tags the people in it* in SKILL.md.
   **The visible chip is not proof and the day list cannot be used to check** — the day-list card
   renders no participants at all, so grepping it for `With ` returns nothing either way. Confirm
   with the hidden `time_entry[entry_participants_attributes][<ts>][user_id]` field, in the same
   readback as every other field.
7. **Duration** — free text, phrase it however you would say it.
8. **Blocked on this task** — tick if anything was waiting on someone else, or if a meeting
   overran badly.
9. **Production incident** — tick only for in-hours firefighting on a client system.
10. **Notes** — the composed block from Step 5.
11. **Add entry**.

After each submit, re-read the day and confirm the entry appears with the right duration and
class. If one fails, stop the batch, report it, and don't silently retry a possible partial.

