# Frontend Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin `apps/web` to the design in `docs/design/` (sidebar shell, WhatsApp-green palette, light/dark) without changing any behavior, route, API call, React Query key, or E2E-observable contract.

**Architecture:** Keep Tailwind. Carry the design's tokens as CSS variables (`:root` + `html[data-theme="dark"]`) and expose them through `tailwind.config.js` as semantic color names (shadcn-style), so pages are authored in normal Tailwind utilities and dark mode is a single `data-theme` flip with no `dark:` duplication. The intricate shell chrome (sidebar, topbar, command palette) is ported as `@layer components` classes copied/adapted from `docs/design/styles.css`; everything else uses utilities + small typed primitive components.

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind v3.4, React Router 6, TanStack Query 5, `@fontsource` (Inter + JetBrains Mono). Tests: Playwright (`e2e/`).

---

## Reading list (read before starting)

- Spec: `docs/superpowers/specs/2026-05-27-frontend-reskin-design.md` — the contract.
- Design source (reference for every screen): `docs/design/styles.css`, `docs/design/ui.jsx`, `docs/design/shell.jsx`, `docs/design/icons.jsx`, and the per-screen files in `docs/design/screens/*.jsx` (e.g. `overview.jsx`, `contacts.jsx`, `campaigns.jsx`, `settings.jsx`, `templates.jsx`, `segments.jsx`, `import-wizard.jsx`).

## The contract — never break these

These are enforced by `e2e/tests/*.spec.ts`. Any task that touches a page must preserve them.

- **All `data-testid`s** (static + dynamic). Per-page lists appear in each task below.
- **Nav links** for the six existing routes must be real `<Link>`s (role=link) with accessible name **exactly** `Dashboard`, `Contacts`, `Segments`, `Templates`, `Blasts`, `Settings`. No numeric badge inside these links (or mark badges `aria-hidden`) so the accessible name is unchanged.
- **`Settings` link renders only for ADMIN** (operator must have 0 Settings links). The three admin placeholder links (`/knowledge`, `/users`, `/audit`) follow the same rule.
- **`current-user`** (user email text) and **`logout`** (button) must be **directly visible and clickable in the topbar** — NOT hidden behind a click-to-open dropdown (the tests click `logout` without opening any menu, and assert `current-user` text).
- **Headings:** Dashboard renders `data-testid="dashboard-title"` with text `Dashboard`; Blasts renders an `<h1>` (role heading) with text `Blasts`.
- **In-row affordances:** contact rows keep an `Edit` `<Link>`; segment rows keep a `Delete` `<button>`, a `${n} matching contact(s)` text, and a `data-testid="segment-row-${id}"`.
- **No changes** to `src/api/*`, `src/auth/*`, React Query keys, route paths, or component handler logic. This is presentation-only.

### The single sanctioned test change (Task 18)

`e2e/tests/contacts.spec.ts:62` and `e2e/tests/templates.spec.ts:54` assert `toHaveClass(/bg-indigo-600/)` on a filter chip. The green re-skin removes that class. The chips gain `aria-pressed={selected}` (Task 9 / Task 14) and these two assertions change to `toHaveAttribute('aria-pressed', 'true')`. This is the only edit to the test suite.

## Verification harness (one-time, needed for E2E gates)

From repo root, in separate terminals:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed                       # seeds admin@example.com / ChangeMe123!
pnpm --filter api dev              # API on :3000
pnpm --filter api dev:worker       # blast worker
pnpm --filter web dev              # web on :5173
pnpm --filter e2e install-browsers # one-time
```

Then run E2E (all, or one spec):

```bash
pnpm --filter e2e test
pnpm --filter e2e exec playwright test tests/login.spec.ts
```

**Type/compile gate** (fast, used after most tasks):

```bash
pnpm --filter web exec tsc --noEmit
```

**Full build gate** (phase boundaries):

```bash
pnpm --filter web build
```

## File structure

```
apps/web/
  tailwind.config.js          (MODIFY — tokens, darkMode)
  package.json                (MODIFY — @fontsource deps)
  src/
    index.css                 (MODIFY — token vars + @layer component shell classes + font imports)
    theme/useTheme.ts         (CREATE — light/dark hook)
    components/
      ui/
        icons.tsx             (CREATE — typed icon set ported from design/icons.jsx)
        Button.tsx            (CREATE — Button + IconButton)
        Pill.tsx              (CREATE — Pill + StatusPill)
        Card.tsx              (CREATE — Card, PageHead, Page, Empty, Skeleton)
        Misc.tsx              (CREATE — Avatar, Tabs, Switch, Checkbox, Stat, Progress)
        index.ts              (CREATE — barrel export)
      Sidebar.tsx             (CREATE)
      TopBar.tsx              (CREATE)
      CommandPalette.tsx      (CREATE)
      ComingSoon.tsx          (CREATE)
      Layout.tsx              (MODIFY — compose shell)
      FilterBuilder.tsx       (MODIFY — restyle + aria-pressed)
      Pagination.tsx          (MODIFY — restyle)
      Modal.tsx               (MODIFY — restyle)
      Toast.tsx               (MODIFY — restyle)
      TemplateStatusBadge.tsx (MODIFY — delegate to StatusPill)
      BlastStatusBadge.tsx    (MODIFY — delegate to StatusPill)
    pages/*.tsx               (MODIFY — re-skin each, logic untouched)
    App.tsx                   (MODIFY — add placeholder routes)
e2e/tests/
  contacts.spec.ts            (MODIFY — Task 18)
  templates.spec.ts           (MODIFY — Task 18)
```

---

## Phase 0 — Tokens & Tailwind config

### Task 1: Add fonts + design-token CSS

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/index.css`

- [ ] **Step 1: Add font deps**

In `apps/web/package.json` `dependencies`, add:

```json
"@fontsource-variable/inter": "^5.0.0",
"@fontsource/jetbrains-mono": "^5.0.0",
```

Run: `pnpm install`

- [ ] **Step 2: Replace `apps/web/src/index.css`**

Copy the `:root` and `html[data-theme="dark"]` blocks **verbatim** from `docs/design/styles.css` (lines ~4–119), then add font imports and a shell `@layer components` block. The file becomes:

```css
@import '@fontsource-variable/inter';
@import '@fontsource/jetbrains-mono';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===== Design tokens (copied from docs/design/styles.css) ===== */
:root {
  /* PASTE the entire :root { ... } block from docs/design/styles.css here
     (green ramp, grays, red/amber/blue, semantic --bg/--text/--accent/...,
     radii, --page-pad, fonts, --shadow-focus, --sidebar-w, --topbar-h). */
}
html[data-theme="dark"] {
  /* PASTE the entire html[data-theme="dark"] { ... } block here. */
}

html, body, #root { height: 100%; }
body {
  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

/* ===== Shell chrome (ported from docs/design/styles.css) =====
   Paste these rule groups from docs/design/styles.css, unchanged, INSIDE
   @layer components so utilities can still override:
     .app / .app[data-sidebar=...] / grid areas
     .sidebar* / .nav-item* / .sidebar-foot*  (+ the two @media collapse blocks)
     .topbar / .crumbs / .search / .topbar-actions / .kbd
     .avatar / .avatar.sm/.md/.lg
     .page  (scroll container: height:100%; overflow:auto; background:var(--bg-sunken))
   Do NOT paste .page-inner — the <Page> primitive (Task 6) replaces it (max-width + padding).
   Wrap them like: @layer components { ...pasted rules... } */
@layer components {
  /* pasted shell rules */
}
```

Note: the `--font` var already lists Inter first; `@fontsource-variable/inter` provides it. Mono via `--mono`.

- [ ] **Step 3: Verify build**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: PASS (CSS isn't typechecked; this confirms nothing else broke).
Run: `pnpm --filter web build`
Expected: PASS, no CSS import errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/src/index.css
git commit -m "feat(web): add design tokens, fonts, and shell CSS layer"
```

### Task 2: Map tokens into Tailwind config

**Files:**
- Modify: `apps/web/tailwind.config.js`

- [ ] **Step 1: Replace the config**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        'background-subtle': 'var(--bg-subtle)',
        'background-sunken': 'var(--bg-sunken)',
        'background-hover': 'var(--bg-hover)',
        'background-selected': 'var(--bg-selected)',
        foreground: 'var(--text)',
        'foreground-muted': 'var(--text-muted)',
        'foreground-subtle': 'var(--text-subtle)',
        heading: 'var(--text-heading)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        accent: { DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)' },
        green: {
          50: 'var(--green-50)', 100: 'var(--green-100)', 200: 'var(--green-200)',
          500: 'var(--green-500)', 600: 'var(--green-600)', 700: 'var(--green-700)', 800: 'var(--green-800)',
        },
        red: { 50: 'var(--red-50)', 500: 'var(--red-500)' },
        amber: { 50: 'var(--amber-50)', 500: 'var(--amber-500)' },
        blue: { 50: 'var(--blue-50)', 500: 'var(--blue-500)' },
      },
      borderRadius: { sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      fontFamily: { sans: 'var(--font)', mono: 'var(--mono)' },
      ringColor: { accent: 'rgba(37,211,102,0.30)' },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter web build`
Expected: PASS. (Existing pages still use old utility classes like `bg-indigo-600`; those keep working — we re-skin them later.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/tailwind.config.js
git commit -m "feat(web): expose design tokens as Tailwind colors + darkMode selector"
```

**Phase 0 gate:** `pnpm --filter e2e test` → all specs still pass (no markup changed yet).

---

## Phase 1 — UI primitives

> Author all primitives with token-based utilities (`bg-accent`, `text-foreground-muted`, `border-border`, `text-green-800`, etc.). Keep components small and typed. After each task: `pnpm --filter web exec tsc --noEmit`.

### Task 3: Icon set

**Files:**
- Create: `apps/web/src/components/ui/icons.tsx`

- [ ] **Step 1: Create the typed icon wrapper + port icons**

Define one wrapper, then port each named icon's `<path>`/`<svg>` body **from `docs/design/icons.jsx`** (copy the inner SVG markup verbatim into each component).

```tsx
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svg(children: React.ReactNode) {
  return function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
           strokeLinejoin="round" {...props}>
        {children}
      </svg>
    );
  };
}

// Port the BODY of each of these from docs/design/icons.jsx (same names, drop the "Ic" components' inner svg children into svg(...)):
export const IcMessage  = svg(<>{/* paste from icons.jsx IcMessage */}</>);
export const IcUsers    = svg(<>{/* IcUsers */}</>);
export const IcFilter   = svg(<>{/* IcFilter */}</>);
export const IcFile     = svg(<>{/* IcFile */}</>);
export const IcSend     = svg(<>{/* IcSend */}</>);
export const IcBar      = svg(<>{/* IcBar */}</>);
export const IcBook     = svg(<>{/* IcBook */}</>);
export const IcSettings = svg(<>{/* IcSettings */}</>);
export const IcShield   = svg(<>{/* IcShield */}</>);
export const IcList     = svg(<>{/* IcList */}</>);
export const IcZap      = svg(<>{/* IcZap */}</>);
export const IcPhone    = svg(<>{/* IcPhone */}</>);
export const IcActivity = svg(<>{/* IcActivity */}</>);
export const IcHome     = svg(<>{/* IcHome */}</>);
export const IcSearch   = svg(<>{/* IcSearch */}</>);
export const IcChevR    = svg(<>{/* IcChevR */}</>);
export const IcChevD    = svg(<>{/* IcChevD */}</>);
export const IcChevsLR  = svg(<>{/* IcChevsLR */}</>);
export const IcChevsRL  = svg(<>{/* IcChevsRL */}</>);
export const IcSun      = svg(<>{/* IcSun */}</>);
export const IcMoon     = svg(<>{/* IcMoon */}</>);
export const IcLogout   = svg(<>{/* IcLogout */}</>);
export const IcPlus     = svg(<>{/* IcPlus */}</>);
export const IcUpload   = svg(<>{/* IcUpload */}</>);
export const IcCheck    = svg(<>{/* IcCheck */}</>);
export const IcX        = svg(<>{/* IcX */}</>);
export const IcAlert    = svg(<>{/* IcAlert */}</>);
export const IcLock     = svg(<>{/* IcLock */}</>);
```

If a design icon uses `fill` rather than `stroke`, copy its attributes as-is into that icon's body (override on the element).

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git add apps/web/src/components/ui/icons.tsx && git commit -m "feat(web): typed icon set ported from design"`

### Task 4: Button + IconButton

**Files:**
- Create: `apps/web/src/components/ui/Button.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap rounded-md ' +
  'border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-hover',
  secondary: 'bg-background text-foreground border-border-strong hover:bg-background-hover',
  ghost: 'bg-transparent text-foreground-muted border-transparent hover:bg-background-hover hover:text-foreground',
  destructive: 'bg-red-500 text-white border-red-500 hover:brightness-110',
};
const sizes: Record<Size, string> = {
  sm: 'h-[26px] px-2.5 text-xs',
  md: 'h-8 px-3 text-[13px]',
  lg: 'h-9 px-3.5 text-[13px]',
};

export function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon}{children}
    </button>
  );
}

export function IconButton({
  icon, title, size = 'md', className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; title: string; size?: Size }) {
  const dim = size === 'sm' ? 'h-[26px] w-[26px]' : 'h-8 w-8';
  return (
    <button title={title} aria-label={title}
      className={`${base} ${variants.ghost} ${dim} p-0 ${className}`} {...rest}>
      {icon}
    </button>
  );
}
```

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): Button + IconButton primitives"`

### Task 5: Pill + StatusPill

**Files:**
- Create: `apps/web/src/components/ui/Pill.tsx`

- [ ] **Step 1: Implement** (StatusPill maps the union statuses used by templates + blasts)

```tsx
import type { ReactNode } from 'react';

export type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue';

const tones: Record<Tone, string> = {
  gray: 'bg-transparent text-foreground border-border-strong',
  green: 'bg-green-100 text-green-800 border-green-200',
  amber: 'bg-amber-50 text-amber-500 border-amber-500/30',
  red: 'bg-red-50 text-red-500 border-red-500/30',
  blue: 'bg-blue-50 text-blue-500 border-blue-500/30',
};

export function Pill({ tone = 'gray', dot, icon, children, ...rest }:
  { tone?: Tone; dot?: boolean; icon?: ReactNode; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`} {...rest}>
      {dot && <i className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {icon}{children}
    </span>
  );
}

// status -> tone (covers TemplateStatus + BlastStatus)
const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'gray', PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', DISABLED: 'gray',
  SCHEDULED: 'blue', RUNNING: 'amber', COMPLETED: 'green', CANCELED: 'gray', FAILED: 'red',
};

export function StatusPill({ status, testId }: { status: string; testId?: string }) {
  return <Pill tone={STATUS_TONE[status] ?? 'gray'} dot data-testid={testId}>{status}</Pill>;
}
```

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): Pill + StatusPill primitives"`

### Task 6: Card / Page / PageHead / Empty / Skeleton

**Files:**
- Create: `apps/web/src/components/ui/Card.tsx`

- [ ] **Step 1: Implement**

```tsx
import type { ReactNode } from 'react';

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1440px] p-8 max-[1100px]:p-6 max-[720px]:p-4">{children}</div>;
}

export function PageHead({ title, subtitle, actions, titleTestId, titleAs = 'h1' }:
  { title: string; subtitle?: string; actions?: ReactNode; titleTestId?: string; titleAs?: 'h1' | 'h2' }) {
  const Title = titleAs;
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <Title className="text-2xl font-medium tracking-tight text-heading" data-testid={titleTestId}>{title}</Title>
        {subtitle && <div className="mt-1 text-[13px] text-foreground-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = '' }:
  { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-background ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            {title && <div className="text-sm font-medium text-foreground">{title}</div>}
            {subtitle && <div className="text-xs text-foreground-muted">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function Empty({ icon, title, body, cta }:
  { icon?: ReactNode; title: string; body?: string; cta?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 grid h-11 w-11 place-items-center rounded-lg bg-background-hover text-foreground-muted">{icon}</div>}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {body && <div className="max-w-xs text-[13px] text-foreground-muted">{body}</div>}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-background-hover ${className}`} />;
}
```

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): Card/Page/PageHead/Empty/Skeleton primitives"`

### Task 7: Avatar / Tabs / Switch / Checkbox / Stat / Progress + barrel

**Files:**
- Create: `apps/web/src/components/ui/Misc.tsx`
- Create: `apps/web/src/components/ui/index.ts`

- [ ] **Step 1: Implement `Misc.tsx`**

```tsx
import type { ReactNode } from 'react';

export function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const letters = (name || '?').split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  const dim = size === 'sm' ? 'h-5 w-5 text-[9px]' : size === 'lg' ? 'h-9 w-9 text-[13px]' : 'h-7 w-7 text-[11px]';
  return <span className={`grid shrink-0 place-items-center rounded-full bg-green-600 font-medium text-white ${dim}`}>{letters}</span>;
}

export function Tabs<T extends string>({ value, onChange, tabs }:
  { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-5 border-b border-border">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px flex h-9 items-center gap-2 border-b-2 text-[13px] ${
            value === t.value ? 'border-accent font-medium text-foreground' : 'border-transparent text-foreground-muted hover:text-foreground'}`}>
          {t.label}{t.count != null && <span className="text-[11px] text-foreground-subtle">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-foreground-subtle/40'}`}>
      <i className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${on ? 'translate-x-[14px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function Stat({ label, value, foot }: { label: ReactNode; value: ReactNode; foot?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background p-6">
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">{label}</div>
      <div className="text-2xl font-medium tabular-nums tracking-tight text-foreground">{value}</div>
      {foot && <div className="flex items-center gap-1.5 text-xs text-foreground-muted">{foot}</div>}
    </div>
  );
}

export function Progress({ value, max = 100, testId }: { value: number; max?: number; testId?: string }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-background-hover" data-testid={testId}>
      <i className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${p}%` }} />
    </div>
  );
}
```

- [ ] **Step 2: Create barrel `index.ts`**

```ts
export * from './icons';
export * from './Button';
export * from './Pill';
export * from './Card';
export * from './Misc';
```

- [ ] **Step 3: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 4: Commit** — `git add apps/web/src/components/ui && git commit -m "feat(web): remaining UI primitives + barrel"`

---

## Phase 2 — Shell

### Task 8: Theme hook

**Files:**
- Create: `apps/web/src/theme/useTheme.ts`

- [ ] **Step 1: Implement**

```ts
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function initial(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}
```

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git add apps/web/src/theme && git commit -m "feat(web): light/dark theme hook"`

### Task 9: Sidebar

**Files:**
- Create: `apps/web/src/components/Sidebar.tsx`

Uses the `.sidebar` / `.nav-item` classes ported in Task 1. **Existing routes render as `<Link>` with the exact names.** Admin items render only for admins.

- [ ] **Step 1: Implement**

```tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  IcMessage, IcUsers, IcFilter, IcFile, IcSend, IcBar, IcBook,
  IcSettings, IcShield, IcList, IcZap, IcPhone, IcActivity, IcChevsLR, IcChevsRL,
} from './ui/icons';

type Item = { to: string; label: string; icon: React.ReactNode; admin?: boolean };

const WORKSPACE: Item[] = [
  { to: '/inbox', label: 'Inbox', icon: <IcMessage size={18} /> },
  { to: '/contacts', label: 'Contacts', icon: <IcUsers size={18} /> },
  { to: '/segments', label: 'Segments', icon: <IcFilter size={18} /> },
  { to: '/templates', label: 'Templates', icon: <IcFile size={18} /> },
  { to: '/blasts', label: 'Blasts', icon: <IcSend size={18} /> },
  { to: '/reports', label: 'Reports', icon: <IcBar size={18} /> },
  { to: '/knowledge', label: 'Knowledge', icon: <IcBook size={18} />, admin: true },
  { to: '/settings', label: 'Settings', icon: <IcSettings size={18} />, admin: true },
];
const ADMIN: Item[] = [
  { to: '/users', label: 'Users & roles', icon: <IcShield size={18} />, admin: true },
  { to: '/audit', label: 'Audit log', icon: <IcList size={18} />, admin: true },
];
const HELP: Item[] = [
  { to: '/workflows', label: 'Daily playbook', icon: <IcZap size={18} /> },
  { to: '/helpline', label: 'Helpline', icon: <IcPhone size={18} /> },
  { to: '/status', label: 'System status', icon: <IcActivity size={18} /> },
];

export default function Sidebar({ collapsed, onToggleCollapse }:
  { collapsed: boolean; onToggleCollapse: () => void }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  // "Dashboard" link is the overview at "/". Keep it first so getByRole('link',{name:'Dashboard'}) works.
  const dashboard: Item = { to: '/', label: 'Dashboard', icon: <IcBar size={18} /> };

  const renderItem = (it: Item) => {
    if (it.admin && !isAdmin) return null;
    const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to);
    return (
      <Link key={it.to} to={it.to} className="nav-item" data-active={active}>
        {it.icon}
        <span className="nav-label">{it.label}</span>
      </Link>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark"><IcMessage size={16} /></span>
        <span className="sidebar-brand-name">Blaster</span>
        <span className="sidebar-brand-env">prod</span>
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-label">Workspace</div>
        <div className="sidebar-nav">{[dashboard, ...WORKSPACE].map(renderItem)}</div>
      </div>
      {isAdmin && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Admin</div>
          <div className="sidebar-nav">{ADMIN.map(renderItem)}</div>
        </div>
      )}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Help</div>
        <div className="sidebar-nav">{HELP.map(renderItem)}</div>
      </div>
      <div className="sidebar-foot">
        <button className="sidebar-collapse-btn" onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <IcChevsLR size={14} /> : <IcChevsRL size={14} />}
        </button>
      </div>
    </aside>
  );
}
```

**Contract checks in this task:** the six links `Dashboard/Contacts/Segments/Templates/Blasts/Settings` are present with exact text and no badges; `Settings` (and the admin section + `Knowledge`) only render when `isAdmin`.

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git add apps/web/src/components/Sidebar.tsx && git commit -m "feat(web): sidebar shell with role-gated nav"`

### Task 10: TopBar

**Files:**
- Create: `apps/web/src/components/TopBar.tsx`

`current-user` (email) and `logout` (button) are **always rendered and directly clickable** in the bar.

- [ ] **Step 1: Implement**

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/useTheme';
import { Avatar } from './ui/Misc';
import { IconButton } from './ui/Button';
import { IcSearch, IcSun, IcMoon, IcLogout } from './ui/icons';

export default function TopBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  async function onLogout() { await logout(); navigate('/login'); }

  return (
    <header className="topbar">
      <button className="search" onClick={onSearchOpen} title="Search (⌘K)">
        <IcSearch size={14} />
        <span className="flex-1 text-left">Search…</span>
        <span className="kbd">⌘K</span>
      </button>
      <span className="grow" />
      <div className="topbar-actions">
        <IconButton icon={theme === 'dark' ? <IcSun size={16} /> : <IcMoon size={16} />}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggle} />
        <span className="h-5 w-px bg-border" />
        <Avatar name={user?.email} size="md" />
        <span className="text-[13px] text-foreground-muted" data-testid="current-user">{user?.email}</span>
        <IconButton icon={<IcLogout size={16} />} title="Logout" data-testid="logout" onClick={onLogout} />
      </div>
    </header>
  );
}
```

Note: `IconButton` forwards `data-testid` via `...rest`. The `logout` button is a real button, directly clickable; `current-user` span text equals the email.

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git add apps/web/src/components/TopBar.tsx && git commit -m "feat(web): topbar with theme toggle, user email, logout"`

### Task 11: Command palette (nav + actions only)

**Files:**
- Create: `apps/web/src/components/CommandPalette.tsx`

- [ ] **Step 1: Implement** (⌘K to open; navigation + primary actions; entity search deferred)

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type Cmd = { id: string; label: string; to: string; admin?: boolean };

const COMMANDS: Cmd[] = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', to: '/' },
  { id: 'nav-contacts', label: 'Go to Contacts', to: '/contacts' },
  { id: 'nav-segments', label: 'Go to Segments', to: '/segments' },
  { id: 'nav-templates', label: 'Go to Templates', to: '/templates' },
  { id: 'nav-blasts', label: 'Go to Blasts', to: '/blasts' },
  { id: 'nav-settings', label: 'Open Settings', to: '/settings', admin: true },
  { id: 'act-new-blast', label: 'New blast', to: '/blasts/new' },
  { id: 'act-new-template', label: 'New template', to: '/templates/new' },
  { id: 'act-new-contact', label: 'Add contact', to: '/contacts/new' },
  { id: 'act-import', label: 'Import contacts (CSV)', to: '/contacts/import' },
  // TODO: wire entity search (contacts/campaigns/templates) once backend search exists.
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);

  const items = useMemo(() => {
    const visible = COMMANDS.filter((c) => !c.admin || user?.role === 'ADMIN');
    const ql = q.trim().toLowerCase();
    return ql ? visible.filter((c) => c.label.toLowerCase().includes(ql)) : visible;
  }, [q, user]);

  useEffect(() => { if (!open) { setQ(''); setCursor(0); } }, [open]);
  useEffect(() => { setCursor(0); }, [q]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
      else if (e.key === 'Enter') { const it = items[cursor]; if (it) { navigate(it.to); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, cursor, navigate, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/30 pt-24" onClick={onClose}>
      <div className="w-[600px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground outline-none" />
        <div className="max-h-[380px] overflow-y-auto py-1">
          {items.map((it, i) => (
            <button key={it.id} onMouseEnter={() => setCursor(i)} onClick={() => { navigate(it.to); onClose(); }}
              className={`flex w-full items-center px-4 py-2 text-left text-[13px] ${i === cursor ? 'bg-background-subtle text-foreground' : 'text-foreground'}`}>
              {it.label}
            </button>
          ))}
          {items.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-foreground-muted">No matches</div>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git add apps/web/src/components/CommandPalette.tsx && git commit -m "feat(web): nav/action command palette (entity search deferred)"`

### Task 12: ComingSoon + Layout + placeholder routes

**Files:**
- Create: `apps/web/src/components/ComingSoon.tsx`
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: ComingSoon**

```tsx
import { Page, PageHead, Empty } from './ui/Card';
import { IcActivity } from './ui/icons';

export default function ComingSoon({ title }: { title: string }) {
  return (
    <Page>
      <PageHead title={title} />
      <Empty icon={<IcActivity size={20} />} title="Coming soon"
        body="This area isn't built yet. The navigation and layout are in place ahead of the backend." />
    </Page>
  );
}
```

- [ ] **Step 2: Rewrite `Layout.tsx`**

```tsx
import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CommandPalette from './CommandPalette';
import { useTheme } from '../theme/useTheme';

export default function Layout({ children }: { children: ReactNode }) {
  useTheme(); // applies data-theme on mount
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0'); }, [collapsed]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app" data-sidebar={collapsed ? 'collapsed' : 'expanded'}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      <TopBar onSearchOpen={() => setPaletteOpen(true)} />
      <main className="main page">{children}</main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
```

Note: `.app`, `.main`, `.page` come from the shell CSS (Task 1). `.main`/`.page` provide the scroll container; pages render `<Page>` inside.

- [ ] **Step 3: Add placeholder routes to `App.tsx`**

Keep every existing route exactly as-is. Add a `ComingSoon` import and these routes (each wrapped like the others; admin ones get `requireRole="ADMIN"`):

```tsx
import ComingSoon from './components/ComingSoon';
// ...inside <Routes>, alongside existing routes:
<Route path="/inbox"    element={<ProtectedRoute><Layout><ComingSoon title="Inbox" /></Layout></ProtectedRoute>} />
<Route path="/reports"  element={<ProtectedRoute><Layout><ComingSoon title="Reports" /></Layout></ProtectedRoute>} />
<Route path="/workflows" element={<ProtectedRoute><Layout><ComingSoon title="Daily playbook" /></Layout></ProtectedRoute>} />
<Route path="/helpline" element={<ProtectedRoute><Layout><ComingSoon title="Helpline" /></Layout></ProtectedRoute>} />
<Route path="/status"   element={<ProtectedRoute><Layout><ComingSoon title="System status" /></Layout></ProtectedRoute>} />
<Route path="/knowledge" element={<ProtectedRoute requireRole="ADMIN"><Layout><ComingSoon title="Chatbot knowledge" /></Layout></ProtectedRoute>} />
<Route path="/users"    element={<ProtectedRoute requireRole="ADMIN"><Layout><ComingSoon title="Users & roles" /></Layout></ProtectedRoute>} />
<Route path="/audit"    element={<ProtectedRoute requireRole="ADMIN"><Layout><ComingSoon title="Audit log" /></Layout></ProtectedRoute>} />
```

- [ ] **Step 4: Verify build** — `pnpm --filter web build` → PASS
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(web): compose sidebar+topbar shell, ⌘K palette, placeholder routes"`

**Phase 2 gate (critical — shell touches the nav/auth contract):** with the verification harness running:

```bash
pnpm --filter e2e exec playwright test tests/login.spec.ts tests/operator.spec.ts tests/auth-persistence.spec.ts
```

Expected: PASS. Specifically confirms: nav link names, `Settings` hidden for operator, `current-user` text, `logout` clickable, dashboard reachable, session persists on reload. If `login.spec` "admin can navigate to settings" fails, check the `Settings` `<Link>` text is exactly `Settings`. Then run the full suite — Contacts/Templates filter-class assertions will still fail until Task 18; everything else must pass.

---

## Phase 3 — Page re-skins

> **Pattern for every page task:** (1) keep the component's imports, hooks, mutations, queries, query keys, and handlers byte-for-byte; (2) replace only JSX/className; (3) wrap the page body in `<Page>` + `<PageHead .../>`; (4) use primitives (`Button`, `Card`, `Pill`, `StatusPill`, `Empty`) and token utilities; (5) **keep every `data-testid` on the same semantic element**; (6) reference the named design screen for layout. Verify each with `pnpm --filter web exec tsc --noEmit`, then commit.
>
> Task 13 (Contacts) is fully worked as the exemplar. The remaining page tasks list their exact contract + design reference; follow the Task-13 pattern.

### Task 13: Contacts (worked exemplar) + Pagination + FilterBuilder

**Files:**
- Modify: `apps/web/src/pages/Contacts.tsx`
- Modify: `apps/web/src/components/Pagination.tsx`
- Modify: `apps/web/src/components/FilterBuilder.tsx`
- Design ref: `docs/design/screens/contacts.jsx`

**Preserve:** `add-contact` (Link, text "+ Add Contact" → keep an accessible Edit/Add), `import-csv` (Link), `contacts-search` (input), `contacts-table` (table), `contact-row-${id}` (row), per-row `Edit` `<Link>`; the empty-state text. Query key `['contacts', search, filter, page]` unchanged.

- [ ] **Step 1: Rewrite `Contacts.tsx` body** (logic identical; classes/markup new)

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listContacts, type ContactFilter } from '../api/contacts';
import FilterBuilder from '../components/FilterBuilder';
import Pagination from '../components/Pagination';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IcPlus, IcUpload } from '../components/ui/icons';

const PAGE_SIZE = 50;

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContactFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', search, filter, page],
    queryFn: () => listContacts({ ...filter, search: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  function onFilterChange(next: ContactFilter) { setFilter(next); setPage(1); }

  return (
    <Page>
      <PageHead title="Contacts" actions={
        <>
          <Link to="/contacts/new" data-testid="add-contact">
            <Button variant="primary" icon={<IcPlus size={14} />}>Add Contact</Button>
          </Link>
          <Link to="/contacts/import" data-testid="import-csv">
            <Button variant="secondary" icon={<IcUpload size={14} />}>Import CSV</Button>
          </Link>
        </>
      } />

      <div className="mb-4">
        <input type="search" placeholder="Search by name or phone…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 w-full max-w-md rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          data-testid="contacts-search" />
      </div>

      <div className="mb-4"><FilterBuilder value={filter} onChange={onFilterChange} /></div>

      {isLoading && <p className="text-foreground-muted">Loading…</p>}
      {error && <p className="text-red-500">Failed to load contacts.</p>}
      {data && (
        <Card className="!p-0">
          <table className="w-full text-[13px]" data-testid="contacts-table">
            <thead className="border-b border-border bg-background-subtle text-left text-[11px] text-foreground-muted">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Ethnicity</th><th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">State</th><th className="px-4 py-3">Opt-in</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0" data-testid={`contact-row-${c.id}`}>
                  <td className="px-4 py-3.5 text-foreground">{c.name ?? '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-foreground">{c.phoneE164}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.ethnicity}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.languagePreference}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.state ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={c.optInStatus === 'OPTED_IN' ? 'text-green-700'
                      : c.optInStatus === 'OPTED_OUT' ? 'text-red-500' : 'text-foreground-subtle'}>{c.optInStatus}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link to={`/contacts/${c.id}`} className="text-green-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-foreground-muted">No contacts match these filters.</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          </div>
        </Card>
      )}
    </Page>
  );
}
```

(`Card` adds `p-6`; the `!p-0` removes padding so the table is flush. If `!p-0` is awkward with the Card API, render the table inside a plain `<div className="overflow-hidden rounded-lg border border-border bg-background">` instead of `Card`.)

- [ ] **Step 2: Restyle `Pagination.tsx`** — keep `pagination`, `page-prev`, `page-next` testids and the `from–to of total` text and `page / totalPages` text. Swap classes only:

```tsx
return (
  <div className="flex items-center justify-between py-3 text-[13px]" data-testid="pagination">
    <div className="text-foreground-muted">{from}–{to} of {total}</div>
    <div className="flex items-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-border-strong px-3 py-1 text-foreground disabled:opacity-40" data-testid="page-prev">Prev</button>
      <span className="px-2 text-foreground-muted">{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-border-strong px-3 py-1 text-foreground disabled:opacity-40" data-testid="page-next">Next</button>
    </div>
  </div>
);
```

- [ ] **Step 3: Restyle `FilterBuilder.tsx` chips + add `aria-pressed`** — in `MultiSelectChips`, change ONLY the chip button:

```tsx
<button
  type="button"
  key={opt}
  onClick={() => toggle(opt)}
  aria-pressed={!!isSelected}
  className={
    isSelected
      ? 'rounded-full border border-accent bg-accent px-2.5 py-1 text-xs font-medium text-white'
      : 'rounded-full border border-border-strong bg-background px-2.5 py-1 text-xs text-foreground hover:bg-background-hover'
  }
  data-testid={`filter-${testIdPrefix}-${opt}`}
>
  {opt}
</button>
```

Also restyle the wrapper (`bg-background-subtle p-4 rounded-lg ...`) and the age inputs (token classes), keeping `filter-age-min`/`filter-age-max`. **The `aria-pressed` attribute is the contract for Task 18.**

- [ ] **Step 4: Verify** — `pnpm --filter web exec tsc --noEmit` → PASS
- [ ] **Step 5: Commit** — `git add apps/web/src/pages/Contacts.tsx apps/web/src/components/Pagination.tsx apps/web/src/components/FilterBuilder.tsx && git commit -m "feat(web): re-skin Contacts, Pagination, FilterBuilder (+aria-pressed chips)"`

### Task 14: Templates list

**Files:** Modify `apps/web/src/pages/Templates.tsx`. Design ref: `docs/design/screens/templates.jsx`.

**Preserve:** `add-template` (Link), `templates-search` (input), `filter-status-${s}` chips, `filter-category-${c}` chips, `template-group-${name}` (the clickable group Link), the per-language `TemplateStatusBadge`. Query key `['templates', search, statusFilter, categoryFilter]` unchanged.

- [ ] **Step 1:** Wrap in `<Page>`+`<PageHead title="Templates" actions={<Link to="/templates/new" data-testid="add-template"><Button variant="primary" icon={<IcPlus/>}>New Template</Button></Link>}/>`. Put search + filters in a `Card`. **Both filter chip groups must add `aria-pressed={statusFilter.includes(s)}` / `aria-pressed={categoryFilter.includes(c)}`** and use the same active/inactive chip classes as Task 13 Step 3. Render each group as a `<Link className="block ..." data-testid={`template-group-${g.name}`}>` card showing name, `v{version}`, category · N languages, and the per-row `<TemplateStatusBadge>`.
- [ ] **Step 2: Verify** — `tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): re-skin Templates list (+aria-pressed filter chips)"`

### Task 15: Status badges → StatusPill

**Files:** Modify `apps/web/src/components/TemplateStatusBadge.tsx`, `apps/web/src/components/BlastStatusBadge.tsx`.

**Preserve:** `TemplateStatusBadge` must still render `data-testid="status-badge-${status}"`; `BlastStatusBadge` must still render `data-testid="blast-status-${status}"`.

- [ ] **Step 1:** Reimplement each as a thin wrapper over `StatusPill`:

```tsx
// TemplateStatusBadge.tsx
import type { TemplateStatus } from '../api/templates';
import { StatusPill } from './ui/Pill';
export default function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return <StatusPill status={status} testId={`status-badge-${status}`} />;
}
```

```tsx
// BlastStatusBadge.tsx
import type { BlastStatus } from '../api/blasts';
import { StatusPill } from './ui/Pill';
export default function BlastStatusBadge({ status }: { status: BlastStatus }) {
  return <StatusPill status={status} testId={`blast-status-${status}`} />;
}
```

- [ ] **Step 2: Verify** — `tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): badges delegate to StatusPill"`

### Task 16: Modal + Toast restyle

**Files:** Modify `apps/web/src/components/Modal.tsx`, `apps/web/src/components/Toast.tsx`.

**Preserve:** `Modal` keeps `data-testid="modal-backdrop"`, `role="dialog"`, `aria-label`, Escape-to-close, click-backdrop-to-close. `Toast` keeps `data-testid="toast-${variant}"`, `role="status"`, auto-dismiss.

- [ ] **Step 1:** Swap classes to tokens (backdrop `bg-black/40`; panel `rounded-lg border border-border bg-background`; header `border-b border-border`; toast `rounded-md border` with green/red token tones). Keep all attributes/logic.
- [ ] **Step 2: Verify** — `tsc --noEmit` → PASS
- [ ] **Step 3: Commit** — `git commit -am "feat(web): re-skin Modal + Toast"`

### Task 17: Remaining pages

For each, follow the Task-13 pattern (logic untouched, JSX/classes only, wrap in `Page`+`PageHead`, preserve all listed testids). Verify `tsc --noEmit` and commit after **each** sub-step.

- [ ] **17a — Login** (`pages/Login.tsx`; ref `docs/design/login.html`). Preserve `email`, `password`, `login-error`, `submit`. Center a `Card` with the brand mark; submit button `Button variant="primary"`. Not inside `Layout` (standalone). Commit: `git commit -am "feat(web): re-skin Login"`.
- [ ] **17b — Dashboard** (`pages/Dashboard.tsx`; ref `docs/design/screens/overview.jsx`). **Must keep `data-testid="dashboard-title"` with text `Dashboard`** — use `<PageHead title="Dashboard" titleTestId="dashboard-title" />`. Add a `kpi-strip`/`grid` of `Stat` tiles (static placeholder numbers are fine; no backend). Commit: `"feat(web): re-skin Dashboard"`.
- [ ] **17c — ContactForm** (`pages/ContactForm.tsx`; form layout from `docs/design`). Preserve `contact-form`, `contact-phone`, `contact-name`, `contact-dob`, `contact-gender`, `contact-ethnicity`, `contact-religion`, `contact-occupation`, `contact-language`, `contact-city`, `contact-state`, `contact-optin`, `contact-form-error`, `contact-cancel`, `contact-delete`, `contact-submit`. Keep the `Field`/`EnumField` helpers (restyle inner `<input>`/`<select>` to token classes). Commit: `"feat(web): re-skin ContactForm"`.
- [ ] **17d — ContactsImport** (`pages/ContactsImport.tsx`; ref `docs/design/screens/import-wizard.jsx`). Preserve `import-form`, `csv-file`, `csv-submit`, `import-result`, `import-errors`. Result tiles → `Stat`/token cards (green/amber/red). Commit: `"feat(web): re-skin ContactsImport"`.
- [ ] **17e — Segments** (`pages/Segments.tsx`; ref `docs/design/screens/segments.jsx` + `segment-builder.jsx`). Preserve `segment-form`, `segment-name`, `segment-description`, `segment-form-error`, `segment-submit`; and in `SegmentRow` keep `data-testid="segment-row-${id}"`, the name, the `${count} matching contact(s)` text, the `Edit` button, and the **`Delete` button** (text exactly `Delete`). `FilterBuilder` already restyled in Task 13. Commit: `"feat(web): re-skin Segments"`.
- [ ] **17f — TemplateForm** (`pages/TemplateForm.tsx`). Preserve `rejection-reason`, `template-form`, `template-name`, `template-category`, `template-variables`, `language-tabs`, `language-tab-${lang}`, `add-language-select`, `remove-language`, `template-form-error`, `template-submit-draft`, `template-delete`, `template-submit-meta`, `variant-header`, `variant-body`, `variant-footer`. The language tabs may use the `Tabs` look but **must keep one `<button data-testid="language-tab-${lang}">` per language** (the tests click these directly). Keep `VariantEditor`/`Field` helpers; restyle inputs. Commit: `"feat(web): re-skin TemplateForm"`.
- [ ] **17g — Blasts** (`pages/Blasts.tsx`; ref `docs/design/screens/campaigns.jsx`). **Heading must be an `<h1>` with text `Blasts`** — `<PageHead title="Blasts" .../>`. Preserve `new-blast` (Link), `blasts-list`, `blast-row-${id}`, `BlastStatusBadge`. Empty-state via `Empty`. Commit: `"feat(web): re-skin Blasts"`.
- [ ] **17h — BlastWizard** (`pages/BlastWizard.tsx`; ref `docs/design/screens/campaign-detail.jsx`/new). Preserve `blast-wizard`, `blast-name`, `blast-template`, `blast-default-language`, `blast-segment`, `variable-${n}`, `blast-scheduled-at`, `blast-form-error`, `blast-create`. Keep the 6 numbered sections; restyle selects/inputs. Commit: `"feat(web): re-skin BlastWizard"`.
- [ ] **17i — BlastDetail** (`pages/BlastDetail.tsx`). Preserve `blast-counters` (container), `counter-sent`/`counter-delivered`/`counter-read`/`counter-failed`, `progress-bar`, `blast-cancel`, `BlastStatusBadge`. Counters → token-toned tiles (reuse `Stat` or keep the `Counter` helper with token classes); progress bar may use the `Progress` primitive **but keep `data-testid="progress-bar"` on the filled element**. Commit: `"feat(web): re-skin BlastDetail"`.
- [ ] **17j — Settings** (`pages/Settings.tsx`; ref `docs/design/screens/settings.jsx` + `users.jsx`). Preserve `add-user-form`, `new-user-email`, `new-user-name`, `new-user-password`, `new-user-role`, `new-user-submit`, `add-user-error`, `users-table`, and (in the reset modal) `reset-password-form`, `reset-password-input`, `reset-password-submit`. Keep `Modal` + `Toast` usage. Commit: `"feat(web): re-skin Settings"`.

---

## Phase 4 — Test reconciliation & final verification

### Task 18: Update the two filter-class assertions

**Files:**
- Modify: `e2e/tests/contacts.spec.ts:62`
- Modify: `e2e/tests/templates.spec.ts:54`

- [ ] **Step 1: contacts.spec.ts** — replace:

```ts
await expect(page.getByTestId('filter-ethnicity-MALAY')).toHaveClass(/bg-indigo-600/);
```
with:
```ts
await expect(page.getByTestId('filter-ethnicity-MALAY')).toHaveAttribute('aria-pressed', 'true');
```

- [ ] **Step 2: templates.spec.ts** — replace:

```ts
await expect(page.getByTestId('filter-status-PENDING')).toHaveClass(/bg-indigo-600/);
```
with:
```ts
await expect(page.getByTestId('filter-status-PENDING')).toHaveAttribute('aria-pressed', 'true');
```

- [ ] **Step 3: Commit** — `git add e2e/tests/contacts.spec.ts e2e/tests/templates.spec.ts && git commit -m "test(e2e): assert filter chip active state via aria-pressed instead of CSS class"`

### Task 19: Full verification

- [ ] **Step 1: Type + build** — `pnpm --filter web build` → PASS (no TS errors, Vite build OK).
- [ ] **Step 2: Lint** — `pnpm --filter web lint` → PASS (fix any unused-import warnings introduced).
- [ ] **Step 3: Full E2E** — with the verification harness running:

```bash
pnpm --filter e2e test
```

Expected: **all** specs pass (login, contacts, templates, blasts, operator, auth-persistence).

- [ ] **Step 4: Manual visual smoke** — log in; toggle dark/light via the topbar; click each sidebar item (including a placeholder); open ⌘K and navigate; confirm Contacts/Templates/Blasts/Settings render cleanly in both themes.
- [ ] **Step 5: Final commit (if lint fixes)** — `git commit -am "chore(web): lint fixes after re-skin"`

---

## Self-review notes (author)

- **Spec coverage:** tokens (T1–2), primitives (T3–7), shell+theme+palette+placeholders (T8–12), every page in the mapping table (T13–17j), the `aria-pressed` test edit (T18), verification incl. dark mode (T19). All spec sections map to tasks.
- **Contract:** every `data-testid` from the grep inventory is named in the task that owns its page; nav-name/role, Settings-admin-gating, `current-user`/`logout` directly-clickable, and the `Dashboard`/`Blasts` headings are called out explicitly.
- **Type consistency:** primitive names/props (`Button{variant,size,icon}`, `StatusPill{status,testId}`, `PageHead{titleTestId}`, `Progress{testId}`) are used consistently across page tasks.
- **Known adaptation:** this is a visual re-skin, so the regression gate is the existing Playwright suite + `tsc`/build, not new failing-first unit tests (the web app has no unit-test harness; adding one is out of scope). Stated in Phase 3 preamble and Phase 4.
```
