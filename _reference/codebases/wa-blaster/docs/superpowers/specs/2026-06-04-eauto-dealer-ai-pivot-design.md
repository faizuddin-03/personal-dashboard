# eAuto Dealer + AI Pivot — Migration Design Spec

**Date:** 2026-06-04
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft — awaiting spec review
**Context:** Hackathon (days). Migrating `apps/web` + `apps/api` to the new design in `docs/design/`.
**Supersedes (partially):** `2026-05-27-frontend-reskin-design.md` (that reskin preserved the B2C demographic product + its E2E contract; this pivot changes the product).
**Protects:** `2026-06-02-state-language-blast-design.md` — the state→language delivery feature is carried forward, restyled, and explicitly must-keep.

---

## 1. Purpose

The downloaded design in `docs/design/` is **not a reskin of the current product — it is a different product**. The current build is a B2C demographic WhatsApp blaster (contacts have ethnicity/religion/gender/occupation/age; targeting is demographic). The new design is **"eAuto" — a B2B used-car-dealer outreach + AI customer-support console**.

This spec plans the migration to that product for a hackathon demo, where **all four new AI/ops pillars must genuinely work** (not be mocked):

1. **AI Autopilot** — inbound dealer messages get an AI auto-reply grounded in a knowledge base, with confidence-based routing; low-confidence/sensitive messages escalate to humans.
2. **Escalation / ticketing** — escalated chats become assignable tickets (assign → resolve → close) in a "Needs Human" queue.
3. **Knowledge base + learning loop** — KB grounds the bot; resolved tickets can be saved back into the KB ("learned from escalations"), closing the loop.
4. **AI template generation** — describe → AI drafts per-language template options → submit to Meta; rejected templates regenerate with the failure reason.

Plus a **Performance** analytics screen and a restyled **Dashboard / Settings / Campaigns / Dealers / Templates / Inbox**.

### Decisions taken into this spec (from brainstorming)
- **Scope:** Full pivot to the eAuto dealer + AI product (not a reskin).
- **Timeline:** Hackathon — days. Optimize for a working demo; protect the AI loop above all.
- **All four pillars must really work.**
- **Frontend:** Port the design into the **existing Vite + React + TS app** (reuse routing, auth, react-query, API clients). Do not ship the standalone prototype.
- **LLM:** Behind a **swappable `LlmService`** (provider TBD; mock impl so the demo runs offline).
- **Demographics:** Drop person-demographics (ethnicity/religion/gender/occupation/age). The targeting that matters — **state→language delivery (the `feat/state-language-blast` feature)** — is preserved and restyled. Audience targeting is on **dealer firmographics** (state, specialization, tier, subscription, language).

---

## 2. Scope

### In scope
- Dealer data model (evolve `Contact` → dealer attributes; seed dealer base).
- Frontend shell port: styles/tokens, Sidebar (AI ambient presence), Topbar, command palette, mobile drawer + bottom tabs, theme, login restyle.
- All eight screens restyled to the design: Dashboard, Campaigns, Inbox (dual-mode), Dealers, Templates, Performance, Knowledge, Settings.
- The four pillars (working): Autopilot bot, ticketing, KB + learning loop, AI template generation.
- **State→language delivery** carried forward and restyled (Settings "Languages" tab + campaign wizard "Language delivery" block). **Must-keep.**
- Role remap: ADMIN→"Super Admin", OPERATOR→"Customer Support" (UI relabel + RBAC change; enum unchanged).
- Performance analytics (real aggregation where cheap; seeded where not).

### Out of scope (deferred / cut-first under deadline)
- Person-demographic fields and their filters/segments (removed from UI; columns may remain nullable in DB to avoid a destructive migration).
- Embedding-based retrieval (start with keyword retrieval; upgrade only if time).
- Multi-tenancy, email infra, OAuth/SSO, mobile app.
- A/B testing; multi-channel (SMS/email).
- Full audit-log backend (Settings audit log may be seed-only for the demo).
- CSV import / bulk export polish (re-point columns only if time).
- The Reports/Workflows/Helpline/Status "coming soon" stubs (replaced or dropped).

---

## 3. Strategy — seeded shell first, then vertical pillar slices (Approach A)

Horizontal layering (all models → all services → all UI) is fatal for a hackathon because nothing is demoable until the end. Instead:

**Phase 0 makes the whole app *look* like the design with seeded data immediately** (ported shell + `styles.css` + dealer model + seed). From then on, each pillar is wired **end-to-end (model → API → UI) one at a time**, flipping a seeded mock into a real feature. There is always a working demo; each slice only improves it.

### Dependency-ordered phases

```
Phase 0  FOUNDATION ─ shell + styles + Dealer model + seed + role remap + LlmService
              │
   ┌──────────┼──────────────────────────────────┐
   ▼          ▼                                    ▼
Phase 1     Phase 4 (parallel-able)           Phase 6 (parallel-able)
KNOWLEDGE   AI TEMPLATE GENERATION            CAMPAIGNS (reskin Blasts +
BASE        (LlmService → existing Meta flow)  dealer audience + language delivery)
   │
   ▼
Phase 2  AI AUTOPILOT BOT  (inbound → KB-grounded reply, confidence, escalate)
   │
   ▼
Phase 3  ESCALATION / TICKETING  (Needs-Human queue, assign→resolve→close)
   │
   ▼
Phase 5  LEARNING LOOP  (resolved ticket → KB candidate → publish)

Phase 7  PERFORMANCE analytics    ┐ surrounding shell — built once data exists
Phase 8  DASHBOARD (composite)    ┤
Phase 9  SETTINGS (channel / autopilot config / team & roles / Languages)
```

**Crown-jewel demo path: 0 → 1 → 2 → 3 → 5** (the closed AI loop). Templates-AI (4) and Campaigns (6) are independent and can be slotted in parallel. Performance/Dashboard/Settings (7–9) are the framing. Once Phase 0 is frozen, pillars may be fanned out across parallel workstreams to compress wall-clock.

---

## 4. Architecture

### Frontend
- **Port into `apps/web`** (Vite + React + TS + React Router + react-query). Reuse `AuthContext`, `ProtectedRoute`, API clients.
- **Adopt the design's `docs/design/styles.css` as the token + component-class source of truth** (`.chip`, `.v-card`, `.v-input`, `.v-label`, `.btn`, `.badge`, brand-soft surfaces, `--ink/--surface/--brand/--line` variables, `data-theme` light/dark). Tailwind stays for layout utilities. Porting a screen = translating its `docs/design/screen-*.jsx` into a TS component reusing these classes — fastest path to pixel fidelity.
- Shared components to build first: `AIOrb`, `Badge`/`Pill` (tones: brand/success/human/neutral/blue/red), status badges, confidence ring, `Modal`/drawer, `SchedulePicker` (Aurora), toasts.

### Backend (NestJS + Prisma + BullMQ + Redis + Postgres)
- **Reuse as-is:** auth/JWT, WhatsApp Cloud API send, webhook ingestion, BullMQ blast worker, rate limiter, template Meta-approval flow, segments engine, **state→language plan + preview**, inbox 24h-window logic.
- **New modules:** `knowledge`, `autopilot` (bot orchestration), `tickets`, `llm` (provider abstraction). Extend `inbox`, `templates`, `blasts`.
- **`LlmService` abstraction** (`apps/api/src/llm/`): interface with `generateReply()`, `generateTemplateDrafts()`, `classifyIntent()`. Implementations: `MockLlmService` (deterministic, default when no key — keeps demo offline-safe) and a real provider selected by env. All AI features depend only on the interface, so the provider is swappable.

### Data flow — Autopilot (Phase 2)
1. Meta webhook delivers an inbound dealer message (existing path → `InboundMessage`).
2. `AutopilotService` (if enabled) classifies **intent** + retrieves top KB docs (`KnowledgeService.retrieve`).
3. `LlmService.generateReply({ message, intent, kbDocs, dealerContext })` returns `{ text, confidence }`.
4. **Guardrails:** sensitive intents (billing/account) and complaints never auto-send.
5. If `confidence ≥ threshold` and not guarded → auto-send via WhatsApp Cloud API; record outbound `Message` with bot-audit fields (confidence, intent, matchedKbDocId, model, autoSent=true).
6. Else → create a `Ticket` (reason = low_confidence / knowledge_gap / sensitive / complaint) in the Needs-Human queue; fire a notification.

---

## 5. Data model changes

### Evolve `Contact` → Dealer (Phase 0)
Add fields: `picName`, `picRole` (OWNER|SALES_MANAGER|ADMIN), `numberType` (PHONE|LANE), `tier` (BRONZE|SILVER|GOLD), `subscriptionStatus` (ACTIVE|EXPIRING|LAPSED), `vehicleSpecialization` (NATIONAL|CONTINENTAL_LUXURY|SUV_MPV|COMMERCIAL_PICKUP|EV_HYBRID|MOTORCYCLE|MULTI_BRAND), `historyCheckCredits` (int), `transfers30d` (int), `lifetimeSpend` (decimal), `joinedAt`, `lastSeenAt`.
Keep: `phoneE164`, `name` (dealership name), `optInStatus`, `state`, `languagePreference` (EN/MS/ZH; TA/OTHER still valid in mapping). Demographic columns left nullable, unused.

### New models
- **`KnowledgeDoc`** (Phase 1): `id`, `slug` (e.g. `ownership_transfer.md`), `question`, `answer`, `category`, `source` (SYNCED|FROM_ESCALATION), `status` (PUBLISHED|CANDIDATE|DISMISSED), `uses` (int), `ticketId?`, `createdAt`, `updatedAt`. (Candidates = `status=CANDIDATE`; publishing flips to PUBLISHED.)
- **`Ticket`** (Phase 3): `id`, `num` (TCK-####), `contactId`, `status` (OPEN|IN_PROGRESS|RESOLVED|CLOSED), `reason` (COMPLAINT|LOW_CONFIDENCE|KNOWLEDGE_GAP|SENSITIVE), `intent`, `assigneeId?`, `openedAt`, `resolvedAt?`, `closedAt?`, linked `kbDocIds`. Timeline derived from status timestamps + messages.
- **Bot-audit fields** on outbound `Message` (Phase 2): `autoSent` (bool), `botConfidence?`, `botIntent?`, `matchedKbDocId?`, `botModel?`.

### Extend `Blast` → Campaign (Phase 6)
- Add `PAUSED` to `BlastStatus`; add `pausedAt?`. UI label "Campaign". Audience resolves from dealer firmographic filter (state + specialization + tier + subscription) or a saved segment. **Language mode (PREFERENCE/STATE) and the state→language plan are unchanged** — reused verbatim.

### Settings (SystemSetting keys, Phase 9)
`autopilot_enabled`, `autopilot_escalation_threshold` (default 70), `autopilot_honour_stop` (bool), `autopilot_after_hours` (AWAY_THEN_ESCALATE | ESCALATE_ONLY). State→language mapping stays in `StateLanguageMapping` (unchanged).

---

## 6. Function backlog (gap inventory) — what we build, by phase

Status key: **✅ reuse** · **🔧 adapt** · **🆕 new**

**Phase 0 — Foundation:** 🔧 Dealer model + 🆕 seed (~21 dealers) · 🔧 role remap (Super Admin/Support + RBAC) · 🆕 `LlmService` (+ mock) · 🆕 shell port (styles.css, Sidebar w/ AI ambient + badges, Topbar w/ AI widget + notifications + user menu, command palette, mobile drawer + bottom tabs, theme) · 🆕 login restyle (demo role buttons, forgot-password info) · 🆕 shared design components.

**Phase 1 — Knowledge Base:** 🆕 `KnowledgeDoc` model + CRUD API · 🆕 retrieval function · 🆕 Library tab UI (source/category filters, search, edit, re-index) · 🆕 seed 8 docs · 🔒 Super-Admin gate.

**Phase 2 — Autopilot bot:** 🔧 route inbound into bot · 🆕 intent detection · 🆕 KB-grounded reply + confidence · 🆕 confidence routing + guardrails · 🆕 auto-send + bot-audit record · 🆕 STOP/BERHENTI opt-out + after-hours.

**Phase 3 — Ticketing:** 🆕 `Ticket` model + lifecycle API (create on escalation, assign, resolve, close, reopen) · 🆕 Inbox dual-mode UI (Auto-replied audit + Needs-Human queue, ticket detail, escalation divider, agent composer w/ saved replies + ⌘/ctrl+Enter + j/k) · 🆕 dealer context panel · 🔧 reuse 24h window + free-form send · 🆕 escalation badges/counts everywhere.

**Phase 4 — AI template generation:** 🆕 3-step wizard (Describe → Pick draft → Review) · 🆕 LLM endpoint (per-language drafts + category + approval-likelihood + variables) · 🔧 feed into existing create + Meta-submit · 🆕 rejection→regenerate flow · 🆕 Templates screen restyle (family cards, language sub-tabs w/ status dots, detail drawer, Sync with Meta, AI badge).

**Phase 5 — Learning loop:** 🆕 save-to-KB modal on resolve/close · 🆕 candidate queue API + "Learned from escalations" tab (review/edit/publish/dismiss, trending, stats) · 🔁 published candidates feed the bot.

**Phase 6 — Campaigns:** 🔧 Blast→Campaign (PAUSED + pause/resume) · 🔧 dealer audience filters (state + specialization + tier + subscription) + compliance banner + estimated audience + blast-eligibility (exclude LANE) · 🆕 3-step compose wizard restyle + `SchedulePicker` + animated send · 🆕 **Language-delivery block (state→language; see §7)** · 🆕 campaign detail (KPI strip, delivery funnel, recipients table, timeline) · 🆕 campaign card list + per-card menu · 🔧 Dealers screen (table, filters, sync banner, bulk actions, export, segments tab) + 🔧 prebuilt segments on dealer attributes.

**Phase 7 — Performance:** 🆕 aggregation endpoints (7/30/90d: funnel, auto-handle trend, response time vs target, dealers by state, specialization mix, top templates, delivery by state & vehicle, escalation resolution + closed-by-reason + stats) · 🆕 charts + range selector + export. *(Cut: seed a subset if time-tight.)*

**Phase 8 — Dashboard:** 🆕 AI status hero, escalation banner, KPI cards w/ sparklines, volume + reply-handling charts, Needs-Your-Attention list, top intents, AI activity feed, quick actions, active-campaigns widget; role-aware.

**Phase 9 — Settings:** 🔧 Channel tab (WABA status) · 🆕 Autopilot tab (toggle, threshold slider, honour-STOP, after-hours, live status) · 🆕 Team & Roles tab (explainer cards, members table, invite, audit log — seed-only ok) · 🆕 **Languages tab (state→language mapping; see §7)**.

**Cross-cutting:** 🆕 notifications bell + seed · 🔧 command palette entries · ✅ reuse auth/send/webhook/worker/rate-limiter/CSV.

---

## 7. Language delivery (state→language) — PROTECTED feature, restyled

Carry the `feat/state-language-blast` behavior forward unchanged on the backend; restyle the two UI homes into the new design language.

**Backend (reuse verbatim):** `POST /blasts/preview-state-languages` → `{ uniqueContacts, totalMessages, byLanguage, byState[], gaps[] }`; `BlastLanguageMode = PREFERENCE | STATE`; `buildStateLanguagePlan`; `StateLanguageMapping` CRUD. The only change is that the campaign audience comes from dealer firmographics instead of demographic segments.

### 7a. Settings → "Languages" tab (Super Admin only)
Restyle of `StateLanguageMappingCard`: a table of Malaysian states → editable language chips (`.chip` multi-select in edit mode; `Badge`/`Pill` when displayed; "— Default (EN)" when unmapped). Languages offered: EN/MS/ZH (TA/OTHER still selectable).

### 7b. Campaign wizard → Step 2 (Template) "Language delivery" block
**Structural change:** the template grid selects a template **family** (showing its approved language badges), not a single version. After selection, a "Language delivery" block appears:
- Segmented `.chip` toggle: **Dealer preference** | **By dealer state**.
  - *Dealer preference*: each dealer gets the variant for their own `languagePreference`; no match → fall back to a chosen default language.
  - *By dealer state*: each dealer gets a message in **every language mapped to their state** (fan-out → messages > dealers).
- When *By dealer state*: a coverage card shows **"{totalMessages} messages to {uniqueDealers} dealers"** (the messages-vs-dealers distinction), a **By language** pill row, and a **By state** list (`state · N dealers · langs`).
- **Gap blocker:** if a mapped language has no approved variant in the family, a red alert card lists the gap ("MS required by Johor, Melaka — no approved MS version") and disables Continue. **Upgrade:** the card offers **"✨ Generate {lang} with AI"** → hooks into Phase 4 (gap → AI draft → submit → gap clears). Demo highlight.

### 7c. Step 3 (Review)
Summary adds a **Language** row (`By dealer state · 3 languages (EN, MS, ZH)`) and a dual **Recipients** count (`612 dealers · 840 messages`).

---

## 8. Roles & RBAC

Keep `UserRole { ADMIN, OPERATOR }` in DB (no migration). Relabel and re-gate in UI:
- **ADMIN → "Super Admin":** full access (campaigns, templates + AI gen, dealers, knowledge, settings, team, languages).
- **OPERATOR → "Customer Support":** **Inbox** (work/resolve/close tickets + auto-replied audit) and **Knowledge** (edit answers, publish learned). Every other screen is **view-only**; **Settings & Team hidden**.

Preserve the existing `ProtectedRoute requireRole="ADMIN"` redirect pattern; add view-only modes to the dealer/campaign/template/performance screens for Support.

---

## 9. Testing strategy

- **Backend (TDD, Jest):** unit-test the new pure logic first — KB retrieval ranking, autopilot routing/guardrails (confidence threshold, sensitive-intent block), ticket state transitions, template-draft mapping. Mock `LlmService` for determinism. Reuse existing `buildStateLanguagePlan` tests.
- **E2E (Playwright):** the prior demographic E2E contract is **superseded** by the pivot and will be rewritten for the dealer model. **Keep/adapt the state→language scenarios** (`feat/state-language-blast`). Add scenarios: KB CRUD + publish-from-escalation, autopilot auto-reply + escalation, ticket assign→resolve→close, AI template generate→submit, campaign language-delivery preview + gap blocker.
- **LLM offline-safety:** default `MockLlmService` so the demo and CI run without a key.

---

## 10. Deep-dive — Phase 0: Foundation

**Goal:** the app opens looking like the design, populated with seeded dealer data, with working nav/roles/theme — before any pillar logic exists.

**Backend tasks**
1. Prisma migration: add dealer fields + enums (`DealerTier`, `SubscriptionStatus`, `VehicleSpecialization`, `NumberType`, `PicRole`) to `Contact`; leave demographic columns nullable. Add `PAUSED` to `BlastStatus` now (cheap) to avoid a later migration.
2. `apps/api/src/llm/`: `LlmService` interface + `MockLlmService` (deterministic canned replies/drafts) + provider selection by env (`LLM_PROVIDER`, falls back to mock). Wire into a NestJS module.
3. Seed script: ~21 dealers from `docs/design/data.jsx` (name, pic, picRole, numberType, phone, state, vehicle, lang, optIn, tier, sub, credits, transfers, spend, joined, lastSeen). Keep the existing admin/support user seed; relabel roles.

**Frontend tasks**
4. Import `styles.css` tokens + classes into `apps/web`; verify light/dark via `data-theme`.
5. Build shared components: `AIOrb`, `Badge`/`Pill`, status/tier/subscription badges, `Modal`/drawer, toasts, `SchedulePicker`.
6. Port the **shell**: Sidebar (nav: Dashboard, Campaigns, Inbox, Dealers, Templates, Performance, Knowledge, Settings; AI ambient presence; escalation + in-review badges; Settings hidden for Support), Topbar (breadcrumb, contextual search, AI widget, notifications bell + seed, user menu + switch-role + logout), mobile drawer + bottom tabs.
7. Restyle **Login** (demo Admin/Support buttons, forgot-password info state).
8. Wire routes for all eight screens; screens not yet built render a seeded, styled placeholder (so nav works demo-day-one).

**Done when:** logging in as Admin vs Support shows the correct nav/permissions; theme toggles; dealers seed is queryable via the existing contacts API; `LlmService` returns mock output; the shell matches the design.

---

## 11. Deep-dive — Phase 1: Knowledge Base

**Goal:** a working KB that (a) Super Admins manage and (b) the bot will ground on in Phase 2.

**Backend tasks**
1. `KnowledgeDoc` model + migration (fields per §5).
2. `apps/api/src/knowledge/`:
   - `GET /knowledge` (filter: `source`, `category`, `q`; published only by default).
   - `POST /knowledge`, `PATCH /knowledge/:id`, `DELETE /knowledge/:id`.
   - `GET /knowledge/candidates` (status=CANDIDATE), `POST /knowledge/:id/publish`, `POST /knowledge/:id/dismiss` (Phase 5 consumes these; endpoints land now).
   - `POST /knowledge/:id/reindex` (no-op for keyword retrieval; placeholder for future embeddings).
3. **Retrieval function** `KnowledgeService.retrieve(query, { intent?, limit })`: keyword/overlap scoring across `question + answer + category` (normalize, token-overlap + category/intent boost), returns ranked `{ doc, score }`. Unit-tested. This is the seam Phase 2 calls.
4. Seed 8 published docs from `docs/design/data.jsx` (ownership_transfer, credits_pricing, history_check, roadtax_renewal, insurance_guide, subscription_plans, compliance_jpj, portal_how_to) with `uses` counts.
5. RBAC: all knowledge routes Super-Admin only.

**Frontend tasks**
6. `api/knowledge.ts` client + react-query hooks.
7. Knowledge screen, **Library** tab: cards (icon by source, question bold, answer, doc/category/source/uses badges), source filter (All/Synced/From escalation), category filter, search, Edit modal, Re-index button. "Learned from escalations" tab renders an empty-state placeholder until Phase 5.
8. Support role sees the "Admin only" empty state.

**Done when:** Admin can CRUD KB docs and search them; `retrieve()` returns sensible ranked docs for a query (unit-tested); Support is blocked; seed visible.

---

## 12. Risks & hackathon cuts (pre-approved)
- **Protect the AI loop (1→2→3→5).** Everything else yields to it.
- **Performance (7)** is the easiest to partially-seed; **Settings audit log (9)** can be seed-only.
- **Retrieval** starts keyword-only; embeddings only if time.
- **CSV import / bulk export / deep mobile polish** cut first.
- **LLM rate/cost:** mock by default; real provider gated behind env + prompt caching on KB context when wired.

---

## 13. Open questions / deferred decisions
- LLM provider + key (deferred; mock until chosen). Model tiers TBD when chosen.
- Whether Support should see Performance at all (currently: view-only) — confirm at Phase 7.
- Ticket `num` generation scheme (sequential vs prefixed counter) — decide at Phase 3.
- Implementation branch name (suggest `feat/eauto-dealer-ai-pivot` off `master`).

---

## Appendix A — Decisions log
- **Product:** Embrace eAuto dealer + AI as the real pitch (not a visual reference).
- **Timeline:** Hackathon (days).
- **Pillars:** All four must work.
- **Frontend:** Port design into existing Vite/TS app.
- **LLM:** Swappable service, provider TBD, mock default.
- **Demographics:** Drop person-demographics; preserve state→language delivery (`feat/state-language-blast`) — must-keep. Audience targeting = dealer firmographics.
- **Sequencing:** Approach A (seeded shell → vertical pillar slices in dependency order); parallelize after Phase 0 freeze.
- **Spec depth:** Full migration spec + deep-dive Phase 0 & 1 (this document).
- **Language-delivery UI design:** approved (Settings "Languages" tab + wizard Step-2 "Language delivery" block with messages-vs-dealers preview, gap blocker upgraded with "Generate with AI").
