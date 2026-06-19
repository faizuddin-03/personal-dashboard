# Phase 0B — Frontend Shell (eAuto design) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app *look and navigate* like the eAuto design — evolve the existing reskinned shell to the new design's nav, roles, AI-ambient chrome, notifications, user menu, mobile nav, and login — so every subsequent per-screen phase drops into a finished frame.

**Architecture:** This is an **evolution, not a from-scratch port**. The current `apps/web` (from the prior `feat/frontend-reskin`) already uses this design system's tokens (`--accent:#25D366`, `--sidebar-w`, `--topbar-h`…), Tailwind token mapping, and base component classes (`.sidebar`, `.nav-item[data-active]`, `.usermenu`, `.btn-primary`, `.pill[data-tone]`…), plus `Sidebar`/`TopBar`/`CommandPalette` TSX and an `AuthProvider`/`useTheme`/`ProtectedRoute` foundation. We adopt the design's **newer** `styles.css` (a superset), rebuild the shell components to the eAuto design (new nav + AI ambient + notifications + switch-role + mobile nav), relabel/gate roles, and restyle login. **Underlying pages stay the existing ones** (new nav → existing routes, transitional) until their own phases.

**This is a UI port:** verification is `pnpm --filter web build` + running the app (use the `run` skill or `pnpm --filter web dev`) + the Playwright E2E suite — **not** unit TDD. Visual components are **translated from the in-repo design source** (`docs/design/shell.jsx`, `components.jsx`, `screen-login.jsx`, `styles.css`); those files are the source of truth for markup/styling — preserve their structure, reproduce the behaviors/props this plan specifies.

**Tech Stack:** Vite 5 + React 18 + TS + react-router-dom 6 + react-query 5 + Tailwind 3 (token-mapped). Custom SVG icon set. No component lib.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§4 frontend, §8 roles, §10 Phase 0 frontend tasks).

**Branch:** Create `feat/eauto-frontend-shell` off `feat/eauto-learning-loop` (so the tickets/knowledge/inbox APIs the shell badges read are present) — or off `master` after the backend stack merges.

**Decisions (from planning):**
- **Demo login:** seed a Customer Support (OPERATOR) user; the login screen's two demo buttons perform **real** backend logins.
- **Nav:** adopt the design's nav/labels/roles now; **update the affected E2E assertions**; new nav points at the **existing** pages (transitional) — per-screen rewrites are later phases.
- **Roles:** keep the `ADMIN`/`OPERATOR` DB enum; relabel in the UI to **"Super Admin"/"Customer Support"** and gate (Settings hidden for support; other screens visible but view-only is enforced per-screen later).
- **Paths unchanged:** keep existing route *paths* (`/blasts`, `/contacts`, `/reports`); only the nav **labels/icons** change (Campaigns/Dealers/Performance). This avoids churning existing pages' internal links and E2E route navigations — only the visible link *text* assertions change.

**Scope note:** Shell + design-system + roles + login + routes + placeholders only. NOT in scope: rewriting Dealers/Campaigns/Inbox/Knowledge/Performance/Dashboard/Settings screen *bodies* (each is a later phase). Not-yet-built screens render a styled placeholder.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/prisma/seed.ts` | Seed a Customer Support (OPERATOR) user. |
| `apps/web/src/index.css` | Adopt the design's `styles.css` (superset) under the existing `@tailwind` directives + token blocks. |
| `apps/web/src/components/ui/icons.tsx` | Add the shell's missing icons (bell, sparkle/AI, switch-role, etc.). |
| `apps/web/src/components/ui/AIOrb.tsx` | New — breathing AI orb. |
| `apps/web/src/components/ui/Badge.tsx` | New — eAuto Badge tones (brand/ai/human/success/neutral/blue/amber/red). |
| `apps/web/src/components/NotificationsBell.tsx` | New — bell + dropdown + seed. |
| `apps/web/src/lib/roles.ts` | New — `ROLE_LABEL`, nav model, support-gating helpers. |
| `apps/web/src/components/Sidebar.tsx` | Rebuild to eAuto nav + AI ambient + badges + gating. |
| `apps/web/src/components/TopBar.tsx` | Rebuild: breadcrumb, search trigger, AI widget, notifications, user menu (switch-role/theme/logout). |
| `apps/web/src/components/MobileNav.tsx` | New — drawer + bottom tabs. |
| `apps/web/src/components/Layout.tsx` | Wire mobile nav; pass badge counts. |
| `apps/web/src/components/CommandPalette.tsx` | Update command list/labels to the new nav. |
| `apps/web/src/components/StyledPlaceholder.tsx` | New — replaces `ComingSoon` with an on-design placeholder. |
| `apps/web/src/pages/Login.tsx` | Restyle: AIOrb, eAuto brand, demo buttons (real logins), forgot-password info. |
| `apps/web/src/App.tsx` | Route table: ensure Campaigns/Dealers/Performance/Knowledge routes; use `StyledPlaceholder`. |
| `apps/web/src/auth/AuthContext.tsx` | (If needed) expose what the user menu / demo login require. |
| `e2e/tests/*.spec.ts` | Update nav-link/role-label assertions to the new design; keep testid contracts. |

---

## Task 1: Seed a Customer Support user (backend)

**Files:** Modify `apps/api/prisma/seed.ts`

- [ ] **Step 1:** In `apps/api/prisma/seed.ts`, after the existing admin-user seed block (the `const email = ...` / admin create), add an idempotent OPERATOR seed:
```ts
  const supportEmail = process.env.SEED_SUPPORT_EMAIL ?? 'support@example.com';
  const supportPassword = process.env.SEED_SUPPORT_PASSWORD ?? 'ChangeMe123!';
  const existingSupport = await prisma.user.findUnique({ where: { email: supportEmail } });
  if (!existingSupport) {
    const passwordHash = await bcrypt.hash(supportPassword, 12);
    await prisma.user.create({
      data: { email: supportEmail, passwordHash, name: 'Priya Nair', role: 'OPERATOR' },
    });
    console.log(`Seeded Customer Support user: ${supportEmail} / ${supportPassword}`);
  } else {
    console.log(`Support user ${supportEmail} already exists — skipping`);
  }
```
- [ ] **Step 2:** Run `pnpm --filter api db:seed` → expect the support-user line (and "already exists" on re-run). Verify: a query for `role: 'OPERATOR'` returns the user.
- [ ] **Step 3:** Commit: `git add apps/api/prisma/seed.ts && git commit -m "feat(api): seed a Customer Support (OPERATOR) user for demo login"`

---

## Task 2: Adopt the design's stylesheet

**Files:** Modify `apps/web/src/index.css`

- [ ] **Step 1:** Open `docs/design/styles.css` (the eAuto design-system v2 — tokens + component classes) and `apps/web/src/index.css` (current: `@tailwind base/components/utilities;` + `:root{tokens}` + `html[data-theme="dark"]{tokens}` + component classes). Produce a merged `index.css` that:
  - **Keeps** the three `@tailwind` directives at the very top (Tailwind must stay — existing pages use utility classes).
  - **Replaces** the component-class section + token blocks with the content of `docs/design/styles.css` (it is a superset of the current classes and shares the token names/values). Result: `index.css` = `@tailwind` directives, then the full `docs/design/styles.css` body.
  - Confirm the dark-mode mechanism stays `html[data-theme="dark"]` (both use it) so `useTheme` keeps working unchanged.
- [ ] **Step 2:** `pnpm --filter web build` → must succeed (TS/Vite). Then run the app (`pnpm --filter web dev`, or the `run` skill) and confirm: the existing pages (Dashboard, Contacts, Templates, Blasts) still render without obvious breakage, and the light/dark toggle still flips `data-theme`. Fix any class the old pages relied on that the v2 sheet dropped (search the old `index.css` git diff for removed `.classes` still referenced under `apps/web/src`).
- [ ] **Step 3:** Commit: `git add apps/web/src/index.css && git commit -m "feat(web): adopt eAuto design-system stylesheet"`

---

## Task 3: Shared components — AIOrb, Badge, icons, NotificationsBell

**Files:** Create `apps/web/src/components/ui/AIOrb.tsx`, `apps/web/src/components/ui/Badge.tsx`, `apps/web/src/components/NotificationsBell.tsx`; modify `apps/web/src/components/ui/icons.tsx`, `apps/web/src/components/ui/index.ts`.

- [ ] **Step 1:** Add the shell's missing icons to `icons.tsx` by translating from `docs/design/components.jsx` (the `Icon`/icon-paths). Add at least: `IcSparkle`/`IcBot` (AI), `IcBell`, `IcChevD`/`IcChevU` (user-menu), `IcGlobe`, `IcShield`, `IcUser`, `IcHelp`, plus any the new Sidebar/TopBar reference. Keep the existing 24×24 stroke style + `Icon({ size?, ...SVGProps })` signature. Export from `index.ts`.
- [ ] **Step 2:** Create `AIOrb.tsx` — translate `AIOrb` from `docs/design/components.jsx`. Props: `{ size?: number; breathe?: boolean; className?: string }`. A glowing sparkle orb (used in login + sidebar ambient + topbar widget). Use the `.anim`/breathe class from the design CSS.
- [ ] **Step 3:** Create `Badge.tsx` — translate the design's `Badge`. Props: `{ tone?: 'brand'|'ai'|'human'|'success'|'neutral'|'blue'|'amber'|'red'; solid?: boolean; icon?: ReactNode; mono?: boolean; children }`. Render the design's badge markup (uses token-driven classes). (Keep the existing `Pill` as-is for status pills.)
- [ ] **Step 4:** Create `NotificationsBell.tsx` — translate the design's notifications bell + dropdown (`docs/design/shell.jsx` / `app.jsx` `NOTIFS_SEED`). Props: `{ items: Notif[]; onNavigate?: (screen: string) => void }`. For 0B, seed the notifications client-side from the design's `NOTIFS_SEED` (escalation / template approved / rejected / campaign finished / AI activity) in a local module `apps/web/src/lib/notifications.ts`. Bell shows unread count; dropdown lists items; "Mark all as read"; clicking an item marks read (local state) + optional navigate.
- [ ] **Step 5:** `pnpm --filter web build` → clean. Commit: `git add apps/web/src/components/ui apps/web/src/components/NotificationsBell.tsx apps/web/src/lib/notifications.ts && git commit -m "feat(web): add AIOrb, Badge, shell icons, notifications bell"`

---

## Task 4: Roles model + nav model + gating helpers

**Files:** Create `apps/web/src/lib/roles.ts`.

- [ ] **Step 1:** Create `apps/web/src/lib/roles.ts` with the role labels, the nav model (label/path/icon/role rules), and gating helpers. Exact content:
```ts
import type { ReactNode } from 'react';
import type { Role } from '../api/auth';

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Super Admin',
  OPERATOR: 'Customer Support',
};

export interface NavItem {
  label: string;       // visible text (E2E asserts these)
  path: string;        // existing route path (unchanged)
  icon: string;        // icon component name from ui/icons
  adminOnly?: boolean; // hidden for OPERATOR
  badge?: 'escalations' | 'inReview';
}

/** eAuto primary nav — new labels, existing paths (transitional). */
export const NAV: NavItem[] = [
  { label: 'Dashboard',   path: '/',          icon: 'IcBar' },
  { label: 'Campaigns',   path: '/blasts',    icon: 'IcSend' },
  { label: 'Inbox',       path: '/inbox',     icon: 'IcMessage', badge: 'escalations' },
  { label: 'Dealers',     path: '/contacts',  icon: 'IcUsers' },
  { label: 'Templates',   path: '/templates', icon: 'IcFile', badge: 'inReview' },
  { label: 'Performance', path: '/reports',   icon: 'IcActivity' },
  { label: 'Knowledge',   path: '/knowledge', icon: 'IcBook', adminOnly: true },
  { label: 'Settings',    path: '/settings',  icon: 'IcSettings', adminOnly: true },
];

export const isAdmin = (role: Role | undefined) => role === 'ADMIN';
export const visibleNav = (role: Role | undefined) =>
  NAV.filter((n) => !n.adminOnly || isAdmin(role));

/** Mobile bottom-tab subset. */
export const BOTTOM_TABS = ['Dashboard', 'Inbox', 'Dealers', 'Templates'];
```
(Note: `ReactNode` import is illustrative; drop it if unused. Icons are referenced by name — the Sidebar maps name→component.)
- [ ] **Step 2:** `pnpm --filter web build` → clean. Commit: `git add apps/web/src/lib/roles.ts && git commit -m "feat(web): role labels + eAuto nav model + gating helpers"`

---

## Task 5: Sidebar (eAuto design)

**Files:** Modify `apps/web/src/components/Sidebar.tsx`.

- [ ] **Step 1:** Rebuild `Sidebar.tsx` translating from `docs/design/shell.jsx` (Sidebar). Requirements (exact behaviors):
  - Brand: AIOrb + "WhatsApp Blaster" + "eAuto" subtitle.
  - Nav: render `visibleNav(role)` from `lib/roles.ts` (map `icon` name → `ui/icons` component). Each item is a react-router `<Link to={path}>` with `data-active` when the path matches; **keep the visible `label` text exactly** (E2E asserts these). `Settings`/`Knowledge` hidden for OPERATOR via `visibleNav`.
  - Badges: Inbox item shows an escalations count; Templates shows an in-review count. Wire counts from props (Layout passes them). Inbox badge keeps `data-testid="sidebar-inbox-badge"`.
  - AI ambient presence block (bottom): AIOrb (breathing) + "Auto-reply AI" + "Running autonomously" + auto-handled % — translate from the design; the % can be a passed-in prop or a static value for now.
  - Collapse toggle preserved.
  - `useAuth()` for role.
- [ ] **Step 2:** Build + run the app. Verify: logged in as admin → all 8 nav items incl. Settings/Knowledge; logged in as the seeded support user → Settings + Knowledge hidden; active highlighting works; inbox badge renders.
- [ ] **Step 3:** Commit: `git add apps/web/src/components/Sidebar.tsx && git commit -m "feat(web): eAuto sidebar (nav, AI ambient, badges, role gating)"`

---

## Task 6: TopBar + user menu + notifications + mobile nav

**Files:** Modify `apps/web/src/components/TopBar.tsx`, `apps/web/src/components/Layout.tsx`; create `apps/web/src/components/MobileNav.tsx`.

- [ ] **Step 1:** Rebuild `TopBar.tsx` translating from `docs/design/shell.jsx` (Topbar + user menu). Requirements:
  - Breadcrumb: "eAuto › {screen title}" from a route→title map (derive from `NAV` labels + sub-routes).
  - Search/command trigger (opens the existing CommandPalette, ⌘K) — keep.
  - AI ambient widget: pulsing dot + "AI is handling things" + auto-handled % (static/prop for now).
  - `<NotificationsBell items={...} />` (Task 3).
  - User menu: `Avatar` + name + `ROLE_LABEL[role]` + dropdown with: Profile (→/settings), Appearance/theme toggle (calls `onToggleTheme`), **Switch role** (demo: logs in as the *other* seeded demo user via `useAuth().login(otherEmail, otherPw)`), divider, **Sign out** (`logout()`). Keep `data-testid="current-user"` (email) and `data-testid="logout"` on the sign-out control.
  - Keep the `theme`/`onToggleTheme` props from `Layout`.
- [ ] **Step 2:** Create `MobileNav.tsx` — translate the design's mobile drawer + bottom tabs (`docs/design/shell.jsx` MobileTopBar + BottomTabs). Bottom tabs = `BOTTOM_TABS` (Dashboard/Inbox/Dealers/Templates) as `<Link>`s with the inbox escalations badge; a hamburger opens the Sidebar as a drawer (scrim + slide-in). Responsive: shown < 1024px (the design's breakpoint), hidden on desktop.
- [ ] **Step 3:** Update `Layout.tsx` to: render `MobileNav` (mobile) alongside the desktop `Sidebar`; fetch + pass the badge counts — `escalations` from `GET /tickets?tab=active` (length) [Phase 3 API] and `inReview` from `GET /templates?status=PENDING` (length) via react-query hooks; keep the existing collapse + ⌘K wiring.
- [ ] **Step 4:** Build + run. Verify: topbar breadcrumb/AI widget/notifications/user menu render; switch-role logs in as the other role and the nav updates; theme toggles; at a narrow viewport the bottom tabs + drawer work; logout works.
- [ ] **Step 5:** Commit: `git add apps/web/src/components/TopBar.tsx apps/web/src/components/MobileNav.tsx apps/web/src/components/Layout.tsx && git commit -m "feat(web): eAuto topbar, user menu, notifications, mobile nav"`

---

## Task 7: Routes, login restyle, placeholders, command palette

**Files:** Modify `apps/web/src/App.tsx`, `apps/web/src/pages/Login.tsx`, `apps/web/src/components/CommandPalette.tsx`; create `apps/web/src/components/StyledPlaceholder.tsx`.

- [ ] **Step 1:** Create `StyledPlaceholder.tsx` — an on-design "screen coming soon" using the new components (`Empty`/`Card` + AIOrb), props `{ title: string; note?: string }`. Replaces `ComingSoon`.
- [ ] **Step 2:** In `App.tsx`: keep all existing paths + role guards. Swap `ComingSoon` usages to `StyledPlaceholder` with the new titles (Performance, Knowledge, etc.). Ensure routes exist for everything `NAV` points at (`/`, `/blasts`, `/inbox`, `/contacts`, `/templates`, `/reports`, `/knowledge`, `/settings`). Keep `/knowledge` + `/settings` as `requireRole="ADMIN"`.
- [ ] **Step 3:** Restyle `Login.tsx` translating from `docs/design/screen-login.jsx`: AIOrb + "WhatsApp Blaster" / "eAuto · dealer outreach control room"; email + password form (keeps real `useAuth().login`); "Forgot password?" → the info state ("Account access is managed by your team…"); a divider + **two demo buttons**:
  - "Admin" → `login('admin@example.com', 'ChangeMe123!')`
  - "Customer Support" → `login('support@example.com', 'ChangeMe123!')`
  (Hardcode the seeded demo creds; real users use the form. Match these to the Task 1 seed env defaults.)
- [ ] **Step 4:** Update `CommandPalette.tsx` command list to the new nav labels/paths (Go to Dashboard/Campaigns/Inbox/Dealers/Templates/Performance/Knowledge/Settings; actions: New campaign → /blasts/new, etc.). Keep keyboard nav + admin filtering (Knowledge/Settings admin-only).
- [ ] **Step 5:** Build + run. Verify the login screen (both demo buttons log in for real and land on the right default), placeholders render on-design, command palette navigates.
- [ ] **Step 6:** Commit: `git add apps/web/src && git commit -m "feat(web): eAuto login, routes, styled placeholders, command palette"`

---

## Task 8: E2E update + full verification

**Files:** Modify `e2e/tests/*.spec.ts`.

- [ ] **Step 1:** Update E2E assertions broken by the nav relabel. Grep `e2e/tests` for `getByRole('link', { name: ... })` and the role labels; change: `'Contacts'`→`'Dealers'`, `'Blasts'`→`'Campaigns'`, `'Reports'`→`'Performance'`, and any `'Segments'` top-nav link (Segments is now a tab under Dealers — update or remove that nav assertion, navigate via `/segments` path instead). **Keep** the testid contracts (`logout`, `current-user`, `auth-loading`, `sidebar-inbox-badge`). Where a test logs in, ensure it still uses `admin@example.com`/seeded creds.
- [ ] **Step 2:** Add a login E2E asserting the demo "Customer Support" button logs in and that Settings/Knowledge nav links are **absent** for that role (`getByRole('link', { name: 'Settings' })` → count 0), mirroring the prior operator-gating test.
- [ ] **Step 3:** Run the full verification gate:
  - `pnpm --filter web build` → clean.
  - `pnpm --filter api test` → still green (only the seed changed on the API side).
  - Start API + worker + web (per README) and run `pnpm --filter e2e test` → all specs pass.
  - Manually (or via the `run`/`verify` skill) confirm: login as Admin shows all nav; login as Customer Support hides Settings/Knowledge; theme toggles; mobile bottom tabs/drawer work.
- [ ] **Step 4:** Commit: `git add e2e && git commit -m "test(e2e): update shell assertions for the eAuto nav + roles"`

---

## Self-Review

**Spec coverage (§4, §8, §10):**
- Adopt design tokens/classes + light/dark → Task 2 ✅
- Shared components (AIOrb, Badge, icons, notifications) → Task 3 ✅
- Sidebar (eAuto nav, AI ambient, escalation/in-review badges, Settings hidden for support) → Tasks 4–5 ✅
- Topbar (breadcrumb, search, AI widget, notifications, user menu + switch-role + theme + logout) + mobile drawer/bottom tabs → Task 6 ✅
- Role relabel (Super Admin/Customer Support) + gating + demo logins (seeded support user) → Tasks 1, 4, 6, 7 ✅
- Login restyle (demo buttons, forgot-password info) → Task 7 ✅
- Routes for all eight screens + styled placeholders → Task 7 ✅
- E2E preserved/updated → Task 8 ✅

**Deferred (stated):** per-screen rewrites (Dealers/Campaigns/Inbox dual-mode/Knowledge/Performance/Dashboard/Settings bodies) — each a later phase; 0B's new nav points at the existing pages transitionally. View-only enforcement for support is per-screen (later); 0B only does nav gating. Live "auto-handled %" / dashboard metrics are static/seeded in the shell for now.

**Placeholder scan:** the integration-critical code (seed user, `roles.ts` nav model + labels + gating, demo-login creds, route guards) is exact. Visual components (Sidebar/TopBar/MobileNav/Login/AIOrb/Badge/NotificationsBell) are **translated from named in-repo design source files** with explicit behavior/prop contracts — not vague TODOs. This is the correct altitude for a UI port; verification is build + run-app + E2E.

**Consistency:** `Role` (`ADMIN`/`OPERATOR`) reused from `api/auth.ts`; `ROLE_LABEL` maps to the UI strings; nav `path`s match existing `App.tsx` routes (unchanged); demo-login creds match the Task 1 seed env defaults; testid contracts (`logout`/`current-user`/`auth-loading`/`sidebar-inbox-badge`) preserved for E2E.

---

## Next plans (not in this document)
The shell is done → per-screen phases, each dropping into the finished frame and wiring to its (already-built) backend:
- **Knowledge UI** (Library + Learned-from-escalations tabs) — backend ready (Phases 1/5).
- **Inbox dual-mode** (Auto-replied audit card from `AutopilotEvent`; Needs-Human queue from `/tickets`; agent composer) — backend ready (Phases 2/3).
- **Dealers** screen (dealer table/filters/segments), **Campaigns** (compose wizard + your state→language delivery feature + detail funnel), **Performance** analytics, **Dashboard** composite, **Settings** (Channel/Autopilot/Team/Languages).
