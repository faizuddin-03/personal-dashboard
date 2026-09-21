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
