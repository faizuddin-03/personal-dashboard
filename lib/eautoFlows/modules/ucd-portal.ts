import type { Fact, Source, Module, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const mi = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const ji = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const ae = (ref: string): Source => ({ kind: "askeauto", ref, date: "2026-10-23" });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

const SHELL = "knowledge/flow-ucd-shell.md";
const UCD_PORTAL = "knowledge/portals/ucd/portal.md";

export const ucdPortal: Module = {
  id: "ucd-portal",
  name: "UCD Portal: login, homepage, popups and campaigns",
  short: "UCD Portal",
  portals: ["UCD portal (/<env>/public/login/ → /<env>/view/ucd/home)", "AATF portal (shares the login)", "Insurance portal (shares the login)"],
  summary:
    "The front door of the dealer portal. A dealer logs in and lands on the homepage with module tiles. Before the tiles are usable, a chain of popups can open: browser reminders, campaigns, profile reminders and posters. The homepage does not create transactions. It sends the dealer into the other modules.",
  related: ["insurance", "estm", "stms", "platform", "company-profile-einvoice"],
  glossary: [
    { term: "UCD", meaning: "Used Car Dealer. The main users of this portal.", sources: [mi("knowledge/eauto-portals.md")] },
    { term: "Main user / sub user", meaning: "A company has one main user and can have sub users. Some tiles and pages are only for the main user (for example Company/Business Profile).", sources: [mi(SHELL)] },
    { term: "Dialog chain", meaning: "The homepage opens only the first flagged popup. When it is closed, the next flagged popup opens.", sources: [mi(SHELL), ae("Q2")] },
    { term: "Web Socket popup", meaning: "Reminder to move from the old Java applet to the Chrome / web socket MyKad reader.", sources: [mi(SHELL), az(UCD_PORTAL)] },
    { term: "East Coast banner", meaning: "Campaign banner for dealers whose HQ or branch is in Kelantan, Terengganu or Pahang.", sources: [mi(SHELL), ae("Q2")] },
  ],
  flows: [
    // ---------------------------------------------------------- 1
    {
      id: "login",
      name: "UCD login",
      summary:
        "The dealer logs in on the shared login page. The account type decides where they land. UCD users go to the UCD homepage.",
      portals: ["UCD portal", "Back Office (same login page)", "AATF", "Insurance"],
      triggers: [
        {
          id: "web-login",
          name: "Web login form",
          entry: "/<env>/public/login/ (shared with BO; role decides the portal)",
          steps: [
            S("Browser check on page load", [ae("Q2"), mi(SHELL)], {
              where: "Login page (common/browser-check.jsp)",
              detail: "Firefox older than 36.0.4 is sent to /public/login/unsupported-browser.do.",
              branches: [{ when: "Firefox older than 36.0.4", then: "Redirect to the unsupported-browser page." }],
            }),
            S("Enter login name and password", [ae("Q2")], {
              where: "Login page › Login (POST /public/login.do, AccessController)",
              detail: "LoginHandlerBean.doLogin checks the user, the user status, the company status (must be Activated) and the branch status.",
              branches: [
                { when: "Wrong login or inactive user", then: "Error message. Login blocked." },
                { when: "Company status is not Activated (New, Inactivated, Rejected, Terminated)", then: "Blocked with a “company not active” message." },
                { when: "firstTimeLogin or resetPassword", then: "Forced to the change-password page." },
                { when: "A director is not yet activated", then: "Forced to the activation page." },
              ],
              affects: ["Onboarding › UCD account activation", "Platform › password rules"],
            }),
            S("Session flags are armed", [ae("Q2")], {
              detail: "For UCD and Insurance logins the system sets session flags: STMS-cancellation reminder, Announcement, Insurance banner, address/profile update reminder, date-window campaign flags (CNY, Raya, Merdeka) and the East Coast banner flag.",
              affects: ["Popup chain"],
            }),
            S("Redirect to the homepage", [ae("Q2"), mi(SHELL)], {
              where: "/<env>/view/ucd/home.do",
              detail: "“Welcome to eAuto”. The login is written to the audit log and an IP lookup event is sent.",
            }),
          ],
          sources: [ae("Q2"), mi(SHELL)],
        },
        {
          id: "mobile-login",
          name: "Mobile app login API",
          entry: "/public/mb/login.do (same AccessController, same rules)",
          steps: [S("App sends login", [ae("Q2")], { detail: "Same login rules as the web form. It is an app login, not a web popup flow." })],
          sources: [ae("Q2")],
        },
        {
          id: "logout",
          name: "Logout",
          entry: "Header › Logout",
          steps: [S("Confirm logout", [mi(SHELL)], { where: "#header a.logout", detail: "A jQuery dialog “Sure to logout?” → Yes → /<env>/user/logout.do. BO and Service Portal use a native browser confirm instead." })],
          sources: [mi(SHELL)],
        },
      ],
      affects: [
        F("Login is written to the audit log (ActivityType.LoggedIn). JPJ users also go to a JPJ audit log.", [ae("Q2")]),
        F("An IP lookup event is sent for UCD logins.", [ae("Q2")]),
        F("Nothing else is saved. No listing row, JPJ, insurer, bank or e-Invoice call comes from login.", [ae("Q2")]),
      ],
      cronjobs: [],
      roles: [
        F("UCD dealer users (company type UCD) land on /view/ucd/home.", [ae("Q2")]),
        F("Insurance company type gets the same flags but lands on a different home page.", [ae("Q2")]),
        F("AATF company type gets only the Announcement and websocket flags and lands on /view/aatf/home (a link-based layout, not tiles).", [ae("Q2")]),
        F("eAuto (internal) and JPJ company types go to /home and /view/jpj/home. UCD popups do not apply.", [ae("Q2")]),
        F("Credit/Bank users use a separate portal, login and session key.", [ae("Q2")]),
        F("A restricted UCD sees “You are currently restricted from creating transactions. Please contact eAuto at 03-27798899.” (EAINT-9044).", [mi(SHELL), ts("EAINT-9044 (TS #089)")]),
      ],
      afterCompletion: [F("The dealer reaches the UCD homepage. Session length shows as a ~24 h counter on uat4.", [mi(SHELL)])],
      rules: [
        F("LoginStatus values: firstTimeLogin, secondTimeLogin, inactive, resetPassword. inactive blocks login. firstTimeLogin and resetPassword force a password change.", [ae("Q2")]),
        F("CompanyStatus values: New, Activated, Inactivated, Rejected, Terminated. Only Activated can log in.", [ae("Q2")]),
        F("Listing names are cut to 15 characters. Times show in 24h on lists and 12h with AM/PM on details. No seconds are shown.", [mi(SHELL)]),
        F("Listings show nothing until Search Now is pressed (“Please apply search to show the record.”).", [mi(SHELL)]),
      ],
      scopeToCheck: [
        F("Check login with each company status and user status.", [ae("Q2")]),
        F("Check forced change-password and forced activation paths.", [ae("Q2")]),
        F("Check landing page per company type (UCD, AATF, Insurance, BO, JPJ).", [ae("Q2")]),
        F("Check the restricted-UCD message.", [ts("EAINT-9044")]),
        F("Check logout on UCD (jQuery dialog) versus BO and Service Portal (native confirm).", [mi(SHELL)]),
      ],
      tickets: [
        { key: "EAINT-9044", what: "Transaction Restriction popup / message", state: "latest" },
        { key: "EAINT-12552", date: "2026-10", what: "Android app: show Transaction Restriction Notice popup S00044 (Code Review)", state: "latest" },
      ],
      openQuestions: ["Wholesale tile was missing in the 2026-09-24 capture. Reason is not known (account or rollout)."],
    },

    // ---------------------------------------------------------- 2
    {
      id: "home-tiles",
      name: "Homepage tiles and header navigation",
      summary:
        "The homepage tiles are the entry points into the other modules. The tiles do not do any work themselves.",
      portals: ["UCD portal"],
      triggers: [
        {
          id: "tile-click",
          name: "Click a homepage tile",
          entry: "UCD homepage › tile",
          summary: "Tile destinations seen on the 2026-09-24 capture.",
          steps: [
            S("STMS", [mi(SHELL)], { where: "Tile STMS → /view/ucd/stms/view.do", affects: ["stms"] }),
            S("UCD TO UCD", [mi(SHELL)], { where: "Tile → /view/ucd/stms/interstate/ucd-view.do", affects: ["ucd-to-ucd"] }),
            S("APT", [mi(SHELL)], { where: "Tile #APT → /view/ucd/apt/enquiry/", affects: ["apt"] }),
            S("eSERAHAN", [mi(SHELL)], { where: "Tile #ESTM → T&C check (check-eClassified.do) → /view/ucd/estm/view.do", affects: ["estm"] }),
            S("BMK", [mi(SHELL)], { where: "Tile #bmk", affects: ["bmk"] }),
            S("INSURANCE", [mi(SHELL)], { where: "Tile #insurance → /view/ucd/insurance", affects: ["insurance"] }),
            S("JOMCHECK REPORT", [mi(SHELL)], { where: "Tile #jomcheck → /view/ucd/jomcheck/view.do", affects: ["jomcheck"] }),
            S("SERVICE HUB", [mi(SHELL)], { where: "Tile #servicehub → /view/ucd/service-hub/view.do", affects: ["service-hub"] }),
            S("COMPANY/BUSINESS PROFILE", [mi(SHELL), az(UCD_PORTAL)], { where: "Tile #company-business-profile → /view/ucd/einvoice/view.do (main user)", affects: ["company-profile-einvoice"] }),
            S("SETTINGS and REPORTS", [mi(SHELL)], { where: "Tiles #setting, #report", detail: "Settings page tiles: Manage Branches, Confirmation of Registration, Manage Users, Account Activation." }),
            S("Disabled tiles", [mi(SHELL), az(UCD_PORTAL)], { detail: "eVOC (disabled) and LKM REFUND (disabled, “coming soon” on the 2026-09-24 capture). LKM Refund later shipped as an STMS Step 5 add-on.", affects: ["stms-addons"] }),
            S("Wholesale tile", [mi(SHELL)], { detail: "Click runs wholesaleTileClick → check-tnc.do: ACCEPTED opens it, NEEDS_ACCEPT asks for T&C, sub user gets a notice. Not shown on the 2026-09-24 capture.", affects: ["wholesale"] }),
          ],
          sources: [mi(SHELL)],
        },
        {
          id: "header-nav",
          name: "Header navigation",
          entry: "Header links on every UCD page",
          steps: [S("Use a header link", [mi(SHELL)], { detail: "Links: #home-link, #insurance-link, #reports-link, #settings-link, #user-guide-link, #download-link, #contact-link. User guides are served from a URL starting with “cdn” (EAINT-11835). Contact Us hides the eAuto bank account number (EAINT-12130)." })],
          sources: [mi(SHELL)],
        },
        {
          id: "blocked-dialogs",
          name: "Blocked-access dialogs that return to the homepage",
          entry: "Opening a module page without permission or with a blocked record",
          steps: [S("A blocking dialog opens, then redirects to the homepage", [mi(SHELL)], { detail: "#dialog-estm-access-denied, #dialog-txn-forbidden (JPJ blacklisted), #dialog-txn-block-422 (owner record missing), 422c / 422d (MyKad under 18), #ic-null-dialog, #dialog-bmk-no-permission, #dialog-insurance-not-add-as-user, #dialog-permission-access-denied." })],
          sources: [mi(SHELL)],
        },
      ],
      affects: [
        F("Every tile only navigates. Each module has its own after-completion behaviour.", [ae("Q2")]),
        F("All UCD module pages share the same header and listing/filter pattern (form#search-form).", [mi(SHELL)]),
        F("The Insurance tile is also reached by a popup, banner, 69E redirect and quotation email link. See the insurance module.", [ae("Q2")]),
      ],
      cronjobs: [],
      roles: [
        F("Main user versus sub user changes the Company/Business Profile tile (main user only).", [mi(SHELL), az(UCD_PORTAL)]),
        F("Wholesale needs accepted T&C.", [mi(SHELL)]),
        F("No per-user function gating inside the homepage. Access is by company type at login.", [ae("Q2")]),
      ],
      afterCompletion: [F("n/a. Navigation shell.", [mi(SHELL)])],
      rules: [
        F("Duplicate element ids exist on the page (for example #dialog-campaign-close-btn, #to-filter, #vehicleCategory). Scripts that dismiss banners can silently do nothing when a hidden duplicate hides the visible one. Use :visible or name= selectors.", [mi(SHELL)]),
      ],
      scopeToCheck: [
        F("Check every tile opens the right module and shows the right price label (for example STMS “From RM35”, UCD to UCD “RM35”, APT “RM125”).", [mi("knowledge/business-rules-from-test-scenarios.md"), ts("EAINT-12403")]),
        F("Check tile visibility by permission (Insurance, eSTM, BMK, Wholesale, LKM Refund).", [mi(SHELL)]),
        F("Check the blocked-access dialogs for each permission case.", [mi(SHELL)]),
        F("Check a fee change updates the hard-coded tile labels (home.jsp and module pages).", [az("knowledge/_core/fees-and-pricing.md")]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "Home tile prices STMS from RM30 to RM35, APT from RM120 to RM125", state: "latest" },
        { key: "EAINT-12550", date: "2026-10", what: "Android app: STMS and UCD to UCD tile price RM25 to RM35 (Code Review)", state: "latest" },
        { key: "EAINT-12130", date: "2026-08", what: "Contact Us: hide eAuto bank account number", state: "latest" },
        { key: "EAINT-11835", what: "User guides served from the cdn URL", state: "latest" },
      ],
      openQuestions: ["Reports page, Settings sub-pages and the disabled tiles are not fully documented."],
    },

    // ---------------------------------------------------------- 3
    {
      id: "startup-popups",
      name: "Startup popup chain (reminders, campaigns, announcements, posters)",
      summary:
        "After login the homepage shows at most one popup at a time. It opens the first flagged popup. When the dealer closes it, the next one opens. The order is not fixed and changes with each campaign.",
      portals: ["UCD portal (homepage)", "Insurance dashboard", "AATF homepage (Announcement only)"],
      triggers: [
        {
          id: "login-homepage",
          name: "Landing on the UCD homepage after login",
          entry: "/<env>/view/ucd/home.do (home.jsp includes dialog-manager.jsp)",
          steps: [
            S("Dialog manager reads the flags", [ae("Q2"), mi(SHELL)], {
              where: "Homepage (dialog-manager.jsp)",
              detail: "Reads the session flags set at login, sets matching localStorage keys, and opens the first true dialog from a priority list.",
            }),
            S("Popups open one by one", [mi(SHELL)], {
              detail: "Dialogs: #dialog-websocket, #dialog-eastcoast, #dialog-merdeka-campaign, #profile-updates-dialog (jQuery UI, OK button), #dialog-einvoice, #dialog-cny-campaign, #dialog-raya-campaign. Closing one opens the next. A campaign popup is bilingual: English first, Chinese after 7 seconds.",
              branches: [
                { when: "Chrome, campaign running (Hari Raya 2026 example)", then: "Campaign first, Company Profile Update second." },
                { when: "Firefox, campaign running", then: "Web Socket first, campaign second, Company Profile Update third." },
                { when: "East Coast HQ or branch UCD (not on the 31st day)", then: "East Coast popup shows." },
                { when: "Company profile still to be updated", then: "Company/Business Profile Update popup (#dialog-einvoice) shows: “UPDATE REQUIRED … Failure to comply may result on your account with eAuto be suspended”." },
              ],
              affects: ["company-profile-einvoice"],
            }),
            S("Popup order wired in production code", [ae("Q2")], {
              detail: "Websocket reminder → East Coast banner → Insurance-cancellation / LKM-refund poster → Merdeka campaign → profile-updates dialog → e-Invoice setup reminder → CNY campaign → Raya campaign.",
            }),
          ],
          sources: [mi(SHELL), ae("Q2")],
        },
        {
          id: "insurance-page",
          name: "Insurance module page and Insurance Transaction Listing banner",
          entry: "UCD › Insurance › module landing page and Transaction Listing",
          summary: "Campaign and webinar popups also show on the Insurance landing page. A banner shows above the Insurance Transaction Listing.",
          steps: [
            S("Open Insurance", [ts("11784_TS02-TS03"), ts("EAINT11925_TS2-TS3")], {
              detail: "Popup shows once per login. It does not show again when the dealer returns to the Homepage or Insurance page. A banner can be set to auto-hide on its end date.",
              affects: ["insurance"],
            }),
          ],
          sources: [ts("11784"), ts("EAINT-11925")],
        },
        {
          id: "poster-popup",
          name: "Insurance Cancellation / LKM Refund poster popup (post-login)",
          entry: "UCD homepage right after login",
          steps: [
            S("Poster opens once per login", [ji("EAINT-12555", "2026-10-19")], {
              detail: "Current poster = Insurance Cancellation (EAINT-12555, prod 2026-10-20). It replaced the LKM Refund popup v1.1 (EAINT-12438, prod 2026-10-07), which replaced the LKM Refund launching poster (EAINT-12421, prod 2026-10-01). It shows again at the next login.",
              affects: ["stms-addons"],
            }),
            S("What's New section", [ji("EAINT-12525", "2026-10-20")], { detail: "Heading is “What's New – LKM Refund”. The BMK video is replaced by an LKM Refund tutorial. It shows to all UCD users now (before: only users with Insurance permission)." }),
          ],
          sources: [ji("EAINT-12555"), ji("EAINT-12525")],
        },
      ],
      affects: [
        F("Insurance module access: a popup still shows without Insurance permission, but the module stays blocked. A direct URL shows “Sorry, access denied”.", [mi("knowledge/business-rules-from-test-scenarios.md"), ts("EAINT-8564 TS5-TS8")]),
        F("Reads: e-Invoice setup status (CompanyAccount.eInvoiceSetupStatus), Insurance-cancellation / LKM-refund data, branch/state, and SSM permission flags.", [ae("Q2")]),
        F("No data is written back to other modules.", [ae("Q2")]),
      ],
      cronjobs: [
        { name: "None for login or popups", schedule: "n/a", does: "No scheduled job touches login or these popups. Banners hide after their end date.", sources: [ae("Q2"), mi(SHELL)] },
      ],
      roles: [
        F("UCD users (CompanyType.UCD), main and sub. East Coast popup only for East Coast HQ or branch.", [ae("Q2"), mi(SHELL)]),
        F("Insurance company type shares the same flags.", [ae("Q2")]),
        F("AATF gets only the Announcement flag and the web socket flag.", [ae("Q2")]),
      ],
      afterCompletion: [F("n/a. A popup only informs. Popup state is per-session flags plus browser localStorage, not a database status.", [ae("Q2")])],
      rules: [
        F("Campaign popup order changes per season. Take the order from the current campaign ticket. Different order between campaigns is not a conflict.", [mi(SHELL)], {
          alt: [{ text: "Production code order (websocket, East Coast, poster, Merdeka, profile updates, e-Invoice reminder, CNY, Raya).", sources: [ae("Q2")], note: "Prod code says this fixed priority list." }],
        }),
        F("A campaign popup shows once per login. It is not shown again on return to Homepage or Insurance page.", [mi(SHELL), ts("EAINT10053_TS3")]),
        F("TnG winners popup (EAINT-8564) was added in 2025-08 then removed by EAINT-8637. It must not show for main or sub UCD.", [ts("EAINT-8637 TS1-TS4")]),
        F("Suppression keys in localStorage: dialog-websocket, dialog-eastcoast, homemerdekacampaign, homerayacampaign, homecnycampaign and homeEInvoiceReminder (= false). homeAnnouncement and homeStmsCancellationReminder open unless set to false. During a campaign the page forces campaign flags true, so dismiss after each navigation.", [mi(SHELL)], {
          alt: [{ text: "The Announcement dialog and the STMS-cancellation-reminder dialog are built and flagged, but are NOT in the queue that opens popups, so they do not appear after login in production.", sources: [ae("Q2")], note: "Prod code says this. It looks like a live gap — worth testing." }],
        }),
        F("East Coast popup is for East Coast HQ/branch UCDs only and not on the 31st day. Campaign popups are bilingual with a 7 second interval.", [mi(SHELL), ts("EAINT-9564")]),
        F("Webinar banner shows details, session info and a QR code. With a pending company profile update the Update Company Profile banner shows on the Homepage; the webinar banner shows on the Insurance pages.", [ts("11784_TS01-TS17"), ts("12106_TS04")]),
        F("Chrome websocket popup shows first after login; websocket text also shows on module dashboards (EAINT-9894).", [mi("knowledge/business-rules-from-test-scenarios.md")]),
      ],
      scopeToCheck: [
        F("Check the popup order for the campaign in hand on Chrome and Firefox.", [ts("EAINT-10053"), ts("EAINT-11925")]),
        F("Check once-per-login (return to Homepage, Insurance page, browser back).", [ts("EAINT-8564 TS1")]),
        F("Check main user versus sub user, and Insurance permission on and off.", [ts("EAINT-11784"), ts("EAINT-8564")]),
        F("Check Company Profile Update pending and not pending.", [ts("EAINT-10053"), ts("EAINT-8637")]),
        F("Check language switch after 7 seconds and the close button.", [ts("EAINT-8564 TS1")]),
        F("Check the poster popup and What's New after login (EAINT-12555, 12525).", [ji("EAINT-12555"), ji("EAINT-12525")]),
        F("Check the Announcement popup really opens after login (prod gap).", [ae("Q2")]),
        F("Check East Coast popup for HQ and branch, and the 31st day.", [ts("EAINT-9564")]),
        F("Check the Android app for the same popups where tickets exist (for example S00044).", [ji("EAINT-12552")]),
      ],
      tickets: [
        { key: "EAINT-8564", date: "2025-08", what: "TnG campaign winners popup added", state: "legacy", supersededBy: "EAINT-8637" },
        { key: "EAINT-8637", date: "2025-08", what: "TnG campaign winners popup removed", state: "latest" },
        { key: "EAINT-9559", what: "CNY popup", state: "latest" },
        { key: "EAINT-9560", what: "Raya popup", state: "latest" },
        { key: "EAINT-9564", what: "East Coast popup", state: "latest" },
        { key: "EAINT-10053", date: "2026-03", what: "Hari Raya 2026 campaign popup", state: "latest" },
        { key: "EAINT-11784", date: "2026-06", what: "Webinar banner (June 2026)", state: "latest" },
        { key: "EAINT-11925", date: "2026-08", what: "Merdeka 2026 popups on Homepage and Insurance dashboard", state: "latest" },
        { key: "EAINT-12106", date: "2026-08", what: "Webinar (August 2026) and Merdeka Rewards banner", state: "latest" },
        { key: "EAINT-12421", date: "2026-09", what: "LKM Refund launching poster after login", state: "legacy", supersededBy: "EAINT-12438" },
        { key: "EAINT-12438", date: "2026-10", what: "Replace with latest LKM Refund popup (v1.1)", state: "legacy", supersededBy: "EAINT-12555" },
        { key: "EAINT-12555", date: "2026-10", what: "Replace LKM Refund popup with Insurance Cancellation poster", state: "latest" },
        { key: "EAINT-12525", date: "2026-10", what: "What's New – LKM Refund; tutorial video; all UCD users", state: "latest" },
        { key: "EAINT-12229", date: "2026-08", what: "Revamp Announcement popup into banner style with service video (To Do)", state: "latest" },
        { key: "EAINT-12149", date: "2026-08", what: "Homepage banner schedule feature for insurance promotions (To Do)", state: "latest" },
        { key: "EAINT-9936", date: "2026-02", what: "New popup for referred insurance risk cases (On Hold)", state: "latest" },
      ],
      openQuestions: [
        "Is the Firefox announcement #dialog-websocket or a separate dialog? Ask eAuto says the Announcement dialog is not in the popup queue, but EAINT-12180 TS expects a Firefox popup after every login.",
        "Does the Announcement popup (and the STMS-cancellation reminder) open in production? Ask eAuto says no.",
      ],
    },

    // ---------------------------------------------------------- 4
    {
      id: "browser-reminder",
      name: "Browser reminder: Firefox end of support, Chrome required",
      summary:
        "Firefox support ends 31 December 2026. From 1 January 2027 dealers must use Google Chrome. The reminder shows as a homepage announcement and at the last step of transactions.",
      portals: ["UCD portal", "AATF portal"],
      triggers: [
        {
          id: "homepage-announcement",
          name: "Homepage announcement on Firefox (EAINT-12180)",
          entry: "UCD / AATF login on Firefox",
          steps: [
            S("Login on Firefox", [ts("12180_TS1"), mi(SHELL)], {
              detail: "Announcement popup, title “Announcement 公告”. English above a divider, Simplified Chinese below, with 3 user-guide links. Text: “Support for Mozilla Firefox will officially end on 31 December 2026. Effective 1 January 2027, all users are required to use Google Chrome when accessing the eAuto system.” It shows after every login.",
              branches: [{ when: "Chrome", then: "No popup. Only the Company/Business Profile update banner (AATF: ANNOUNCEMENT/PENGUMUMAN banner)." }],
            }),
          ],
          sources: [ji("EAINT-12180"), ts("12180")],
        },
        {
          id: "last-step-reminder",
          name: "Reminder on the last step of a transaction (EAINT-12253)",
          entry: "Last step page of STMS (incl. wholesale), eSTM, BMK, APT, Insurance, Service Hub, JomCheck",
          steps: [
            S("Dealer reaches the last step", [ji("EAINT-12253")], {
              detail: "Same text about Firefox ending and Chrome being required (Firefox use 42%, Websocket 50%). Child EAINT-12574 covers UCD and AATF last-step pages (Closed). Not shown on the Company/Business Profile update flow.",
              affects: ["stms", "estm", "bmk", "apt", "insurance", "service-hub", "jomcheck"],
            }),
          ],
          sources: [ji("EAINT-12253")],
        },
        {
          id: "old-firefox-redirect",
          name: "Old Firefox redirect and web socket check",
          entry: "Page load (browser-check.jsp and check-browser-version.jsp)",
          steps: [
            S("Version checks", [ae("Q2")], {
              detail: "Firefox below 36.0.4 is redirected to /public/login/unsupported-browser.do. A separate MyKad websocket check (Firefox below 37) arms the web socket reminder shown on the homepage.",
            }),
          ],
          sources: [ae("Q2"), az(UCD_PORTAL)],
        },
      ],
      affects: [
        F("UCD and AATF last-step pages across modules.", [ji("EAINT-12253")]),
        F("Chrome is needed for the DERMALOG biometric reader (V1/V2 tickets EAINT-9894 / 9895, Closed).", [ji("EAINT-9895")]),
      ],
      cronjobs: [],
      roles: [F("All users: main UCD, sub UCD and AATF.", [ts("12180"), ji("EAINT-12253")])],
      afterCompletion: [F("n/a. Information only.", [ji("EAINT-12253")])],
      rules: [
        F("Footer still prints “Best Compatible With Mozilla Firefox V36.0.4”. Firefox 36.0.4 uses the Java applet, Firefox 37+ and Chrome/Edge use the web socket reader.", [az(UCD_PORTAL)]),
        F("Firefox 36.0.4 cannot be automated. Test it by hand.", [ts("12180")]),
        F("Browser priority: UCD/AATF Firefox; BO/JPJ Chrome then Firefox, until 1 Jan 2027, then Chrome only.", [mi("knowledge/business-rules-from-test-scenarios.md")]),
      ],
      scopeToCheck: [
        F("Check browser × user type (main, sub, AATF) × pending profile update.", [ts("12180")]),
        F("Check wording, the 3 links and the English/Chinese layout.", [ts("12180_FT1-FT2")]),
        F("Check the reminder on each module’s last step and that it is absent on the profile update flow.", [ji("EAINT-12253")]),
      ],
      tickets: [
        { key: "EAINT-12180", date: "2026-08", what: "Homepage announcement popup for Firefox to Chrome migration (Done 2026-09-08)", state: "latest" },
        { key: "EAINT-12253", date: "2026-09", what: "Browser reminder on last step of transactions (Testing In 1st Env 2026-10-21)", state: "latest" },
        { key: "EAINT-12574", what: "Child: UCD and AATF last-step pages (Closed)", state: "latest" },
        { key: "EAINT-12229", date: "2026-08", what: "Revamp announcement into banner style (To Do)", state: "latest" },
      ],
      openQuestions: ["Prod code may not open the Announcement popup. See the popup chain flow."],
    },
  ],
};
