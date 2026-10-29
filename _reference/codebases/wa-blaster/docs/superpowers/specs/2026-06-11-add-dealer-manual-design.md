# Add Dealer Manually — Design

**Date:** 2026-06-11
**Status:** Approved (brainstormed with ZY)

## Problem

The Dealers page (`/contacts` route → `apps/web/src/pages/Dealers.tsx`) is read-only: dealers arrive via core-system sync or CSV import, and there is no way to add one by hand. The legacy `/contacts/new` form (`ContactForm.tsx`) predates the dealer pivot — it captures B2C demographics (gender/ethnicity/religion) and none of the dealer fields. The API's `POST /contacts` works but `CreateContactDto` does not accept dealer fields (`tier`, `vehicleSpecialization`, `picName`, `picRole`, `numberType`), even though the Prisma `Contact` model has all the columns with defaults.

## Decision summary

| Decision | Choice |
|---|---|
| Form scope | Core dealer profile: dealership name, phone, number type, state, language, opt-in status, tier, vehicle specialization, PIC name, PIC role. No synced metrics (credits, subscription, transfers, lifetime spend). |
| UI placement | Modal on the Dealers page (existing `apps/web/src/components/Modal.tsx`), opened by an "Add dealer" header button. |
| API shape | Extend the existing `POST /contacts` endpoint — new optional, validated fields on `CreateContactDto`. No new endpoint, no migration. |
| Permissions | ADMIN only. OPERATOR keeps the existing "View-only" treatment (button hidden). |

## Backend changes (`apps/api`)

**`src/contacts/dto/create-contact.dto.ts`** — add optional validated fields:

- `numberType?: NumberType` (`@IsEnum(NumberType)`)
- `tier?: DealerTier` (`@IsEnum(DealerTier)`)
- `vehicleSpecialization?: VehicleSpecialization` (`@IsEnum(VehicleSpecialization)`)
- `picName?: string` (`@IsString() @MaxLength(120)`)
- `picRole?: PicRole` (`@IsEnum(PicRole)`)

All enums already exist in `@prisma/client` (`NumberType`: PHONE | LANE; `DealerTier`: BRONZE | SILVER | GOLD; `VehicleSpecialization`: 7 values; `PicRole`: OWNER | SALES_MANAGER | ADMIN).

**`src/contacts/contacts.service.ts` `create()`** — pass the five new fields through to `prisma.contact.create`. Existing behavior unchanged: phone normalized via `normalizePhoneE164`, duplicate phone → 409 `ConflictException`, `optInStatus` defaults to `PENDING`, `optInSource` defaults to `manual:<actorUserId>`. Omitted dealer fields fall back to schema defaults (`numberType` → `PHONE`; others null).

**Not changed:** `UpdateContactDto` (hand-written, not a PartialType; editing dealers is out of scope), CSV import, list filters (already filter on these columns).

## Frontend changes (`apps/web`)

**`src/api/contacts.ts`** — extend `CreateContactInput` with the same five optional fields (types already exist in the file).

**New component `src/components/AddDealerModal.tsx`** — form inside the existing `Modal`:

- Fields: dealership name (required), phone (required, free text — server normalizes), number type (segmented Phone/Lane, default Phone), state (select, `ALL_STATES`), language (EN/MS/ZH), opt-in status (Pending default / Opted in / Opted out), tier (select, optional), vehicle specialization (select, optional), PIC name (text, optional), PIC role (select, optional).
- Submit button disabled until name + phone are non-empty and while the mutation is pending.
- `useMutation(createContact)`; on success: invalidate `['contacts']`, toast `Dealer "<name>" added`, reset + close. On error: inline error inside the modal (red text under the actions) via the page's `extractMessage` pattern — NOT a toast. Modal stays open so the user can fix the phone (covers 409 duplicate and validation messages).
- Test ids: `add-dealer-name`, `add-dealer-phone`, `add-dealer-submit`, `add-dealer-error`, plus selects keyed `add-dealer-<field>`.

**`src/pages/Dealers.tsx`** — "Add dealer" primary button (testid `add-dealer`) in the page header area, rendered only when `!isOperator`; opens the modal. Table refreshes automatically via the query invalidation (the page already keys queries as `['contacts', queryParams]` — invalidation by `['contacts']` prefix catches it).

## Error handling

- Duplicate phone: API 409 → inline modal error ("Contact with that phone already exists").
- Invalid phone: `normalizePhoneE164` throws → 400 with message → inline modal error.
- Field validation (lengths/enums) enforced by class-validator server-side; the form constrains inputs client-side via selects so these errors should not occur in practice.

## Testing

- **API unit tests** (`apps/api/src/contacts/__tests__/contacts.controller.spec.ts` pattern): create with dealer fields persists them; create without dealer fields still works (regression).
- **E2E** (`e2e/tests/dealers-add.spec.ts`): admin logs in → Dealers → Add dealer → fills name/phone/tier/specialization → submits → modal closes, row appears with tier badge and specialization; second attempt with same phone shows inline duplicate error. Uses `E2E_BASE_URL` override added on this branch.

## Out of scope

- Editing or deleting dealers from the Dealers page.
- The legacy `/contacts/new` B2C form and its route (left untouched).
- Synced-metrics fields: `historyCheckCredits`, `subscriptionStatus`, `transfers30d`, `lifetimeSpend`, `joinedAt`, `lastSeenAt`.
- OPERATOR add permissions.
- Distinguishing manually-added dealers from synced ones in the UI (the sync banner copy stays as-is).
