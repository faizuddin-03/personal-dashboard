# Reference material — what each file is, and whether it is worth your time

| File | Size | Worth reading? |
| --- | --- | --- |
| `automation-README-full.md` | 130KB | **Skim the headings.** This is the project's own working README, written as it went. Sections **"Step two: build a fixture"**, **"Business types: 2 of 5 are automatable"**, **"What the form really validates"**, **"Traps this harness has already fallen into"**, **"What this harness cannot do"** and **"E2E SEGMENT 1"** are all flow-relevant. Everything between them is about the expiry-extension feature. The flow parts have been distilled into `01-flow/` — read those first and come here for the detail. |
| `e2e-scenarios.md` | 120KB | **Yes, selectively.** The 10 end-to-end scenarios with full preconditions, steps and expectations. The *expectations* are expiry-specific and will not transfer; the *preconditions and steps* are the flow written as test steps, which is a genuinely different and useful view of it. |
| `vault-rules.md` | 113KB | **Read the 5 marked FLOW.** R22 (one route only), R9 (what suppresses the controls), R19 (stubs), R12 (Registered is terminal), R17 (the role model). The other 18 are expiry-extension rules. |
| `FIXTURES.md` | 105KB | **Only if you need records.** The fixture register: every application built, what state it is in, what it was spent on, and the patch ledger. Useful as a model for how to track a shared record pool; useful in itself only if you are working on the same staging environment. |
| `EAINT-11982-SRD-v1.0-text.txt` | 16KB | Text extraction of the expiry-extension SRD. Included because its requirement register describes the application lifecycle and status model. |
| `EAINT-11868-SRD-v1.4-text.txt` | 29KB | Text extraction of the related SRD. Same reason. |
| `preapp-flow-first-draft.spec.ts` | 8KB | **Historical.** The very first attempt at a Pre-Application spec, written from the SRD's prose before anyone had got past the reCAPTCHA. Included as a record of what the flow looked like when it was still guessed — useful mainly as a contrast with `03-automation/src/preapp.js`, which is what it turned into once the screens were actually observed. |

---

## A note on the 4.8MB HAR that is NOT here

The project contains `preapp-flow.har`, and it is tempting. Do not go looking for it:
it is **60 entries of reCAPTCHA challenge traffic and not one `/obs/preOnb/` form
request.** The 23-08-2026 capture session never got through the gate, which is
precisely why the field maps had to be built as *hint lists* against the SRD's prose
and then learned from live pages (see `03-automation/src/assist.js` and
`reference-data/locators-learned.json`).

The **Snagit recording** from the same evening is what settled the flow —
`2026-08-23_21-11-11.mp4`, 12m 45s, staging, ~20:57 to 21:11 — and
`01-flow/FLOW-video-verified.md` is a frame-by-frame reading of it. The video itself
is not in this pack (size); ask Charmain if you want it.
