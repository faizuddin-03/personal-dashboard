# Frontend Re-skin Design — WhatsApp Blast System

**Date:** 2026-05-27
**Author:** Soon Zhen Yang (with Claude)
**Status:** Approved (pending spec review)

## Goal

Re-skin the `apps/web` React + Vite + Tailwind frontend to match the new design in
`docs/design/`, **without changing behavior, data flow, routes, or the E2E contract**.
This is a presentation-layer rewrite only. Backend functionality is still incomplete and
is out of scope.

## Non-negotiable constraints (the contract)

These are preserved exactly. They are enforced by the existing Playwright E2E suite
(`e2e/tests/*.spec.ts`) and must keep passing.

1. **All `data-testid` attributes** — static (~70) and dynamic. Dynamic ids in use:
   `contact-row-${id}`, `filter-ethnicity-${opt}`, `filter-gender-${opt}`,
   `filter-religion-${opt}`, `filter-occupation-${opt}`, `filter-language-${opt}`,
   `filter-optin-${opt}`, `filter-status-${s}`, `filter-category-${c}`,
   `template-group-${name}`, `status-badge-${STATUS}`, `language-tab-${lang}`,
   `variable-${n}`, `counter-sent`, `contact-ethnicity`, `contact-language`,
   `contact-optin`.
2. **Nav link names + roles** — the sidebar items for existing routes must remain
   reachable as `getByRole('link', { name })` with the **exact** visible text:
   `Dashboard`, `Contacts`, `Segments`, `Templates`, `Blasts`, `Settings`.
   (The design renames some — e.g. "Campaigns", "Inbox" — and uses `<button>`. We keep
   the functional names and the `<Link>` role for these six.)
3. **`Settings` link is absent for operators** — `getByRole('link', { name: 'Settings' })`
   must be count 0 when role !== ADMIN.
4. **Page headings the tests assert** — Dashboard exposes `data-testid="dashboard-title"`
   with text `"Dashboard"`; Blasts page has a heading `"Blasts"`
   (`getByRole('heading', { name: 'Blasts' })`).
5. **In-row affordances** — contact rows expose an `Edit` link (`getByRole('link',
   { name: 'Edit' })`); saved segment rows expose a `Delete` button and live under an
   element with a `data-testid`.
6. **Auth flow** — `AuthContext`, `ProtectedRoute` (incl. `requireRole="ADMIN"` redirect
   to `/`), `auth-loading` testid, session-resume-on-reload, and logout-clears-session
   all unchanged.
7. **API + state** — `src/api/*` clients and **all React Query keys** unchanged
   (e.g. `['contacts', search, filter, page]`, `['templates', ...]`, etc.).
8. **Route paths** — every path in `App.tsx` unchanged.

### The one intentional test edit (approved)

The two filter-chip assertions couple to a literal Tailwind class that the green re-skin
removes:

- `e2e/tests/contacts.spec.ts:62` and `e2e/tests/templates.spec.ts:54`:
  `toHaveClass(/bg-indigo-600/)`.

**Resolution:** the active filter chip will set `aria-pressed={isSelected}` (a stable,
styling-agnostic, accessibility-correct signal). The two assertions change to
`toHaveAttribute('aria-pressed', 'true')`. This is the only sanctioned change to the test
suite.

## Styling architecture: Tailwind + CSS-variable tokens

Decision: **keep Tailwind** as the authoring system; carry the design's tokens via CSS
variables (the shadcn/ui pattern). This gives 1:1 token fidelity and near-free light/dark
theming without `dark:` duplication.

- **`apps/web/src/index.css`**
  - Keep `@tailwind base; @tailwind components; @tailwind utilities;`.
  - Add the design's token block from `docs/design/styles.css` almost verbatim: the WA
    green ramp, grays, semantic vars (`--bg`, `--bg-subtle`, `--border`, `--text`,
    `--text-muted`, `--accent`, …), radii, `--sidebar-w`, `--topbar-h`, fonts,
    `--shadow-focus`, and the full `html[data-theme="dark"]` override block.
  - Load **Inter** and **JetBrains Mono** (via `@fontsource/*` deps, or a `<link>` in
    `index.html` — implementer's choice; `@fontsource` preferred for offline/E2E).
  - A small `@layer components` block for the genuinely fiddly widgets that are awkward as
    pure utilities: sidebar nav item + active indicator bar, the ⌘K command palette,
    the right-side `Sheet`/drawer slide, and the conic-gradient progress/ring bits.
- **`apps/web/tailwind.config.js`**
  - `darkMode: ['selector', 'html[data-theme="dark"]']`.
  - `theme.extend.colors` maps semantic names to the CSS vars:
    `accent: 'var(--accent)'`, `surface: 'var(--bg)'`, `subtle: 'var(--bg-subtle)'`,
    `border: 'var(--border)'`, `text: { DEFAULT: 'var(--text)', muted:
    'var(--text-muted)', subtle: 'var(--text-subtle)' }`, and the `green`/`red`/`amber`/
    `blue` ramps. Also extend `borderRadius`, `fontFamily`, and `ringColor`.
  - Net effect: components author as `bg-accent text-text-muted border-border rounded-lg`,
    and dark mode is a single `data-theme` flip on `<html>`.

## Component library — `apps/web/src/components/ui/`

Typed React ports of the design primitives actually needed (from `docs/design/ui.jsx`):

`Button`, `IconButton`, `Pill`, `StatusPill`, `Avatar`, `Card`, `PageHead`, `Tabs`,
`Switch`, `Checkbox`, `Stat`, `Progress`, `Empty`, `Skeleton`, and a typed `icons.tsx`
(port of `docs/design/icons.jsx`, only the icons used).

- Each is a small, focused, well-typed component with a clear prop interface.
- Existing `Modal.tsx` and `Toast.tsx` are **restyled** (keep `modal-backdrop` testid),
  not replaced, to minimize churn.
- `StatusPill` centralizes the status → tone/label mapping for templates and blasts; it
  must still render the `status-badge-${STATUS}` testid where the existing
  `TemplateStatusBadge`/`BlastStatusBadge` do.

## Shell — `Layout.tsx` → Sidebar + TopBar

Ports `docs/design/shell.jsx` into typed React, wired to the real router and auth.

- **Sidebar**: grouped nav (Workspace / Admin / Help), collapsible (CSS-driven, persisted
  to `localStorage`). Brand wordmark "Blaster" (cosmetic; not tested).
- **Existing routes render as `<Link>`** with exact names (constraint #2). The design's
  "Campaigns" item is kept labeled **Blasts** and points at `/blasts`.
- **Admin-only nav** (`Settings` + the new admin placeholders) renders **only for
  admins** — same rule as today's Settings link — guaranteeing constraint #3. (The
  design's "locked" affordance for operators is a possible later enhancement, deliberately
  skipped now to keep zero test risk.)
- **TopBar**: breadcrumbs + search trigger + user menu. Keeps `current-user` and `logout`
  testids; logout calls `useAuth().logout()` then navigates to `/login`.
- **Theme toggle**: light/dark by setting `data-theme` on `<html>`, persisted to
  `localStorage`; respects `prefers-color-scheme` on first load.
- **⌘K command palette** (approved, scoped): navigation + primary actions only
  (Go to Contacts, New campaign/blast, Import contacts, Create segment, etc.). Entity
  search (contacts/campaigns/templates) is **deferred** — a `// TODO: wire to backend
  search` stub — until the backend search endpoint exists.

## Routing & placeholders — `App.tsx`

- All existing routes unchanged (paths, elements, `ProtectedRoute` wrapping, the
  `requireRole="ADMIN"` on `/settings`).
- Add `ProtectedRoute`-wrapped **placeholder** routes for unbuilt design nav, each
  rendering a styled "Coming soon" `Empty` page:
  - Workspace/Help placeholders: `/inbox`, `/reports`, `/workflows`, `/helpline`,
    `/status`.
  - Admin placeholders (`requireRole="ADMIN"`): `/knowledge`, `/users`, `/audit`.
- A single reusable `ComingSoon` placeholder component (title from route meta).

## Page-by-page mapping (existing route ← design screen)

| Route | Component | Design source | Notes |
|---|---|---|---|
| `/login` | `Login` | `login.html` | keep `email`/`password`/`submit`/`login-error` |
| `/` | `Dashboard` | `overview.jsx` | `dashboard-title` text stays **"Dashboard"** |
| `/contacts` | `Contacts` | `contacts.jsx` | toolbar + table; FilterBuilder → design filter pills |
| `/contacts/new`, `/:id` | `ContactForm` | form patterns | Card + fields; keep all `contact-*` testids |
| `/contacts/import` | `ContactsImport` | `import-wizard.jsx` | keep `csv-file`/`csv-submit`/`import-*` |
| `/segments` | `Segments` | `segments.jsx` + `segment-builder.jsx` | rule-builder styling; keep `segment-*` + Delete button |
| `/templates` | `Templates` | `templates.jsx` | keep `template-group-${name}`, status filter chips |
| `/templates/new`, `/:name` | `TemplateForm` | template detail/form | language tabs, variants; keep all testids |
| `/blasts` | `Blasts` | `campaigns.jsx` | heading text stays **"Blasts"** |
| `/blasts/new` | `BlastWizard` | `campaign-new` | keep `blast-*` testids incl. `variable-${n}` |
| `/blasts/:id` | `BlastDetail` | `campaign-detail.jsx` | keep `blast-counters`/`counter-sent`/`progress-bar` |
| `/settings` | `Settings` | `settings.jsx` + `users.jsx` | keep `users-table`, add-user + reset-password forms |

## Explicitly out of scope

- Any backend / API changes.
- Real data for the new placeholder screens.
- Command-palette entity search (deferred to backend search).
- New features beyond the design's visual system (no new business logic).

## Verification

1. `pnpm --filter web build` (i.e. `tsc && vite build`) passes with no type errors.
2. Full Playwright E2E suite (`e2e/tests/*`) passes, with the **only** diff being the two
   `aria-pressed` assertion edits in #7.
3. Manual smoke in both light and dark themes across all re-skinned pages.

## File-level change summary

**Add**
- `apps/web/src/components/ui/*` (primitives + `icons.tsx`)
- `apps/web/src/components/Sidebar.tsx`, `TopBar.tsx`, `CommandPalette.tsx`,
  `ComingSoon.tsx` (or co-located under `Layout`)
- token additions in `apps/web/src/index.css`

**Modify**
- `apps/web/tailwind.config.js` (tokens, darkMode, theme.extend)
- `apps/web/src/components/Layout.tsx` (sidebar+topbar shell)
- `apps/web/src/App.tsx` (placeholder routes only)
- every page in `apps/web/src/pages/*` (JSX re-skin; logic/testids/query keys unchanged)
- `apps/web/src/components/{FilterBuilder,Pagination,Modal,Toast,TemplateStatusBadge,BlastStatusBadge}.tsx`
  (restyle; FilterBuilder gains `aria-pressed`)
- `e2e/tests/contacts.spec.ts`, `e2e/tests/templates.spec.ts` (the two `aria-pressed`
  assertion edits — the only test changes)

**Unchanged**
- `apps/web/src/api/*`, `apps/web/src/auth/*`, all React Query keys, all route paths.
</content>
</invoke>
