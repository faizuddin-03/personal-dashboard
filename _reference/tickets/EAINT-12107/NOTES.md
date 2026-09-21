# EAINT-12107 — attachments

**Update 2026-09-10:** user manually saved the v1.0 PDF into this folder
(`SRD_EAINT-12107_..._v1.0_20260910.pdf`, 18 pages) — read in full. The other
4 attachments below are still not captured; grab them the same way (browser
download hangs on the native Save dialog, don't retry it).


Jira attachments for this ticket (as of 2026-09-10, fetched via Atlassian MCP):

| File | Version | Added |
| --- | --- | --- |
| SRD_EAINT-12107_..._v1.0_20260910.pdf | **V1.0 (latest)** | 10 Sep 2026 |
| SRD_EAINT-12107_..._v1.0_20260910.docx | V1.0 | 10 Sep 2026 |
| SRD_EAINT-12107_..._v0.2_20260910.docx | v0.2 | 10 Sep 2026 |
| SRD_EAINT-12107_..._SPAY Later and PayLater by Grab_v0.1_20260903.docx | v0.1 | 03 Sep 2026 |
| secarang_payment_channels_prototype.html | prototype mockup | 03 Sep 2026 |

The Atlassian REST attachment-content endpoint returns 403 to WebFetch (needs
OAuth, not a browser session). Attempted to pull them via claude-in-chrome
(browser is logged into Jira) but the download's native "Save As" dialog froze
the CDP session — abandoned per user instruction rather than keep fighting it.

**Not downloaded yet.** Someone with the Jira tab open needs to manually save
the 5 files above into this folder (`_reference/tickets/EAINT-12107/`), named
ticket-key-first per repo convention. Do that before writing test scenarios
that depend on SRD section 2.1–2.2.8 detail (payment flow, channel filter,
testing eligibility) — the study below only reflects the ticket description
and comments, not the SRD body.
