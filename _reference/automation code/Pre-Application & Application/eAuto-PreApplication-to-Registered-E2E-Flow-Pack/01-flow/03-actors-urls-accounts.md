# Actors, URLs and the role model

## The three actors

| Actor | Surface | Login | What they do in the flow |
| --- | --- | --- | --- |
| **Dealer** | public UCD — `staging.eauto.my/obs/...` | none (a link + a session) | pre-app form, both payments, application form, registration documents |
| **BO approver** | `staging.eauto.my/cs04` → Onboarding menus | `ops_jasons` (Jason Seah) | approves the pre-application, **assigns**, approves the application |
| **BO assignee** | same | `hubadmin_bochar` (CHARMAIN EA CHIANG chg) | sets UCD Group + **Submit for Approval**, presses **Verified**, moves **Hardcopy & Acc Created** |

Configured in `src/env.js`:

```js
const ROLES = {
  approver: process.env.EV_APPROVER || 'ops_jasons',
  assignee: process.env.EV_ASSIGNEE || 'hubadmin_bochar',
};
```

The `assign` step exists **because** the two are different people. The 23-08-2026
recording shows the approver handing the record over as its own act, before the
assignee ever opens it — and the sidebar dropdown holds **display names**
("CHARMAIN EA CHIANG chg"), not login ids, so override with `--assignee-name` or
`EV_ASSIGNEE_NAME` if your assignee login differs.

**Create Account needs both accounts**, in this order: the assignee sets Hardcopy &
Acc Created to *Pending Assignee* (only the assignee may), then the approver presses
Create Account.

---

## Every URL in the flow

Base: `https://staging.eauto.my` · instance: `uat4`

### Dealer (public)

| Screen | URL |
| --- | --- |
| reCAPTCHA gate | `/obs/preOnb/recaptcha` |
| Pre-Application Form | `/obs/preOnb/form`, then `/obs/preOnb/form/<uuid>` once the draft exists |
| FPX redirect | `/obs/preOnb/landing/<uuid>/<bank>` → popup to `sandbox-payment.fiuu.com` |
| Fiuu bank simulator | `bank-simulator.fiuu.com/<CHANNEL>/login` — `MB2U0227` = Maybank, `AMB80209` = AmBank |
| Pre-Application Review (post-payment) | `/obs/preOnb/summary/<uuid>` |
| **Application Form (the dealer link)** | `/obs/form/<sec>?id=<brn>&s=<token>&v=1` |

### BackOffice — Onboarding

The Onboarding admin screens **open off `cs04`** but **live under
`/obs/admin/...`** with a "Back to Backoffice" banner. The listing the flow revolves
around is `/obs/admin/enquiry`, which is *not* a `cs04` page.

| Screen | URL |
| --- | --- |
| UCD Pre-Application Listing | `/obs/admin/preOnb/enquiry` (also `/obs/admin/preOnb/inquiry`) |
| Pre-Application detail | `/obs/admin/preOnb/summary/<uuid>` |
| **UCD Application Listing** | `/obs/admin/enquiry` |
| Application Form (BO edit) | `/obs/admin/form/edit/<uuid>` |
| **Registration Documents (BO)** | `/obs/admin/form/edit-registration-doc/<uuid>` |
| Create New Company Account | `/uat4/view/account/company-obs/new.do?id=<uuid>` |
| Listing AJAX search endpoint | `admin/form/enquiry/search` (GET, serialised from `#search-form`) |
| SSM lookup | `/obs/preOnb/checkSSM.do` |

### Internal tooling

| Tool | URL | Needs |
| --- | --- | --- |
| Expiry reset (support tool) | `http://172.30.202.23:8888/eauto-support/obs/reset-expiry` | **VPN** + its own ADMIN-only portal sign-in |
| Mail catcher (Mailtrap) | the `modefair` sandbox, route `/sandboxes/<id>` | a browser session, or an API token |

Two navigation rules that are not optional:

1. **Never `page.goto('/obs/...')` cold.** Direct navigation to `/obs` returns
   **39 bytes of blank HTML** until one menu click has happened in the session. Go
   through the menu (`src/obs.js`).
2. **Never hardcode the instance in a path.** `uat4` is a variable. A hardcoded
   `/uat4/home/` sent a session logged into `/eauto` to the wrong instance, bounced
   it to a login page, and produced a *permissions* story for what was a
   wrong-instance navigation.

---

## The role model (measured 26-08-2026)

The system has **three** BackOffice roles. "CSE", "Ops" and "Finance" are the
credential store's labels for *whose login it is* — the system does not know them.
The user-account listing's `userRole` filter and the edit screen's `role` radios both
offer only:

| System role | Accounts on staging | Reaches the Onboarding module |
| --- | --- | --- |
| **HubAdmin** | 126 | yes |
| **Admin** | 69 | yes |
| **Probation** | 47 | **no — there is no Onboarding group in the menu at all** |

"Superadmin" is the team's name for the `jasons` account, not a fourth role. Its
role is HubAdmin.

Two traps found while measuring this, both worth knowing for any role work:

- **Login ID is cell 1 of a user-listing row, not cell 0.** Cell 0 is the row
  number. Matching on cell 0 matches nothing, silently.
- **A 403 on a direct `/obs` URL is not a permission result.** The Probation account
  got HTTP 403 on `/obs/admin/enquiry` — and so did the HubAdmin control run
  immediately afterwards, because `/obs` needs the menu-click session handoff. **The
  menu absence is the finding; the 403 is an artefact of how you navigated.**

Any script that switches a role on a **shared** UAT account must read the subject by
URL, match the login id **exactly** (`BOChar1` is a different account from `BOChar`),
touch only the `role` radio, and restore in a `finally` — verifying the restore on
both the edit screen and the listing row. See `src/boRoles.js`.
