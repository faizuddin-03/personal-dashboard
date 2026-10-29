# Shell Polish — Global Toasts + Keyboard Shortcuts (?, g-nav) + Remember Me — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft (autonomous slice — scope decided per the user's standing "continue without asking" delegation)
**Context:** Hackathon. eAuto dealer + AI console (`apps/web`). Slice **H** (final) of the remaining-work roadmap (after #16–21). Branch `feat/shell-polish`, based on `master`. **Frontend-only** (no API/DB/auth-backend change).

---

## 1. Purpose

Four shell-level polish items from the 2026-06-07 audit, all client-side:

1. **Toasts are primitive and duplicated.** `Toast.tsx` supports only `success`/`error`, no action button, no visible auto-dismiss countdown, one-at-a-time. Six call-sites (`Settings` ×3 sub-tabs, `Templates`, `CampaignDetail`, `Knowledge`) each re-implement the same local `toast` state. There's no global trigger, so a mutation can't raise a toast without prop-drilling a callback.
2. **No keyboard-shortcuts help.** `Cmd/Ctrl+K` (command palette) and inbox `j/k/r/e` exist but are undiscoverable. There's no `?` cheat-sheet.
3. **No quick navigation.** Power users expect `g`-then-letter chords (g d → Dashboard, g i → Inbox, …). Only `Cmd+K` exists.
4. **No "Remember me."** Login has no remember-me; the session always auto-resumes from the refresh cookie regardless of intent.

### Decisions (autonomous)

- **Global toast system.** Add a `ToastProvider` + `useToast()` hook rendering a portal **stack** (bottom-right), with variants `success|error|info|warning`, an optional `action` (e.g. Undo), and a visible auto-dismiss **countdown bar**. Migrate the six standard call-sites. Preserve the existing `data-testid="toast-<variant>"` + `role="status"` (deferred e2e specs from earlier slices rely on these). **Out of scope:** `NeedsHumanMode`'s bespoke inbox toast (a different visual idiom) — left as a documented follow-up.
- **`?` help overlay.** A read-only cheat-sheet overlay (reusing the `CommandPalette` overlay idiom + a new `Kbd` primitive) listing global + inbox shortcuts. Opened by `?` (Shift+/) and a TopBar help button; closed by Escape/backdrop.
- **`g`-then-key nav.** A `useGlobalNavShortcuts` hook (chord state + ~800ms timeout, input-guarded, role-aware) driven by a single shared chord map derived from `NAV`. The same map feeds the help overlay (one source of truth).
- **Remember me — client-side.** The refresh cookie is HTTP-only and server-controlled (always 14d); the only client-controllable behavior is *whether to auto-resume a session on a fresh browser launch*. So: a Login checkbox writes `localStorage('auth.remember') = 'persistent' | 'session'`; `AuthProvider` on mount, if `'session'` AND this is a brand-new browser session (no `sessionStorage('auth.alive')` marker), clears the session instead of resuming. Honest, self-contained, no backend change.

---

## 2. Scope

### In scope
1. `components/ui/Toast` overhaul → `ToastProvider` + `useToast()` + a `ToastViewport` stack (portal), variants/action/countdown; mounted in the provider tree.
2. Migrate the 6 standard toast call-sites to `useToast()`; remove the old per-page state; delete the now-unused old `Toast.tsx`.
3. `lib/shortcuts.ts` (shared chord map from `NAV`) + `useGlobalNavShortcuts` hook wired in `Layout`.
4. `Kbd` primitive + `KeyboardShortcutsOverlay` (consumes the chord map) + `?` key + TopBar help `IconButton`.
5. Remember-me: Login checkbox + `AuthContext` session-resumption gate + `login(email,password,rememberMe)` signature.
6. Deferred Playwright spec (`shell-polish.spec.ts`).

### Out of scope (deferred)
- `NeedsHumanMode`'s bespoke inbox toast migration.
- Server-side cookie-duration remember-me (would need the flag in the refresh-token payload + auth.service/controller/tests changes).
- Toast pause-on-hover, swipe-to-dismiss, and per-toast positioning.
- A full command-palette overhaul.

---

## 3. Architecture

### 3.1 Global toasts (`components/toast/`)
- **`ToastProvider`** (`components/toast/ToastProvider.tsx`): holds `toasts: ToastItem[]`. Exposes via context: `showToast(message: string, opts?: { variant?; action?; durationMs? }): string` (returns id) and `dismiss(id: string)`. Auto-dismiss each item after `durationMs` (default 4000). Renders a `ToastViewport` via `createPortal(document.body)`.
  ```ts
  type ToastVariant = 'success' | 'error' | 'info' | 'warning';
  interface ToastAction { label: string; onClick: () => void }
  interface ToastItem { id: string; message: string; variant: ToastVariant; action?: ToastAction; durationMs: number }
  ```
  Backward-compatible call shape: `showToast('Saved')` and `showToast('Failed', { variant: 'error' })` both work, mirroring today's `showToast(msg, variant?)` — but the variant moves into `opts`. (Migration updates call-sites accordingly; see §3.2.)
- **`useToast()`**: `const { showToast, dismiss } = useToast();` — throws if used outside the provider.
- **`ToastViewport` + `ToastRow`**: fixed bottom-right stack (`flex-col-reverse gap-2`), each row keeps `role="status"` and `data-testid={`toast-${variant}`}`, shows the message, an optional `action` button (calls `action.onClick()` then dismisses), a close `×`, and a bottom **countdown bar** (a `<div>` whose width animates from 100%→0 over `durationMs` via a CSS transition/keyframe). Variant styles extend the current success/error palette with info (blue) + warning (amber).
- **Mount:** wrap `<App/>` (or inside it, above the router content) in `main.tsx` — between `QueryClientProvider` and `AuthProvider` so any component (incl. auth flows) can toast. `ids` generated with a module counter (avoid `Math.random`/`Date.now` per repo norms is N/A in app code, but a simple incrementing ref is cleanest).

### 3.2 Toast migration (6 call-sites)
For each of `Settings` (SystemTab, TeamTab, CannedRepliesTab), `Templates`, `CampaignDetail`, `Knowledge`:
- Remove the local `const [toast,setToast]=…` + `showToast` + `<Toast .../>` render.
- `const { showToast } = useToast();` and change calls from `showToast(msg, 'error')` → `showToast(msg, { variant: 'error' })` (success stays `showToast(msg)`).
- `Templates` passes `showToast` to `DetailDrawer`/`TemplatesAIWizard` via the existing `onToast` prop — keep the prop, just source it from `useToast()`. (Or have those children call `useToast()` directly; pick the smaller diff — children calling `useToast()` removes the prop, but keep `onToast` if it's threaded deep.)
- Delete `apps/web/src/components/Toast.tsx` once no import remains. `NeedsHumanMode` is untouched (its toast doesn't import `Toast.tsx`).

### 3.3 Shortcut map + g-nav
- **`lib/shortcuts.ts`**: derive an ordered chord list from `NAV` (in `lib/roles.ts`):
  ```ts
  // chord letter → nav item; explicit to avoid collisions (Dashboard d, Campaigns c, Inbox i, Dealers e (pEoplE)…)
  export const NAV_CHORDS: { keys: string; label: string; path: string; adminOnly?: boolean }[] = [
    { keys: 'g d', label: 'Dashboard', path: '/' },
    { keys: 'g c', label: 'Campaigns', path: '/blasts' },
    { keys: 'g i', label: 'Inbox', path: '/inbox' },
    { keys: 'g e', label: 'Dealers', path: '/contacts' },
    { keys: 'g t', label: 'Templates', path: '/templates' },
    { keys: 'g r', label: 'Performance', path: '/reports' },
    { keys: 'g k', label: 'Knowledge', path: '/knowledge', adminOnly: true },
    { keys: 'g s', label: 'Settings', path: '/settings', adminOnly: true },
  ];
  export const GLOBAL_SHORTCUTS = [
    { keys: '⌘ K / Ctrl K', label: 'Open command palette' },
    { keys: '?', label: 'Show this shortcuts help' },
  ];
  export const INBOX_SHORTCUTS = [
    { keys: 'j / k', label: 'Next / previous conversation' },
    { keys: 'r', label: 'Reply' },
    { keys: 'e', label: 'Escalate / resolve' },
  ];
  ```
  (Dealers uses `e` since `d`=Dashboard; documented in the overlay.)
- **`hooks/useGlobalNavShortcuts.ts`**: a `window.keydown` listener. Guard: ignore when `isTyping(e.target)` (input/textarea/select/contenteditable) or when a modifier (meta/ctrl/alt) is held. On `g`, set `pending=true` + a `setTimeout(()=>pending=false, 800)`. On the next key while `pending`, find the chord (skip `adminOnly` chords for non-ADMIN), `navigate(path)`, clear pending. Mount once in `Layout` (it already has `useNavigate` available via a small addition / pass `navigate`+`role`). Uses `useRef` for `pending` to avoid re-render churn.

### 3.4 `?` help overlay
- **`components/ui/Kbd.tsx`**: `<kbd>` styled key cap (`font-mono text-[11px] rounded border border-border bg-background-subtle px-1.5 py-0.5`).
- **`components/KeyboardShortcutsOverlay.tsx`**: `{ open, onClose }`. Reuse the `CommandPalette` overlay shell (backdrop `fixed inset-0 bg-black/30 z-[100]`, centered card `max-w-lg`, Escape + backdrop close, `role="dialog" aria-modal="true"`, `aria-label="Keyboard shortcuts"`, `data-testid="shortcuts-overlay"`). Render three sections (Global / Navigate / Inbox) from `GLOBAL_SHORTCUTS` + `NAV_CHORDS` (filtered by role) + `INBOX_SHORTCUTS`, each row = label + `<Kbd>` chips.
- **Wiring in `Layout`:** add `helpOpen` state; in the existing keydown `useEffect`, add `if (e.key === '?' && !isTyping(e.target)) { e.preventDefault(); setHelpOpen(true); }`. Render `<KeyboardShortcutsOverlay open={helpOpen} onClose={()=>setHelpOpen(false)} />` beside `<CommandPalette>`. Add an `IcHelp` `IconButton` (title "Keyboard shortcuts") in `TopBar`'s action row that opens it (pass an `onHelpOpen` prop from Layout, mirroring `onSearchOpen`).

### 3.5 Remember me (client-side)
- **`Login.tsx`:** a "Remember me" checkbox (`data-testid="remember-me"`, default **checked**) between the password field and the submit/forgot row. Pass its value to `login(email, password, rememberMe)`. The demo-role buttons call `login(…, true)`.
- **`AuthContext.tsx`:**
  - `login(email, password, rememberMe = true)`: after a successful `loginApi`, `localStorage.setItem('auth.remember', rememberMe ? 'persistent' : 'session')` and `sessionStorage.setItem('auth.alive', '1')`.
  - Mount effect (before the refresh attempt): if `localStorage.getItem('auth.remember') === 'session'` AND `sessionStorage.getItem('auth.alive') !== '1'` → a fresh browser session after a close → `await logoutOnServer().catch(()=>{})`, `setIsInitializing(false)`, and DO NOT resume. Otherwise `sessionStorage.setItem('auth.alive','1')` and proceed with the existing refresh-on-mount. (Absent/`'persistent'` flag → always resume — backward compatible for existing users.)
  - `logout()`: also `localStorage.removeItem('auth.remember')`.
  - Update the `AuthState.login` type to `(email, password, rememberMe?: boolean) => Promise<void>`.
- `api/auth.ts` `login()` is unchanged (no backend call change) — the rememberMe only affects client persistence.

## 4. Error / empty / loading
- **Toasts:** id collisions avoided via an incrementing counter; dismiss is idempotent; an action toast that's dismissed before click just disappears (no error). Max visible stack is naturally bounded by usage (no hard cap this slice; note if it grows).
- **Shortcuts:** all keydown handling no-ops while typing in a field or when a modifier is held (so `?` in a search box types `?`, and `Cmd+K` still works). g-chord pending resets after 800ms or on a non-matching key.
- **Remember me:** if `logoutOnServer()` fails on a fresh "session" launch, swallow and still require login (set no user). Existing sessions (no flag) are unaffected.

## 5. Testing strategy
- **Web:** `pnpm --filter web build` (typecheck) after each task — the toast-provider migration must keep every call-site compiling.
- **No frontend unit tests** (repo convention) — correctness via build + holistic review + deferred e2e.
- **E2E** (`e2e/tests/shell-polish.spec.ts`, Playwright, **run deferred**): after `loginAsAdmin`, pressing `?` opens `shortcuts-overlay`; Escape closes it; a `g` then `i` chord navigates to `/inbox`; on `/login`, the `remember-me` checkbox exists and is checked by default. Mirror `e2e/tests/blasts.spec.ts` `loginAsAdmin`.

## 6. File-by-file change list
**Web (new):** `components/toast/ToastProvider.tsx` (+ `useToast`, viewport), `lib/shortcuts.ts`, `hooks/useGlobalNavShortcuts.ts`, `components/ui/Kbd.tsx`, `components/KeyboardShortcutsOverlay.tsx`.
**Web (edit):** `main.tsx` (mount provider), `components/Layout.tsx` (`?` + help overlay + g-nav hook + help button prop), `components/TopBar.tsx` (help IconButton), `pages/Settings.tsx`, `pages/Templates.tsx`, `pages/CampaignDetail.tsx`, `pages/Knowledge.tsx` (migrate to `useToast`), `pages/Login.tsx` (remember-me), `auth/AuthContext.tsx` (rememberMe + session gate).
**Web (delete):** `components/Toast.tsx` (after migration).
**E2E (new):** `e2e/tests/shell-polish.spec.ts`.

## 7. Sequencing (for the plan)
1. **Toast provider + enhanced component** (additive; old `Toast.tsx` still present). Build green.
2. **Migrate 6 call-sites** to `useToast()`; delete old `Toast.tsx`. Build green.
3. **Shared chord map + `useGlobalNavShortcuts`** wired in `Layout`. Build green.
4. **`Kbd` + `KeyboardShortcutsOverlay` + `?` key + TopBar help button.** Build green.
5. **Remember me** (Login + AuthContext). Build green.
6. **E2E spec** (deferred run).

Tasks 1→2 ordered (migration needs the provider). 3 before 4 (overlay consumes the chord map). 5 independent. Each ends with `pnpm --filter web build`.

## 8. Open questions / risks
1. **Toast migration regression risk:** with only `build` as the gate (no component tests), a migrated page could compile yet not show a toast. Mitigation: per-task review reads each migrated call-site to confirm message/variant + trigger preserved; the deferred e2e + holistic review backstop. NeedsHumanMode is deliberately excluded to bound blast radius.
2. **Chord letter choices:** Dealers = `g e` (since `d`=Dashboard); a minor learning cost, surfaced in the overlay. No collisions across the 8 nav items.
3. **Remember-me is client-side only:** it cannot shorten the server's 14-day refresh cookie; it gates *auto-resume on fresh browser launch*. Honest semantics ("stay signed in after closing the browser"); a future server-side version (flag in refresh payload) would make the cookie itself session-scoped. Documented in the PR.
4. **`?` vs typing:** the `isTyping` guard must cover inputs/textarea/contenteditable so `?` and nav letters remain typeable in fields and the search box.
