#!/usr/bin/env bash
#
# E2E TAKES THAT START AT THE reCAPTCHA GATE — Charmain's ruling, 27-08-2026 night:
#   "all E2E ts need to film start from the recaptcha gate"
#
#   bash scripts/run-e2e-gate-takes.sh                    # print the plan, run nothing
#   bash scripts/run-e2e-gate-takes.sh --go E2E_TS1       # film segment 1 of one row
#   bash scripts/run-e2e-gate-takes.sh --go --all         # film segment 1 of all eight
#   bash scripts/run-e2e-gate-takes.sh --segment 2 --go E2E_TS1 --12235-fixed
#
# ---------------------------------------------------------------------------
# YOU MUST BE AT THE KEYBOARD. This is not the read-only batch.
#
# Segment 1 passes THREE gates that are not ours to pass, per row:
#   1. the reCAPTCHA tick  (per build — check:gate says the session is NOT reusable)
#   2. the RM 108.00 Fiuu bank-simulator login (pre-application fee)
#   3. the RM 990.00 Fiuu bank-simulator login (registration fee)
# Budget ~30 min of film and ~12 min of your hands per row. Do not schedule this
# and walk away: the run PAUSES at each gate and waits for you.
# ---------------------------------------------------------------------------
#
# WHY TWO SEGMENTS
#
# Seven of these rows need a date in the PAST or a status the midnight cron writes,
# and nothing on the QA side can force that cron — src/support.js owns the DATE, the
# cron owns the STATUS (R12). So "gate to end in one unbroken take" is not available
# for them, and Charmain accepted a declared seam instead:
#
#   segment 1  gate -> ... -> regfee -> record -> patch the expiry     (no extension spent)
#   segment 2  reopen -> extend -> after-state -> two-surface sweep    (spends R1, forever)
#
# The seam falls exactly where the cost is. Segment 1 spends NO extension, so it can
# be filmed today and re-filmed if it goes wrong. Segment 2 cannot.
#
# WHICH IS WHY SEGMENT 2 IS GATED BEHIND A FLAG
#
# Every extend-shaped row carries the `greyed-after` point, which wants the greyed
# Extend button with its once-only tooltip painted. On this build that button VANISHES
# after an extension — EAINT-12235, confirmed 27-08 16:47 on purpose-built NA68001104,
# single variable. So segment 2 reaches its after-state and goes RED, having spent the
# fixture's one and only extension to do it. Nine rows filmed today = nine
# irreplaceable fixtures burned on nine takes that cannot finish.
#
# So --12235-fixed must be passed by hand, and only once the fix is actually on
# staging. It is not a formality: it is the difference between an evidence run and
# nine dead fixtures.
set -u
cd "$(dirname "$0")/.."

# E2E_TS8 IS DELIBERATELY ABSENT — Charmain exempted it, 27-08-2026.
# "Created before the deploy" is false the moment you create the record at the gate
# today. It films from BackOffice on a genuine pre-deploy record chosen by
# src/provenance.js, never by a date filter (staging has no clean deploy boundary:
# created+90 and the deviations interleave by minutes).
ROWS=(E2E_TS1 E2E_TS2 E2E_TS3 E2E_TS4 E2E_TS5 E2E_TS6 E2E_TS7 E2E_TS9 E2E_TS10)

GO=0; ALL=0; SEG=1; FIXED=0
WANTED=()
for a in "$@"; do
  case "$a" in
    --go) GO=1 ;;
    --all) ALL=1 ;;
    --segment) SEG=NEXT ;;
    --12235-fixed) FIXED=1 ;;
    1|2) if [ "$SEG" = "NEXT" ]; then SEG="$a"; else WANTED+=("$a"); fi ;;
    *) WANTED+=("$a") ;;
  esac
done
[ "$SEG" = "NEXT" ] && SEG=1

LOG="../e2e-gate-takes-$(date +%Y%m%d-%H%M).log"
GAP="${EV_BATCH_GAP:-25}"
ARTEFACTS="../evidence/run-artefacts/e2e-gate-$(date +%Y%m%d-%H%M)"
say () { echo "$*" | tee -a "$LOG"; }

if [ "$ALL" = "1" ]; then WANTED=("${ROWS[@]}"); fi
if [ "${#WANTED[@]}" -eq 0 ]; then WANTED=("${ROWS[@]}"); fi

say "E2E GATE-START TAKES — segment $SEG — $(date)"
say ""

# ---- the guards, before anything is opened ----------------------------------
if [ "$SEG" = "2" ] && [ "$FIXED" = "0" ]; then
  say "REFUSING to film segment 2."
  say ""
  say "  Every extend row carries the greyed-after point. On this build the Extend button"
  say "  VANISHES after an extension (EAINT-12235, confirmed 27-08 16:47 on NA68001104,"
  say "  single variable), so the take reaches its after-state and goes RED — having spent"
  say "  the fixture's one and only extension (R1) to get there."
  say ""
  say "  Filming these nine rows now burns nine irreplaceable fixtures on nine takes that"
  say "  cannot reach a full checklist, and adds nothing to the 12235 finding, which is"
  say "  already proved on a purpose-built record with a single variable."
  say ""
  say "  When Xiwei's fix is on staging:  --segment 2 --go <ref> --12235-fixed"
  exit 2
fi

for w in "${WANTED[@]}"; do
  found=0
  for r in "${ROWS[@]}"; do [ "$r" = "$w" ] && found=1; done
  if [ "$found" = "0" ]; then
    if [ "$w" = "E2E_TS8" ]; then
      say "E2E_TS8 is EXEMPT from the gate rule (Charmain, 27-08) — a record created at the gate"
      say "today is post-deploy by construction. Film it from BackOffice on a pre-deploy record:"
      say "    TS=E2E_TS8 EV_APP_NO=<pre-deploy record> npm run evidence"
      say "Choose that record by provenance, not by date:  node -e \"require('./src/provenance')\""
      exit 2
    fi
    say "\"$w\" is not an E2E row. Known: ${ROWS[*]}"
    exit 2
  fi
done

# ---- pre-flight -------------------------------------------------------------
if [ "$GO" = "1" ]; then
  say "---- pre-flight ----"
  # The branch probe is FIRST and it is the important one. A ReferenceError at phase
  # 9 of 11 costs a reCAPTCHA tick and two Fiuu logins; this catches it in a second.
  if ! node scripts/probe-creation-branches.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:creation — a creation branch does not execute."
    say "        Run it directly to see which: node scripts/probe-creation-branches.js"
    exit 1
  fi
  say "  ok    probe:creation — all eleven creation branches execute"
  if ! node scripts/check-points.mjs >>"$LOG" 2>&1; then
    say "  FAIL  check:points — the register and the checklists disagree."
    exit 1
  fi
  say "  ok    check:points — register and checklists agree"
  # THE LIFECYCLE LEGS, DRIVEN — added 29-08-2026 with the legs themselves.
  #
  # Two of the four ACT and both act AFTER Confirm: E2E_TS6 patches the expiry past
  # the window through the support tool, E2E_TS7 opens a second window on the dealer
  # link. A ReferenceError in either arrives with the extension already spent, and
  # node --check cannot see a branch that never runs. This drives all four against
  # stubs, and proves each can be made to FAIL — offline, about a second.
  if ! node scripts/probe-lifecycle-legs.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:lifecycle — a lifecycle leg does not run, or cannot be made to fail."
    say "        Run it directly:  node scripts/probe-lifecycle-legs.js"
    exit 1
  fi
  say "  ok    probe:lifecycle — all four lifecycle legs run, tick, and can fail"
  # The docs are part of the rig. A point added to the checklist and not to the README or
  # the skill reference leaves the next operator reading a stale list mid-take.
  if ! node scripts/check-docs.mjs >>"$LOG" 2>&1; then
    say "  FAIL  check:docs — the code and the docs disagree about this rig."
    exit 1
  fi
  say "  ok    check:docs — the docs still describe the rig"
  if ! node scripts/probe-still-clear.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:still — stills would be cut with the checklist across them."
    exit 1
  fi
  say "  ok    probe:still — stills can be cut clear of the overlay"
  # Charmain, 28-08-2026: "always show the cursor on screen like real human doing
  # testing", and it applies to every take. paintCursor() used to create its element
  # lazily, so a page could load with no cursor at all until something moved it.
  # Headless, ~3s, no fixture — cheap enough to gate every take on.
  if ! node scripts/probe-cursor.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:cursor — the pointer is not on screen from page birth."
    exit 1
  fi
  say "  ok    probe:cursor — the pointer is on screen from the first frame"
  # And that it ARRIVES before the click. The cursor existing is not the claim
  # Charmain made — "clicking those buttons need cursor to be there" is. Asserted from
  # inside the page at mousedown, offline, ~4s.
  if ! node scripts/probe-pointer.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:pointer — the cursor does not reach the control before the press."
    exit 1
  fi
  say "  ok    probe:pointer — the cursor arrives on the control before every click"
  if ! node scripts/probe-framing.js >>"$LOG" 2>&1; then
    say "  FAIL  probe:framing — the camera cannot see the browser window."
    exit 1
  fi
  # VPN LAST, AND IT IS A HARD GATE (28-08-2026).
  #
  # The support tool patches the expiry, and that patch is now a filmed LEG with four
  # BackOffice reads depending on it. It has failed mid-take on three consecutive runs
  # — up at 44ms sixty seconds before launch, gone by the time the phase ran — and each
  # failure costs a reCAPTCHA tick and ten minutes of Charmain's morning. A burst, not
  # one ping: a freshly reconnected tunnel flaps.
  if ! node -e '
    const vpn = require("./src/vpn");
    (async () => {
      let ok = 0;
      for (let i = 0; i < 3; i += 1) {
        const r = await vpn.probe("172.30.202.23", 8888, 4000);
        if (r.ok) ok += 1;
        if (i < 2) await new Promise((f) => setTimeout(f, 1200));
      }
      if (ok < 3) { console.log(`support tool answered ${ok}/3 probes`); process.exit(1); }
    })();
  ' >>"$LOG" 2>&1; then
    say "  FAIL  VPN — the support tool did not answer 3 of 3 probes."
    say "        The expiry patch is a filmed leg and four BackOffice checks depend on it."
    say "        Reconnect FortiClient and re-run; do not spend a reCAPTCHA on a run that"
    say "        cannot patch. (This has failed mid-take three times already.)"
    exit 1
  fi
  say "  ok    VPN — the support tool answered 3 of 3 probes"
  say "  ok    probe:framing — the recorded display will see the browser"
  say ""
fi

# ---- the plan ---------------------------------------------------------------
say "---- plan: ${#WANTED[@]} row(s), segment $SEG ----"
for r in "${WANTED[@]}"; do
  if [ "$SEG" = "1" ]; then
    say "  $(printf '%-10s' "$r")  gate -> preapp -> RM108 -> approve -> link -> appform -> assign ->"
    say "  $(printf '%-10s' '')    submit -> approve-app -> regdocs -> verify -> RM990 -> record -> patch"
  else
    say "  $(printf '%-10s' "$r")  reopen -> extend -> after-state -> listing+export sweep -> audit row"
  fi
done
say ""
if [ "$SEG" = "1" ]; then
  # ASK FOR THE HANDS THE RUN ACTUALLY NEEDS, NOT THE WORST CASE.
  #
  # This block used to say "THREE HUMAN GATES ... ~12 min of your hands, stay at the
  # keyboard" unconditionally. It was reading `human: true` off the LEG, which says
  # what a payment needs when nothing can log in for it — not what THIS machine
  # needs. With FIUU_SIM_USER/PASS in the shared store, payFpx logs into the sandbox
  # itself and drives the TAC, the Approved status and Pay Now, so the reCAPTCHA is
  # the only gate. Confirmed on the 28-08-2026 00:44 take: one tick, 12/13 filmed.
  node -e '
    const c = require("./src/creation");
    const now = c.humanGatesNow();
    const names = { "create-gate": "one reCAPTCHA tick", "create-preapp": "the RM 108 Fiuu login", "create-regfee": "the RM 990 Fiuu login" };
    if (now.length === 1) {
      console.log("  ONE HUMAN GATE PER ROW: " + names[now[0]] + ".");
      console.log("  Both Fiuu payments drive themselves from the shared store (FIUU_SIM_*) — the");
      console.log("  simulator login, the TAC, status Approved and Pay Now. They pause for you ONLY");
      console.log("  if that stored pair is stale, and say so in the console when they do.");
      console.log("  ~30 min of film, but only the reCAPTCHA needs your hands.");
    } else {
      console.log("  " + now.length + " HUMAN GATE(S) PER ROW: " + now.map((k) => names[k] || k).join(", ") + ".");
      console.log("  FIUU_SIM_USER / FIUU_SIM_PASS are not in ~/.claude/secrets/eauto.env, so each");
      console.log("  payment stops at the sandbox login. Fill them and only the reCAPTCHA remains.");
      console.log("  ~30 min of film and ~12 min of your hands each. Stay at the keyboard.");
    }
  ' 2>/dev/null | tee -a "$LOG" || say "  (could not compute the gate list — assume three)"
  say "  NO extension is spent in segment 1 — a row that goes wrong can be re-filmed."
fi
say ""

if [ "$GO" = "0" ]; then
  say "Nothing was recorded. Add --go when you are at the keyboard and ready."
  exit 0
fi

mkdir -p "$ARTEFACTS"

# ---- run --------------------------------------------------------------------
PASS=0; FAIL=0; N=0
for ref in "${WANTED[@]}"; do
  N=$((N+1))
  say ""
  say "=== [$N/${#WANTED[@]}] $ref  segment $SEG   ($(date +%H:%M:%S)) ==="

  # ---- THE VPN, BEFORE EVERY ROW AND NOT JUST ONCE -------------------------
  #
  # 30-08-2026, and this cost two reCAPTCHA ticks. The pre-flight above probed the
  # support tool at 19:59 and got 3 of 3. The tunnel died on its idle timeout around
  # 20:15, and the batch carried straight on: E2E_TS4 and E2E_TS9 both filmed their
  # full creation flow, reached the patch leg, found 172.30.202.23:8888 unreachable,
  # and came back 3/8 with four BackOffice readings refused. Ten minutes of film and a
  # human gate each, for a record still sitting at created+90d.
  #
  # A guard consulted once at the top of a two-hour batch is not a guard. It is a
  # reading of how things were before the batch started. Each row is ~30 minutes, the
  # tunnel's idle lifetime is about fifteen, so at least one drop per batch is the
  # EXPECTED case rather than the unlucky one.
  #
  # Three probes, because a freshly reconnected tunnel flaps. This refuses the row
  # BEFORE the reCAPTCHA rather than after the second payment.
  if ! node -e '
    const vpn = require("./src/vpn");
    (async () => {
      let ok = 0;
      for (let i = 0; i < 3; i += 1) {
        const r = await vpn.probe("172.30.202.23", 8888, 4000);
        if (r.ok) ok += 1;
        if (i < 2) await new Promise((f) => setTimeout(f, 1200));
      }
      if (ok < 3) { console.log(`support tool answered ${ok}/3 probes`); process.exit(1); }
    })();
  ' >>"$LOG" 2>&1; then
    say "  SKIPPED — the VPN is not answering, and this row would spend your reCAPTCHA to"
    say "            reach a patch leg that cannot run. Reconnect FortiClient, start the"
    say "            keepalive (npm run vpn:keepalive), and re-run this row."
    FAIL=$((FAIL+1))
    continue
  fi
  say "    VPN ok (3/3) at the start of this row"
  say "    the run will PAUSE at each human gate and wait for you"
  out="$(mktemp)"
  # TWO DIFFERENT RECORDERS, and that is deliberate. Segment 1 is
  # tests/91-e2e-creation.spec.js in the `e2e-creation` project — several contexts,
  # three roles, three human gates, no Extend click anywhere. Segment 2 is the
  # existing house recorder, unchanged. Threading a second mode through 3,900 working
  # lines would have risked every read-only take to add a path that cannot be tested
  # without a person at the keyboard.
  #
  # NO EV_SPEND on segment 1 — it cannot reach Confirm. Segment 2 needs it, and by
  # then --12235-fixed has already been given by hand.
  if [ "$SEG" = "1" ]; then
    ENVV=(TS="$ref")
    CMD=(npm run evidence:creation --silent)
  else
    # THE RECORD COMES FROM SEGMENT 1'S SEAM FILE, not from memory and not from the
    # coverage plan. The plan quotes whichever earlier take scored highest, which is
    # history rather than a precondition — that is what sent TS48 back to an already
    # extended record on 27-08. Segment 2 must open the record segment 1 CREATED, so
    # it is read from `SEG1-<ref>_..._seam.json`, newest first.
    SEAM_APPNO="$(node -e '
      const fs=require("fs"), path=require("path");
      const dir=path.resolve("..","evidence","EAINT-11982","video");
      const ref=process.argv[1];
      let best=null;
      try {
        for (const f of fs.readdirSync(dir)) {
          if (!f.startsWith("SEG1-"+ref+"_") || !f.endsWith("_seam.json")) continue;
          const full=path.join(dir,f);
          const st=fs.statSync(full);
          if (!best || st.mtimeMs>best.mtimeMs) best={full,mtimeMs:st.mtimeMs};
        }
      } catch {}
      if (!best) process.exit(0);
      try {
        const j=JSON.parse(fs.readFileSync(best.full,"utf8"));
        if (j.applicationNo) process.stdout.write(String(j.applicationNo));
      } catch {}
    ' "$ref" 2>/dev/null)"
    if [ -z "$SEAM_APPNO" ]; then
      say "  SKIP  $ref — no segment 1 seam file names a record. Film segment 1 first:"
      say "        bash scripts/run-e2e-gate-takes.sh --go $ref"
      FAIL=$((FAIL+1))
      continue
    fi
    say "  record from segment 1's seam file: $SEAM_APPNO"
    ENVV=(TS="$ref" EV_APP_NO="$SEAM_APPNO" EV_SPEND=1)
    CMD=(npm run evidence --silent)
  fi
  # ONE attempt, deliberately. The read-only batch retries once because a failed
  # login is its likeliest fault and it costs nothing. Here a retry means asking a
  # person to sit through three gates again, and the failure is far more likely to
  # be a selector than a flake. Read the log and decide by hand.
  if env "${ENVV[@]}" "${CMD[@]}" >"$out" 2>&1; then
    cat "$out" >>"$LOG"
    say "  PASS  $ref  $(grep -h 'CAPTURED' "$out" | tail -1)"
    APPNO="$(grep -hoE 'NA[0-9]{8}' "$out" | tail -1)"
    [ -n "$APPNO" ] && say "  record created: $APPNO  <- segment 2 films THIS record"
    PASS=$((PASS+1))
  else
    cat "$out" >>"$LOG"
    CAP="$(grep -h 'CAPTURED' "$out" | tail -1)"
    if [ -z "$CAP" ]; then
      say "  FAIL  $ref  NO CAPTURED LINE — the recorder never started (no sidecar written)"
    else
      say "  FAIL  $ref  $CAP"
    fi
    grep -hE 'Error:|TypeError|ReferenceError|threw:' "$out" | sort -u | head -5 | tee -a "$LOG"
    say "  NOT retried — a retry costs you three more gates. Read the log first:  $LOG"
    FAIL=$((FAIL+1))
  fi
  rm -f "$out"
  if [ -d test-results ] && [ -n "$(ls -A test-results 2>/dev/null)" ]; then
    cp -r test-results "$ARTEFACTS/${ref}_seg${SEG}" 2>/dev/null || true
  fi
  sleep "$GAP"
done

say ""
say "########## SEGMENT $SEG DONE — $PASS passed, $FAIL failed ##########"
say "$(date +%H:%M:%S)   artefacts: $ARTEFACTS"
say ""
say "The exit code is NOT the verdict — the recorder writes R21 MISMATCH into the"
say "sidecar without failing the spec. Read the sidecars and the board:"
say ""
node scripts/evidence-coverage.mjs | tee -a "$LOG"
say "log: $LOG"

if [ "$FAIL" -gt 0 ]; then
  say ""
  say "exiting 1 — $FAIL row(s) failed."
  exit 1
fi
exit 0
