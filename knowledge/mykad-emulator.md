# MyKad Reader Emulator — the fingerprint/MyKad-auth bypass

The local tool that stands in for the physical Dermalog MyKad + thumbprint
reader hardware, so a Deregistration transaction's owner/AATF-rep
authentication steps can be automated without real hardware. **This is a
different system from eSIM** ([esim.md](esim.md)) — eSIM is a hosted,
VPN-only web app that steers JPJ/payment/etc. response codes; this emulator
is a small **local WebSocket server + control-panel page**, run on the
tester's own machine, that the AATF portal's own client-side JS talks to
directly. Don't confuse the two, and don't port eSIM automation patterns over
to this. `[from Faizuddin, 2026-08-21]`

## How it works

```
Control panel   http://localhost:7878
WebSocket       ws://localhost:7878/IDCard
```

The AATF portal's `mykad-websocket-v2.js` (loaded on every MyKad/thumbprint
auth screen — see [flow-edereg.md](flow-edereg.md) §4) opens a WebSocket
connection to this exact same local address when the page's "Scan IC" /
auto-read flow starts, expecting a real Dermalog device on the other end. The
emulator's control-panel page is a **separate, human-facing client of that
same server** — it doesn't inject anything into the AATF page directly, and
the two aren't otherwise related. Instead:

1. A human (or a script) opens `localhost:7878` and clicks **Connect** —
   this opens the panel's OWN WebSocket connection to `ws://localhost:7878/IDCard`.
2. Choosing a **Quick Profile** button fills the `INSERTCARD` JSON textarea
   with that profile's full card data (NRIC, name, address, photo, etc.).
3. Clicking **Insert Card** sends `INSERTCARD:{...json...}` over the socket.
   The emulator server responds with a `SimulatorAck` ("INSERTCARD OK") to
   whichever client(s) are listening.
4. From here, the flow **"continues like normal"** — i.e. the AATF page (open
   in the same or a different tab, on the "Scan IC" screen) picks up the
   inserted card through its own already-open connection to the same server
   and runs its normal `hSmart__Card__Ready` → `startReadKad` →
   `hBatchModeRead` → `hIdentical` → "Verification Passed" / "Verification
   Completed" sequence, exactly as it would with real hardware. `[verified:
   live HTML, 2026-08-21]`

Capture: [`_reference/html/mykad-emulator/control-panel.html`](../_reference/html/mykad-emulator/control-panel.html)
(the control panel itself, base64 image blobs trimmed) and the resulting
AATF-side success state at
[`_reference/codebases/AATF/EAINT-9306-dereg-step1-owner-mykad-auth.html`](../_reference/codebases/AATF/EAINT-9306-dereg-step1-owner-mykad-auth.html)
STATE 2.

## Profiles

Three profiles ship built into the emulator's page script (`johan`,
`gstesttest`, `testucd` — labelled "Johan (Super Rock Auto)", "Gstesttest
(Super Rocket)", "Testucd (Middleman / TEST UCD AUTO)" in the UI). Anything
else — like **`FaizuddinAATF`**, the confirmed profile for this ticket's
default test account (see [flow-edereg.md](flow-edereg.md) §7) — is
tester-created via the **Save Profile** button and persisted in the control
panel page's own `localStorage` under the key `mykad_user_profiles`, **not on
any server**. This has a real consequence for automation: a profile saved on
one machine/browser profile does not exist anywhere else — a CI runner or a
fresh browser context needs the profile re-created (or the raw `INSERTCARD`
JSON sent directly via `sendCmd`, bypassing the profile UI entirely) rather
than assuming `FaizuddinAATF` is just "there."

`FaizuddinAATF`'s card data matches the confirmed AATF login (`NRIC
030217141005`, name `MUHAMMAD FAIZUDDIN BIN BIDI`) — i.e. the emulator's
virtual MyKad and the AATF account being authenticated are the same identity,
which is what the real hardware flow expects too (the owner physically
presents their own card).

## Automation shape

**Built 2026-08-21, confirmed working live end-to-end 2026-08-24** in
`scripts/eauto-edereg-precheck/utils/mykadEmulator.ts`. `MykadEmulatorClient`
opens one Playwright page per `insertCard()` call, navigates it to
`http://localhost:7878` (the control panel page itself — NOT `about:blank`,
see the correction below), and evaluates a raw
`new WebSocket('ws://localhost:7878/IDCard')` inside it — the same approach
the control panel's own `doConnect()` uses, just headless — rather than
adding an npm WebSocket dependency. `insertCard()` sends `INSERTCARD:<json>`
and waits for the `"INSERTCARD OK"` ack before returning.
`pages/DeregTransactionPage.ts`'s `runMykadAuth()` calls `insertCard()` fresh
before EACH of the three auth points (owner step 1, owner-consent step 3,
AATF-rep step 3) — the card auto-ejects after each screen's own read
completes, so a single call at the start of the flow is not enough. The
multi-session question below (a separate connection from the AATF page's
own) is now resolved in practice — the confirmed live run proves the server
relays `INSERTCARD` correctly across separate connections.

**Card source made per-user-configurable 2026-08-26, per Faizuddin — two
attempts, the first WRONG and reverted same day.**

*Attempt 1 (reverted): "profile name" lookup against the control panel's
OWN `localStorage`.* Since `insertCard()` originally always sent the
`FaizuddinAATF` card fields hardcoded (`CARD_FAIZUDDIN_AATF`), and per this
file's "Profiles" section a saved profile lives ONLY in that machine's
browser `localStorage`, never on any server — the first fix tried having
`MykadEmulatorClient` accept a `profileName`, then `insertCard()` reads
`localStorage.getItem('mykad_user_profiles')` on the control panel page and
looks that name up. **This is fundamentally broken for automation and was
never actually validated live before Faizuddin caught it**: "its not
choosing... i think the automation injects the ic and name" — both User A
and User B were coming through as the same identity. Root cause: Playwright
launches a fresh, ISOLATED browser context every single run (no
`launchPersistentContext`/`userDataDir` anywhere in this suite) — its
`localStorage` is NEVER the browser profile a human used to manually save a
Quick Profile via the control panel UI. The lookup silently found nothing
every time and fell through to the same default identity for every caller,
with no visible error. **Lesson for next time**: `localStorage`/cookies/any
browser-profile-scoped state a human sets up by hand is invisible to a
fresh Playwright context by design — don't design an automation hand-off
around "the tester saves something in their browser," only around inputs
the automation can actually receive (env vars, dashboard fields, files).

*Attempt 2 (current, correct): inject NRIC/name directly.* Same shape
`CARD_FAIZUDDIN_AATF` always used — `MykadEmulatorClient`'s constructor now
takes `{ nric?, name? }` (defaults to `CONFIG.mykadNric`/`mykadName`, env
`DPC_MYKAD_NRIC`/`DPC_MYKAD_NAME`), and builds the full card by spreading
`CARD_FAIZUDDIN_AATF`'s other fields (DOB/address/etc., which don't need to
vary per identity) with those two overridden. `insertCard()` no longer
takes any argument or does any localStorage read — the identity is fixed at
construction time. A colleague still doesn't touch code: they type their
own AATF account's NRIC/name into the dashboard instead of a profile name.

**Dashboard wiring**: `/eauto/edereg-precheck` has "MyKad NRIC"/"MyKad name"
fields (always visible) plus a second pair for User B ("Multiple Users"
test cases only), pre-filled with confirmed defaults but freely editable —
`app/api/eauto-edereg-precheck/run/route.ts` passes them through as
`DPC_MYKAD_NRIC`/`DPC_MYKAD_NAME`/`DPC_MYKAD_NRIC_SUB`/`DPC_MYKAD_NAME_SUB`.
User B's confirmed identity for this ticket, 2026-08-26: NRIC
`030117-14-1005`, name `MUHAMMAD FAIZUDDIN SUB2`.

`CARD_FAIZUDDIN_AATF` itself is unchanged and still exported — now serving
only as that one documented fallback, not the default path.

## Browser device permission prompt — confirmed live 2026-08-22

The AATF fingerprint/MyKad auth page makes the browser show a **standard
Chrome permission bar (Allow/Block, not a WebHID/WebUSB device-chooser
list)** when its widget tries to reach the reader — real hardware or this
emulator, the page can't tell the difference. Confirmed by Faizuddin on the
first live run of `scripts/eauto-edereg-precheck`'s Deregistration leg: the
run hung indefinitely at the MyKad step with no error, because nothing in
the automation could click a browser-chrome "Allow" button.

**Why manual testing never showed this**: a browser profile that already
granted the permission once keeps it granted — a human tester hits the
prompt on their very first-ever MyKad screen and never sees it again. A
fresh Playwright context starts with nothing granted, so it re-appears on
**every single run**, unlike almost everything else in this flow.

**Fix**: pre-grant the permission via `BrowserContext.grantPermissions()`
before navigating anywhere near the auth screens, so the prompt never has a
chance to appear — done in
`scripts/eauto-edereg-precheck/fixtures/sessionFixture.ts`'s `session`
fixture, scoped to the eAuto origin. The exact permission name the widget
requests was **not confirmed** (Playwright can't inspect which permission a
plain Allow/Block bar was for after the fact) — since it's a simple bar, not
a device chooser, it must be one of Chrome's fixed Permissions-API set, so
the fix grants the plausible candidates together (`camera`, `microphone`,
`midi`, `midi-sysex`) rather than betting on one. If a future run still
hangs at a MyKad screen, that's the first thing to revisit — capture the
exact permission name (the address-bar permission icon shows it once
granted, or check via `chrome://settings/content/all` for the eAuto origin
after a manual grant) and narrow the list, or add whichever name was missing.

**For any future ticket/test suite automating a MyKad/thumbprint screen for
the first time in a fresh context** (not just this one): grant permissions
before first navigation, don't wait to discover the hang. A hang with no
error, no exception, and no obviously-relevant log line is this prompt's
signature — check for it before assuming a selector or the emulator
connection itself is at fault.

**Retroactive note, 2026-08-22**: this may well have BEEN the Local Network
Access prompt (§ "Dermalog Biometric Device — Update Required" gate below),
misidentified — LNA's permission UI is also a plain Allow/Block bar. If so,
`camera`/`microphone`/`midi`/`midi-sysex` never actually granted anything
relevant, and the hang this section describes and the "Update Required"
gate below may be the same underlying block manifesting two different ways
(hang vs. explicit fallback screen) depending on timing. Not confirmed
either way — recorded so whoever investigates next doesn't have to
re-discover the connection.

## A real client must open `http://localhost:7878` for a connection to exist — confirmed live 2026-08-24

If nothing has ever opened `http://localhost:7878` (the control panel page)
when the biometric auth screen loads, the AATF page's own
`mykad-websocket-v2.js` connection attempt has nothing to connect to, and
the widget gets stuck showing a generic **"Scanning IC... Please insert IC
into the Dermalog Biometric Device if you haven't"** placeholder
indefinitely — `#mykad-control-container` never loses its `d-none` class.
No exception, no error, no obviously-relevant log line; this looks
identical to a plain hang. Confirmed by Faizuddin: opening the emulator's
control-panel page manually before the run immediately fixed it.

**The underlying `ws://localhost:7878/IDCard` server itself is always
running from somewhere outside this suite's control** — per Faizuddin,
2026-08-24, that's not something this suite needs to start, monitor, or
know about. The actual fix needed was in `insertCard()` itself (`utils/
mykadEmulator.ts`): its throwaway page was navigating to `about:blank` and
only ever reaching the server via a raw `new WebSocket(...)` eval — it never
actually opened `http://localhost:7878`. Fixed by navigating to
`http://localhost:7878` instead of `about:blank`; the rest of the raw
WebSocket-eval logic is unchanged.

**Ordering note — tried, then reverted, 2026-08-24**: `runMykadAuth()`
briefly called `insertCard()` immediately on entering the auth screen,
before waiting for `#mykad-control-container`, on the theory that waiting
for the container first was backwards. Faizuddin asked to revert this —
`runMykadAuth()` waits for `#mykad-control-container` to become visible
BEFORE calling `insertCard()`, same as originally written. The
`about:blank` → `http://localhost:7878` fix above was what actually
mattered, not the timing of the call.

**Correction, 2026-08-24, per Faizuddin**: the server itself is always
online from somewhere outside this suite's control — not something this
suite needs to start or know about. What was actually missing is simpler:
a real client has to open `http://localhost:7878` (the control panel page
itself) for a connection to exist at all. `MykadEmulatorClient.insertCard()`
was navigating its throwaway page to `about:blank` and only reaching the
server via a raw `new WebSocket(...)` eval — never actually opening the
control panel page. Fixed by navigating to `http://localhost:7878` instead
of `about:blank` in `mykadEmulator.ts`; the rest of the raw-WebSocket-eval
logic is unchanged.

## "Dermalog Biometric Device — Update Required" gate — confirmed live 2026-08-22

A SEPARATE issue from the permission prompt above, hit right after fixing
it: after clicking "Ya/Yes" on the PERINGATAN consent, the page shows its
`blockUI` "Working..." overlay and then, instead of the MyKad widget,
displays a full-page **"Update Required — Please update Dermalog Biometric
Device to the latest version or make sure it's installed correctly. If not,
use Firefox version 36 to create a transaction."** with a "Download
Installer" button. This happens BEFORE the script ever calls
`insertCard()` — confirmed from the failure timing (the widget never
appeared, so no wait-for-`#mykad-control-container` step even started) — so
it has nothing to do with the emulator connection, timing, or card data.
It's the AATF page's own device-readiness check failing, full stop.

**Two theories tried and ruled out — recorded so they aren't retried:**

1. **Browser binary** (Playwright's bundled Chromium vs. the real installed
   Chrome). Based on a fresh-Chrome-profile manual reproduction working.
   Built a whole real-Chrome + modefair.com-work-profile launch path for it
   (`utils/chromeProfile.ts`, overriding the `context`/`page` fixtures).
   **Did not fix it** — launching real Chrome on the real profile still
   showed the gate. That code was reverted 2026-08-22.
2. **`navigator.webdriver`** (Chromium sets this `true` on any CDP-automated
   session). Confirmed `true` during automation vs. `false` manually, which
   looked like a strong signal — added `--disable-blink-features=
   AutomationControlled` + `ignoreDefaultArgs: ['--enable-automation']` in
   `playwright.config.ts` to mask it. Confirmed `navigator.webdriver` was
   then `false` during automation too, **but the gate still appeared** —
   so this was a real, separate fix (kept, since it's still a valid
   automation-detection countermeasure worth having) but never the actual
   cause of THIS gate. Don't re-attribute this gate to it again.

**Actual root cause, confirmed live 2026-08-22 from the browser console**:
`net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS` on the WebSocket connection
attempt itself. Chrome's **Local Network Access (LNA)** feature blocks a
page loaded from a public origin (`https://staging.eauto.my`) from
connecting to `localhost`/private-network addresses unless the origin has
been granted permission for it — and the AATF page's own script
(`mykad-websocket-v2.js`) does exactly that, trying to open
`ws://localhost:7878/IDCard` from that public origin. The connection is
blocked before it ever reaches the emulator (or real hardware), so the page
falls back to "Update Required." This likely also explains the very first
"browser device permission prompt" theory (§ above) — LNA's user-facing
prompt is a plain Allow/Block bar, not a device chooser, so it may have
LOOKED like a camera/microphone-style prompt while actually being this same
permission the whole time; granting `camera`/`microphone`/`midi` never
touched it, since "local network access" isn't in that set.

**Why manual testing never hit this**: the permission persists per Chrome
profile/origin once granted (same as camera/mic) — a human either already
had it granted from a previous session, or saw the prompt once and clicked
Allow.

**Fix, applied AND CONFIRMED WORKING live 2026-08-22**:
`scripts/eauto-edereg-precheck/playwright.config.ts`'s `launchOptions.args`
now also includes `--disable-features=LocalNetworkAccessChecks,
PrivateNetworkAccessChecks,PrivateNetworkAccessSendPreflights,
PrivateNetworkAccessRespectPreflightResults,
BlockInsecurePrivateNetworkRequests` — disables LNA/PNA enforcement for the
test run. Multiple candidate feature names are listed together since Chrome
has renamed this feature across versions and an unrecognized name is a
silent no-op, not an error. This got the MyKad screen itself working — the
run then progressed to a separate, unrelated bug, see § "Blank second tab
stalls the flow after MyKad auth" below.

**For any future ticket/test suite hitting a similar legacy-portal device
gate that talks to `localhost` from a public-origin page**: check the
browser console for `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS` (or
similarly-named network errors) FIRST — it's a concrete, unambiguous signal,
unlike the browser-binary and `navigator.webdriver` theories above which
both looked plausible and both turned out to be dead ends for this specific
gate.

## Blank second tab stalls the flow after MyKad auth — confirmed live and fixed 2026-08-22

Once the gate above was fixed, MyKad auth itself started working — but the
flow then stalled: a second, blank browser tab appeared and stuck around,
and the script never advanced to step 2 (Vehicle details).

**Root cause**: `MykadEmulatorClient` (`utils/mykadEmulator.ts`) originally
opened ONE hidden `about:blank` page and kept it open for the whole
Deregistration flow, reusing it across all three `insertCard()` calls. In
headed mode (this suite always runs headed) an "hidden" Playwright page is
not actually hidden — it's a real, visible browser tab, just one the script
never drives directly. `PrecheckSession.active()` (`utils/session.ts`)
picks "the active page" by taking the LAST page in `context.pages()` — so
the instant `insertCard()` ran for the first time, that blank tab became
"active," and every later `waitForActivePage()` call in the suite handed
back the WRONG page (the blank emulator tab, not the real AATF tab) to code
trying to drive the real flow. That's the blank tab that stuck around and
the stall — the script was quietly trying to interact with a page with
nothing on it.

**Fix**: `MykadEmulatorClient.insertCard()` now opens its page, connects,
sends `INSERTCARD`, waits for the ack, and closes that page again — all
within the single call, never leaving one open past its own round trip. No
change to `session.ts`'s "last page = active page" heuristic was needed;
removing the lingering page was enough. `close()` is now a no-op kept only
so existing callers (the spec's `finally` block) don't need to change.

**For any future suite that opens a side/helper page in the SAME browser
context a "last open page = active page" heuristic also uses**: either
close that side page before returning control to the main flow, or make the
active-page heuristic explicitly aware of it. A silent stall with a
mysterious blank tab, right after the first time a side page gets opened,
is this bug's signature.

## Multi-session handling — resolved in practice, 2026-08-24

The AATF page's own JS has an explicit `hTotalActiveSession` handler that
force-closes the connection with *"Your session was closed because you
opened the authentication page in another tab"* if the emulator reports more
than one active session. The control-panel page connects to the exact same
`/IDCard` path the AATF page uses, which reads like it ought to trigger this
— but the demonstrated bypass flow (control panel connect → Insert Card →
switch to the AATF tab, which "continues like normal") clearly works in
practice, and the confirmed live end-to-end run (all three MyKad auth
points, each a fresh `insertCard()` connection separate from the AATF
page's own) proves this generalizes to automation too, not just the manual
one-human-two-tabs demonstration. Two theories were floated for *why* this
doesn't trip the multi-session guard — (1) session counting only starts
after a `registerSession()` handshake the control panel/`insertCard()`
never performs, or (2) the two connections are tracked separately somehow —
neither was confirmed, and it no longer matters for this suite's purposes
now that the behaviour itself is verified. Leaving the theories here only in
case a future multi-tab scenario needs the "why," not the "does it work."

## Also used for eSTM (UCD) — 2026-10-19

The UCD eSTM Buyer and Seller Authentication screens load the same widget, so
EAINT-12412_TS12 uses the emulator there instead of the zzz/<slot> URL bypass
— port in `scripts/eauto-jomcheck/utils/mykadEmulator.ts` (identity passed in,
no video manifest), Chrome flags in that suite's `estm-emulator` project. See
[flow-estm.md](flow-estm.md) § "The MyKad-emulator route". Not yet run live.

## From Charmain's repo (eauto-qa-charmain, read 2026-10-27)

Source: read-only clone at `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain`, commit 0ab45d1, 2026-10-13). Tags below are
`[charmain-repo: <path>:<line>]`. Her repo carries the emulator itself, so
several open points in this file now have an answer.

### 1. What the emulator is and where it comes from

1. Dev owns it. Source of truth is the eauto_v2 repo,
   `.claude/skills/mykad-reader-emulator/`; Charmain's copy is byte-identical,
   copied at eauto_v2 commit `1abaa1b`. Run:
   `node tools/mykad-reader-emulator/scripts/server.js` (port `MYKAD_PORT`,
   default 7878). The vendored `ws` module is committed, so no install step.
   `[charmain-repo: tools/README.md:5-30]`
2. **The "control panel" at `http://localhost:7878` is the same server's test
   page** (`assets/mykad-emulator-test.html`), served on `/`. Any other HTTP path
   is 404. `[charmain-repo: tools/mykad-reader-emulator/scripts/server.js:271-298]`
3. Terminal client: `scripts/mykad-cmd.sh <COMMAND> [JSON]` (wraps `client.js`;
   `MYKAD_WS_URL` overrides the socket).
   `[charmain-repo: tools/mykad-reader-emulator/scripts/mykad-cmd.sh:1-17; scripts/client.js:10]`

### 2. Protocol (full command list)

1. Device commands the page sends: `GETTOTALSESSION`, `INIT`, `READCARD`, `LIVESCAN`.
2. Card commands: `INSERTCARD:<json>`, `REMOVECARD`, `GETCARD`.
3. Config: `SETDEVICE:<json>`, `SETCONFIG:<json>` (`sendVersion`, `matchResult`),
   `GETDEVICE`, `GETCONFIG`, `RESETDEVICE`, `RESETCONFIG`, `RESETALL`, and the
   shorthand `SET_VERSION__x`, `SET_DEVICENUMBER__x`, `SET_CARDREADER__x`,
   `SET_SENDVERSION__true|false`, `SET_MATCHRESULT__<value>`.
4. Happy path: `GETTOTALSESSION` → `TotalActiveSession "1"`; `INIT` → `Version`,
   `Device Number`, `Smart Card Ready`; `READCARD` → waits silently until a card
   is inserted → `Scanner Start` → `Fingerprint` → `MYKAD_DATA` (stringified JSON,
   `DataTitle:"MYKAD"`) → `Template Quality` → `Matching Result`
   (`{Result, MatchedPosition, NRIC, Time_Stamp}`) → card ejected.
5. Card fields: `NRIC` (dashes included, as the real device sends), `GMPCName`,
   `OriginalName`, `KPTName` (this spelling), `OldIC`, `OtherID`, `Gender`, `DOB`,
   `POB`, `DateIssue`, `Citizenship`, `Race`, `Religion`, `Category`,
   `Address1-3`, `Postcode`, `City`, `State`, hand codes, PR / green-card fields,
   `Photo`. Missing fields fall back to built-in defaults (`MYKAD_NRIC`,
   `MYKAD_NAME`… env vars read at start).
6. `matchResult` values: `Identical` (default), `Not Identical`,
   `Image quality too low` — this is how negative thumbprint paths are reached.

`[charmain-repo: tools/mykad-reader-emulator/SKILL.md:46-202; scripts/server.js:520-600]`

### 3. Answers to questions this file left open

1. **Multi-session guard** (§ "Multi-session handling" above). The emulator
   answers `GETTOTALSESSION` with a hard-coded `"1"`, whatever the real
   connection count. That is why the AATF page's `hTotalActiveSession` guard never
   fires when a second client (the control panel, or our `insertCard()`) connects.
   `[charmain-repo: tools/mykad-reader-emulator/scripts/server.js:522-523]`
2. **`INIT` wipes the inserted card.** Every `INIT` resets the channel's card
   state. The page sends `INIT` when its socket opens, so a card inserted before
   that is lost and the later `READCARD` parks forever. Insert only once the page
   is reading: `#readMyKadButton` enabled and visible, or `#mykadReadingContainer`
   without `d-none`. This is the mechanism behind our "wait for
   `#mykad-control-container` BEFORE `insertCard()`" ordering.
   `[charmain-repo: src/pages/wizard.page.ts:230-267; tools/mykad-reader-emulator/scripts/server.js:526-530]`
3. **Channels.** The server keys card state by URL path: `/IDCard` = channel
   `default`, `/IDCard/ch0` = `ch0`. eAuto pages hard-code `/IDCard`, so every
   test must use the default channel, and reader specs must run with ONE worker.
   Found 2026-09-22, when per-worker channels left the page reading "No card is
   detected" forever.
   `[charmain-repo: src/fixtures/mykad.ts:200-218; tools/mykad-reader-emulator/scripts/server.js:88-92]`
4. **HMAC.** Every reply carries `HMAC = HMAC-SHA256(message, MYKAD_WS_SECRET_KEY)`.
   Charmain's notes say the eAuto backend validates it against a **per-company**
   secret in the `biometricsettings` table, plus a company allowlist kept by dev,
   a 30-minute timestamp window and a one-use rule per signature (`biometriclog`).
   A wrong key looks exactly like a broken reader: it connects, then every message
   is rejected. `[charmain-repo: tools/README.md:47-77; env/env-default:52-55]`
   `knowledge/flow-platform.md` still lists HMAC checking as `[unconfirmed]`;
   this is the lead to confirm with dev.
5. **`wsPublicKey`.** Newer reader builds require `?wsPublicKey=<DER SPKI P-256,
   hex>` on the socket URL. Without it they answer every command with
   `{"DataTitle":"Error","Message":"Public key empty."}` and keep the socket open,
   which reads as a hang. Charmain's fixture mints a key per run.
   `[charmain-repo: src/fixtures/mykad.ts:85-109]`

### 4. Charmain's fixture — a different client shape from ours

1. `src/fixtures/mykad.ts` talks to the emulator from the **Node test process**
   with the `ws` module (`ws://127.0.0.1:<port>/IDCard?wsPublicKey=…`), one short
   connection per command. It never opens a browser tab, so the "blank second
   tab" trap above cannot happen. `[charmain-repo: src/fixtures/mykad.ts:107-135]`
2. **Conflict:** this file says (§ "A real client must open
   `http://localhost:7878`", 2026-08-24) that the panel page has to be opened for
   a connection to exist. Charmain's fixture never opens that page and reports an
   end-to-end STMS run working on 2026-09-22. Both are recorded; not reconciled.
   Possible explanation `[unconfirmed]`: our failure was the emulator process not
   running, and opening the page only exposed that.
   `[charmain-repo: src/fixtures/mykad.ts:200-236]`
3. **Start or adopt.** The fixture probes with a `GETCARD` round trip (not a bare
   TCP check — the port accepts before the WebSocket upgrade works). If nothing
   answers within 1.5 s it spawns `server.js` and waits up to 15 s. Teardown kills
   the process only if it started it; a borrowed emulator gets `RESETCONFIG` only,
   so a forced "Not Identical" never leaks into the next spec.
   `[charmain-repo: src/fixtures/mykad.ts:137-169, 200-296]`
4. **`insertCardForCurrentUser(page)`.** The portal refuses any card but the
   signed-in user's: *"Please use login user, <NAME>'s MyKad."* The screen prints
   the expected number in the PERAKUAN text — `(No. Kad Pengenalan: 880101-01-1234)`
   — so the fixture reads it with
   `/No\.?\s*Kad\s*Pengenalan\s*[:：]?\s*([0-9]{6}-[0-9]{2}-[0-9]{4})/i` and inserts
   that. It stops with a message when no number is on screen.
   `[charmain-repo: src/fixtures/mykad.ts:59-68, 176-184, 251-262; tools/README.md:79-88]`
   Our rule is that identities are typed on the dashboard; reading the number off
   the page is an option for screens that print it, not a replacement.
5. **Success signal.** Wait for "Verification Passed" / "Verification Completed",
   never for "Scanning IC" to go away (it does not, on success). On the STMS
   wizard `#continueButton` stays `d-none` until verification passes, so its
   visibility is the pass signal, and a `Not Identical` run never shows it.
   `[charmain-repo: docs/runbooks/mykad-emulator.md:62-65; src/pages/wizard.page.ts:269-283]`
6. Some screens (STMS seller) show "Scan IC" and wait; others (STMS buyer)
   auto-read on Smart Card Ready and show "Scan IC" only after their own 10 s
   no-card timeout. Handle both: insert once reading; if Next does not appear,
   click Scan IC and insert again. `[charmain-repo: src/pages/wizard.page.ts:213-284]`

### 5. Screens that load the reader (measured against eAuto source by Charmain)

1. UCD: New e-SERAHAN (buyer + UCD auth, step 1, and the without-thumbprint
   variant); New STMS (seller + buyer auth behind PERAKUAN PENJUAL / PEMBELI);
   STMS wholesale leg; BMK purchase and consent; e-Invoice consent; wholesale
   handover reject; Settings › Add User Account; director Account Activation;
   eSTM permission grant, insurance user permission, UCD services.
2. Public: Account Activation and consent, including the AATF one.
3. AATF: New Deregistration and owner consent; Upload Certificate of
   Destruction; Settings › user add and edit.
4. BackOffice has no reader screen.
5. The eSerahan declaration screen starts the reader by itself — no "Read MyKad"
   button; the page sends `READCARD` on load and waits.

`[charmain-repo: docs/runbooks/mykad-emulator.md:16-43]`

### 6. "Update Required / use Firefox 36" gate — a second cause

**Conflict:** § "Dermalog Biometric Device — Update Required" above found the
cause to be Chrome's Local Network Access block, and records that real Chrome did
NOT fix it (2026-08-22, AATF deregistration). Charmain's runbook says the gate on
the **account-activation page** (`/public/activation/`) is a browser check that
bundled Chromium fails and real Chrome passes, so her config pins
`channel: "chrome"`. Her config ALSO carries the LNA flag
(`--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests`,
noted as "Chrome 138+"). Safe reading: use both — real Chrome AND the LNA flag.
`[charmain-repo: docs/runbooks/mykad-emulator.md:101; playwright.config.ts:73-92]`

Related trap: a fixture build that swaps the BO director IC forces a thumbprint
re-verification, so the next UCD login diverts to `/public/activation/` and hits
that gate, ending in a forced password reset. Whether every swap does this is
`[unconfirmed]` in her notes.
`[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12054.md:382-395]`

### 7. Troubleshooting table (Charmain's runbook)

| Symptom | Cause |
|---|---|
| Socket never connects, page console quiet | Chrome LNA block — launch flag |
| Connects, every message rejected | wrong `MYKAD_WS_SECRET_KEY` for that environment |
| Key right, step still fails | company not on the instance's emulator allowlist (dev keeps it) |
| `READCARD` never completes | no card inserted (waits by design) |
| Read OK, Next refuses | card is not the logged-in user's |
| "Update Required / Firefox 36" on activation | bundled Chromium; use real Chrome |

The first three look like a product defect. Check all three before raising one.
`[charmain-repo: docs/runbooks/mykad-emulator.md:89-105]`

### 8. Emulator versus URL bypass

1. Emulator = the default; proves page, protocol and card-data handling.
2. URL bypass (`zzz/<n>` segment, see [flow-estm.md](flow-estm.md)) = only where
   the emulator cannot run; proves nothing about the reader; never in a spec
   whose subject is the reader; the spec must say which it used. Her fixture
   never falls back to the bypass by itself.
3. Charmain's bypass helper inserts `BYPASS_U<n>` and the instance after the
   instance segment: `/<inst>/view/…` → `/<inst>/<BYPASS_U<n>>/<inst>/view/…`.
   Slot values come from env keys, never literals.
4. Neither proves the physical device. A release that changes the reader
   integration still needs one manual run on real hardware.

`[charmain-repo: src/auth/thumbprint-bypass.ts:1-25; docs/runbooks/mykad-emulator.md:106-119; tools/README.md:89-98; src/fixtures/mykad.ts:18-26]`
