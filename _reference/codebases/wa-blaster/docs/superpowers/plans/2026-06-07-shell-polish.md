# Shell Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Polish the app shell: a global toast system (variants/undo/countdown), a `?` keyboard-shortcuts help overlay, `g`-then-key navigation chords, and a "Remember me" login option.

**Architecture:** Frontend-only (`apps/web`). A `ToastProvider`/`useToast()` renders a portal stack; `showToast` accepts a variant string OR an opts object so the 6 existing call-sites migrate without touching their call signatures. A shared `lib/shortcuts.ts` chord map feeds both a `useGlobalNavShortcuts` hook and a `KeyboardShortcutsOverlay`. Remember-me is implemented client-side (a `sessionStorage` "alive" marker gates session auto-resume) — no backend change.

**Tech Stack:** Vite + React + TS, react-query v5, react-router v6.

**Spec:** `docs/superpowers/specs/2026-06-07-shell-polish-design.md`

---

## Conventions (read once)

- **GIT GUARD (every implementer):** you are on branch `feat/shell-polish` — do NOT run `git checkout`/`switch`/`branch`; only `git add` + `git commit`.
- Gate: `pnpm --filter web build` (tsc + vite) after each task. No frontend unit tests in this repo.
- Preserve `data-testid="toast-<variant>"` + `role="status"` on toasts (deferred e2e specs rely on them).
- `isTyping(target)` guard (defined in Task 3) must gate every global key handler so typing `?`/letters in inputs is unaffected.

---

## Task 1: Global toast provider + enhanced toast (additive)

**Files:**
- Create: `apps/web/src/components/toast/ToastProvider.tsx`
- Modify: `apps/web/src/main.tsx`, `apps/web/src/index.css`

- [ ] **Step 1: Create `apps/web/src/components/toast/ToastProvider.tsx`:**
```tsx
import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export interface ToastAction { label: string; onClick: () => void }
export interface ToastOpts { variant?: ToastVariant; action?: ToastAction; durationMs?: number }
interface ToastItem { id: string; message: string; variant: ToastVariant; action?: ToastAction; durationMs: number }

interface ToastCtx {
  // Accepts a bare variant string (back-compat with the old showToast(msg, 'error')) OR an opts object.
  showToast: (message: string, opts?: ToastVariant | ToastOpts) => string;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-500/30 bg-red-50 text-red-500',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
};
const BAR_STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, opts?: ToastVariant | ToastOpts) => {
    const o: ToastOpts = typeof opts === 'string' ? { variant: opts } : (opts ?? {});
    counter.current += 1;
    const id = `t${counter.current}`;
    const item: ToastItem = {
      id, message,
      variant: o.variant ?? 'success',
      action: o.action,
      durationMs: o.durationMs ?? 4000,
    };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => dismiss(id), item.durationMs);
    return id;
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ showToast, dismiss }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto relative w-72 overflow-hidden rounded-md border px-4 py-2.5 text-[13px] shadow-lg ${VARIANT_STYLES[t.variant]}`}
              role="status"
              data-testid={`toast-${t.variant}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex-1">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    className="shrink-0 font-semibold underline underline-offset-2"
                    onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                    data-testid="toast-action"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="dismiss"
                  className="shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => dismiss(t.id)}
                >
                  ×
                </button>
              </div>
              <span
                className={`absolute bottom-0 left-0 h-0.5 ${BAR_STYLES[t.variant]}`}
                style={{ animation: `toast-countdown ${t.durationMs}ms linear forwards` }}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
```

- [ ] **Step 2: Add the countdown keyframe** to `apps/web/src/index.css` (append near the other keyframes):
```css
@keyframes toast-countdown { from { width: 100%; } to { width: 0%; } }
```

- [ ] **Step 3: Mount the provider** in `apps/web/src/main.tsx` — wrap so any component can toast (inside `QueryClientProvider`, around `AuthProvider`+`App`):
```tsx
import { ToastProvider } from './components/toast/ToastProvider';
// ...
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
```

- [ ] **Step 4: Build** — `pnpm --filter web build` → success (additive; nothing migrated yet).

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/toast/ToastProvider.tsx apps/web/src/main.tsx apps/web/src/index.css
git commit -m "feat(web): global ToastProvider/useToast (variants, undo action, countdown bar)"
```

---

## Task 2: Migrate the 6 toast call-sites to `useToast()`

**Files:**
- Modify: `apps/web/src/pages/Settings.tsx`, `apps/web/src/pages/Templates.tsx`, `apps/web/src/pages/CampaignDetail.tsx`, `apps/web/src/pages/Knowledge.tsx`
- Delete: `apps/web/src/components/Toast.tsx`

> The new `showToast` accepts the OLD `(message, 'error')` shape, so existing call sites keep working — you mostly DELETE local state + render and re-source `showToast` from `useToast()`.

- [ ] **Step 1: Per file**, do this transformation (READ each file first):
  1. Remove `import Toast from '../components/Toast'` (and the `Toast` usage).
  2. Add `import { useToast } from '../components/toast/ToastProvider'`.
  3. Remove the local `const [toast, setToast] = useState<…>(null)` and the local `showToast` definition.
  4. Add `const { showToast } = useToast();` inside the component (each Settings sub-component — `SystemTab`, `TeamTab`, `CannedRepliesTab` — gets its own `useToast()` call).
  5. Remove the `<Toast message={…} variant={…} onDismiss={…} />` render.
  6. Leave every `showToast('…')` / `showToast('…', 'error')` CALL exactly as-is (the overloaded signature handles them).

- [ ] **Step 2: `Templates.tsx` `onToast` threading** — `Templates` passes `showToast` to `DetailDrawer`/`TemplatesAIWizard` via an `onToast` prop. After re-sourcing `showToast` from `useToast()`, pass it straight through: `onToast={showToast}`. The children call `onToast(msg)` / `onToast(msg, 'error')` — both satisfied by the overload. (Do NOT change the children's call signatures.)

- [ ] **Step 3: Delete the old component** — once no file imports `../components/Toast`, delete `apps/web/src/components/Toast.tsx`. Verify with a grep for `components/Toast'` (should be zero hits). NOTE: `pages/inbox/NeedsHumanMode.tsx` has its OWN inline toast that does NOT import `Toast.tsx` — leave it untouched.

- [ ] **Step 4: Build** — `pnpm --filter web build` → success. Grep `from '../components/Toast'` and `from '../../components/Toast'` → zero hits.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/pages/Settings.tsx apps/web/src/pages/Templates.tsx apps/web/src/pages/CampaignDetail.tsx apps/web/src/pages/Knowledge.tsx
git rm apps/web/src/components/Toast.tsx
git commit -m "refactor(web): migrate toast call-sites to global useToast(); remove old Toast"
```

---

## Task 3: Shared chord map + `useGlobalNavShortcuts`

**Files:**
- Create: `apps/web/src/lib/shortcuts.ts`, `apps/web/src/hooks/useGlobalNavShortcuts.ts`
- Modify: `apps/web/src/components/Layout.tsx`

- [ ] **Step 1: Create `apps/web/src/lib/shortcuts.ts`:**
```ts
export interface NavChord { keys: string; label: string; path: string; adminOnly?: boolean }

// Dealers uses `e` (pEoplE) since `d` = Dashboard. No collisions across the 8 nav items.
export const NAV_CHORDS: NavChord[] = [
  { keys: 'g d', label: 'Dashboard', path: '/' },
  { keys: 'g c', label: 'Campaigns', path: '/blasts' },
  { keys: 'g i', label: 'Inbox', path: '/inbox' },
  { keys: 'g e', label: 'Dealers', path: '/contacts' },
  { keys: 'g t', label: 'Templates', path: '/templates' },
  { keys: 'g r', label: 'Performance', path: '/reports' },
  { keys: 'g k', label: 'Knowledge', path: '/knowledge', adminOnly: true },
  { keys: 'g s', label: 'Settings', path: '/settings', adminOnly: true },
];

export const GLOBAL_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '⌘ K', label: 'Open command palette' },
  { keys: '?', label: 'Show keyboard shortcuts' },
];

export const INBOX_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'j / k', label: 'Next / previous conversation' },
  { keys: 'r', label: 'Reply' },
  { keys: 'e', label: 'Escalate / resolve' },
];

export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
```

- [ ] **Step 2: Create `apps/web/src/hooks/useGlobalNavShortcuts.ts`:**
```ts
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { NAV_CHORDS, isTyping } from '../lib/shortcuts';

/** Vim-style "g then key" navigation chords. Mount once at the shell level. */
export function useGlobalNavShortcuts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      const key = e.key.toLowerCase();
      if (!pendingRef.current) {
        if (key === 'g') {
          pendingRef.current = true;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => { pendingRef.current = false; }, 800);
        }
        return;
      }
      pendingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      const chord = NAV_CHORDS.find((c) => c.keys === `g ${key}`);
      if (chord && (!chord.adminOnly || user?.role === 'ADMIN')) {
        e.preventDefault();
        navigate(chord.path);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, user]);
}
```

- [ ] **Step 3: Mount in `Layout.tsx`** — add `import { useGlobalNavShortcuts } from '../hooks/useGlobalNavShortcuts';` and call `useGlobalNavShortcuts();` near the top of the `Layout` component body (Layout already renders inside the Router so `useNavigate` works).

- [ ] **Step 4: Build** — `pnpm --filter web build` → success. (Manual check deferred: `g i` → /inbox.)

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/lib/shortcuts.ts apps/web/src/hooks/useGlobalNavShortcuts.ts apps/web/src/components/Layout.tsx
git commit -m "feat(web): g-then-key global navigation shortcuts"
```

---

## Task 4: `Kbd` + Keyboard-shortcuts help overlay (`?`)

**Files:**
- Create: `apps/web/src/components/ui/Kbd.tsx`, `apps/web/src/components/KeyboardShortcutsOverlay.tsx`
- Modify: `apps/web/src/components/Layout.tsx`, `apps/web/src/components/TopBar.tsx`

- [ ] **Step 1: Create `apps/web/src/components/ui/Kbd.tsx`:**
```tsx
import { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-background-subtle px-1.5 py-0.5 font-mono text-[11px] text-foreground-muted">
      {children}
    </kbd>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/components/KeyboardShortcutsOverlay.tsx`** (mirrors the `CommandPalette` overlay shell):
```tsx
import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Kbd } from './ui/Kbd';
import { GLOBAL_SHORTCUTS, NAV_CHORDS, INBOX_SHORTCUTS } from '../lib/shortcuts';

function Keys({ keys }: { keys: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.split(' ').map((k, i) =>
        k === '/' ? <span key={i} className="text-foreground-subtle">/</span> : <Kbd key={i}>{k}</Kbd>,
      )}
    </span>
  );
}

export default function KeyboardShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const navChords = NAV_CHORDS.filter((c) => !c.adminOnly || user?.role === 'ADMIN');
  const sections: { title: string; rows: { keys: string; label: string }[] }[] = [
    { title: 'Global', rows: GLOBAL_SHORTCUTS },
    { title: 'Navigate', rows: navChords },
    { title: 'Inbox', rows: INBOX_SHORTCUTS },
  ];

  return (
    <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div
        className="w-[520px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        data-testid="shortcuts-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
          <button type="button" onClick={onClose} aria-label="close" className="text-foreground-muted hover:text-foreground">×</button>
        </div>
        <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{s.title}</div>
              <div className="space-y-1.5">
                {s.rows.map((r) => (
                  <div key={r.label} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-foreground">{r.label}</span>
                    <Keys keys={r.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire `?` + overlay in `Layout.tsx`:**
  - `import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';` and `import { isTyping } from '../lib/shortcuts';`
  - Add state: `const [helpOpen, setHelpOpen] = useState(false);`
  - In the existing keydown `useEffect` (the one handling `Cmd/Ctrl+K`), add a branch:
    ```ts
        if (e.key === '?' && !isTyping(e.target)) { e.preventDefault(); setHelpOpen(true); }
    ```
  - Pass an opener to TopBar: change `<TopBar onSearchOpen={...} .../>` to also pass `onHelpOpen={() => setHelpOpen(true)}`.
  - Render the overlay next to `<CommandPalette ... />`:
    ```tsx
    <KeyboardShortcutsOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    ```

- [ ] **Step 4: Add a help button in `TopBar.tsx`:**
  - Extend the props: `onHelpOpen: () => void` (add to the destructured props + the type).
  - Import `IcHelp` from `./ui/icons` (add to the existing icon import).
  - In the `topbar-actions` row, before the theme toggle `IconButton`, add:
    ```tsx
    <IconButton icon={<IcHelp size={16} />} title="Keyboard shortcuts" onClick={onHelpOpen} data-testid="help-button" />
    ```

- [ ] **Step 5: Build** — `pnpm --filter web build` → success. Fix any prop-type mismatches.

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/components/ui/Kbd.tsx apps/web/src/components/KeyboardShortcutsOverlay.tsx apps/web/src/components/Layout.tsx apps/web/src/components/TopBar.tsx
git commit -m "feat(web): ? keyboard-shortcuts help overlay + TopBar help button"
```

---

## Task 5: Remember me (client-side)

**Files:**
- Modify: `apps/web/src/auth/AuthContext.tsx`, `apps/web/src/pages/Login.tsx`

> No backend / `api/auth.ts` change. Remember-me gates whether a session auto-resumes on a fresh browser launch.

- [ ] **Step 1: `AuthContext.tsx` — extend the `login` signature** in the `AuthState` interface:
```ts
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
```

- [ ] **Step 2: `AuthContext.tsx` — login persistence** — update the `login` callback:
```ts
  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const { accessToken, user: loggedInUser } = await loginApi(email, password);
    localStorage.setItem('auth.remember', rememberMe ? 'persistent' : 'session');
    sessionStorage.setItem('auth.alive', '1');
    setAccessToken(accessToken);
    setUser(loggedInUser);
  }, []);
```

- [ ] **Step 3: `AuthContext.tsx` — mount session gate** — replace the body of the mount `useEffect` so it forgets a "session" login on a fresh browser session:
```ts
  useEffect(() => {
    let cancelled = false;
    const remember = localStorage.getItem('auth.remember');
    const sessionAlive = sessionStorage.getItem('auth.alive');
    // "Don't remember me" + brand-new browser session → forget instead of resuming.
    if (remember === 'session' && sessionAlive !== '1') {
      (async () => {
        try { await logoutOnServer(); } catch { /* ignore */ }
        finally { if (!cancelled) setIsInitializing(false); }
      })();
      return () => { cancelled = true; };
    }
    sessionStorage.setItem('auth.alive', '1');
    (async () => {
      try {
        const { accessToken, user: refreshedUser } = await refreshAccessToken();
        if (!cancelled) { setAccessToken(accessToken); setUser(refreshedUser); }
      } catch { /* No valid refresh cookie — user must log in. */ }
      finally { if (!cancelled) setIsInitializing(false); }
    })();
    return () => { cancelled = true; };
  }, []);
```

- [ ] **Step 4: `AuthContext.tsx` — logout clears the flag** — in the `logout` callback, add `localStorage.removeItem('auth.remember');` (alongside the existing `setAccessToken(null); setUser(null);`).

- [ ] **Step 5: `Login.tsx` — checkbox + pass through:**
  - Add state: `const [remember, setRemember] = useState(true);`
  - Change `doLogin` to forward it: `await login(loginEmail, loginPassword, remember);`
  - Add the checkbox in the form, in the row that currently holds only "Forgot password?" (change `justify-end` → `justify-between`), as the left element:
    ```tsx
    <label className="flex items-center gap-2 text-[13px] text-foreground-muted cursor-pointer">
      <input
        type="checkbox"
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
        data-testid="remember-me"
      />
      Remember me
    </label>
    ```
  (The demo-role buttons call `doLogin(...)`, which now forwards `remember` — fine; they'll respect the checkbox too.)

- [ ] **Step 6: Build** — `pnpm --filter web build` → success.

- [ ] **Step 7: Commit**
```bash
git add apps/web/src/auth/AuthContext.tsx apps/web/src/pages/Login.tsx
git commit -m "feat(web): 'Remember me' login option (client-side session-resumption gate)"
```

---

## Task 6: E2E spec (run deferred)

**Files:**
- Create: `e2e/tests/shell-polish.spec.ts`

> Run is DEFERRED (no Postgres/servers/browsers). Mirror `e2e/tests/blasts.spec.ts` `loginAsAdmin`. Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Inspect** `e2e/tests/blasts.spec.ts` (copy `loginAsAdmin` verbatim). Confirm the new testids: `remember-me` (Login), `shortcuts-overlay` + `help-button` (shell).

- [ ] **Step 2: Create `e2e/tests/shell-polish.spec.ts`** (adapt the login helper to the real one):
```ts
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Shell polish', () => {
  test('login has a Remember-me checkbox, checked by default', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('remember-me')).toBeChecked();
  });

  test('? opens the keyboard-shortcuts overlay; Escape closes it', async ({ page }) => {
    await loginAsAdmin(page);
    await page.keyboard.press('?');
    await expect(page.getByTestId('shortcuts-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('shortcuts-overlay')).toHaveCount(0);
  });

  test('g then i navigates to the inbox', async ({ page }) => {
    await loginAsAdmin(page);
    await page.keyboard.press('g');
    await page.keyboard.press('i');
    await expect(page).toHaveURL(/\/inbox$/);
  });
});
```
> If `page.keyboard.press('?')` proves unreliable (it requires Shift+/), fall back to clicking `help-button` for the overlay test. Keep the three focused tests; adapt `loginAsAdmin` to the real helper.

- [ ] **Step 3: Commit**
```bash
git add e2e/tests/shell-polish.spec.ts
git commit -m "test(e2e): shell polish — remember-me, ? help overlay, g-nav (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter web build` — compile (no api change this slice; `pnpm --filter api test` unaffected but run once to confirm still green).
- [ ] Live (deferred — needs servers): toasts stack with a countdown bar and an Undo action where wired; `?` opens the shortcuts overlay (Escape/backdrop close); `g i`/`g e`/`g t` navigate; on a fresh browser launch, an unchecked "Remember me" requires re-login; `pnpm --filter e2e test -- shell-polish`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 toasts → Tasks 1–2; §3.3 g-nav → Task 3; §3.4 `?` overlay → Task 4; §3.5 remember-me → Task 5; §5 e2e → Task 6. Deferred (NeedsHumanMode toast, server-side remember-me) untouched.
- **Type/consistency:** `showToast` overload `(message, ToastVariant | ToastOpts)` keeps all 6 migrated call-sites compiling unchanged; `onToast={showToast}` works because children call `(msg)`/`(msg, 'error')`. `isTyping` + `NAV_CHORDS` are the single source shared by the hook (Task 3) and overlay (Task 4). `login(email,password,rememberMe?)` signature consistent across `AuthState`, the callback, and `Login.tsx`.
- **Sequencing:** 1→2 (migration needs the provider); 3→4 (overlay consumes the chord map); 5 independent. Each ends green.
- **Risk:** the toast migration is the main regression surface; the overloaded signature minimizes call-site churn, and per-task review reads each migrated page. NeedsHumanMode deliberately excluded.
- **No backend change:** remember-me is client-side; the `api/auth.ts` `login` is untouched.
