// @ticket   EAINT-12406
// @sheet    1 Secarang Pages (CP)
// @cases    12406_CP_TS1, 12406_CP_TS2, 12406_CP_TS3, 12406_CP_TS4, 12406_CP_TS5, 12406_CP_TS6
// @env      Secarang staging /ia/ (INSTANCE=ia; SECARANG_BASE_URL / SECARANG_BASE_PATH from env/.staging.env-local)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by, Azfar 29.10.2026: "Dev push
// the changes ady you may start"). Expected values: SRD v1.1 REQ-001 / 007 / 008 / 009 and mockup Secarang 20261015,
// in the TS's words (./_cp-expected.ts). Selectors: probes of the deployed /ia/ on 29.10.2026
// (03-spec/probes-automation/cp-pages-probe.mjs, cp-marks-probe.mjs).
//
// Read only: no form is filled, Get quotation is never pressed; the only input is the site password page. No login,
// so no lane persona is used (Secarang is a public site; the lane only holds the run lock).
// Flow: secarang (VERIFIED 29.10.2026, cr-evidence): runSecarangFlow stopAfter "home", openSecarangInfoPage (verify spec
// automation/tests/flows/secarang.verify.spec.ts, tests "stops at home" and "info pages").
//
// Not in this file: 12406_CP_TS8 (before / after, 1-secarang-before-after.e2e.cr.spec.ts); 12406_CP_TS7 (ON HOLD,
// production after go-live, Azfar 29.10.2026 "the production one put on hold first"); 12406_CP_TS9 (ON HOLD, orange,
// Azfar 29.10.2026). Re-checked 29.10.2026 against scenarios.yaml 15:16: CP_TS1-TS6 points unchanged.
import { test, expect, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { runSecarangFlow, openSecarangInfoPage } from "@flows/secarang.flow";
import { SecarangHomePage, insurerOfLogo } from "@pages/secarang/home.page";
import { SecarangAboutUsPage } from "@pages/secarang/about-us.page";
import { SecarangFaqPage, FAQ_WHICH_INSURERS } from "@pages/secarang/faq.page";
import { SecarangSupportPage } from "@pages/secarang/support.page";
import { lookOf, type SecarangLook } from "@pages/secarang/secarang.page";
import {
  ALLIANZ, INSURERS_IN_ORDER, HOME_LOGOS_IN_ORDER,
  PARTNERSHIP_SENTENCE, PARTNERSHIP_PARAGRAPH, PARTNERSHIP_OLD_ENDING,
  ALLIANZ_HELPLINE_LABEL, ALLIANZ_HELPLINE_NUMBER, ALLIANZ_TOWING, NOT_ALLIANZ_LABELS,
  FROM_BEFORE, beforeShot, beforeFaqListStyle, clean, sameList,
} from "./_cp-expected";
import { openMockup, mockupPartnership, mockupFaqWhichInsurers, mockupSupportAllianz } from "./_mockup";

const SIDE = "Secarang (public site, no login)";
const font1 = (ff: string) => ff.split(",")[0].replace(/["']/g, "").trim();
/** The font properties two texts must share to "look the same". */
const fontKey = (l: SecarangLook) => `${font1(l.fontFamily)} ${l.fontSize} w${l.fontWeight} ${l.color}`;
const box = async (el: import("@playwright/test").Locator) => (await el.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };

/** Keep a copy of a BEFORE screenshot in this TS's folder and show it in the video (reference only, not a proof). */
async function showBefore(ts: TsRun, file: string, what: string) {
  const copy = path.join(ts.dir, ts.numbered(`FROM-THE-BEFORE-CAPTURE-${path.basename(file, ".png")}`));
  fs.copyFileSync(file, copy);
  await ts.showFile(copy, `${FROM_BEFORE} (12406_CP_TS8, 28.10.2026 15:22 MYT, staging /ia/, old build): ${what}`);
  ts.note(`BEFORE reference shown and kept: ${path.basename(copy)} (from 05-evidence/pre-push/12406_CP_TS8/${path.basename(file)})`);
}

test.describe("EAINT-12406 sheet CP: Secarang pages (staging /ia/)", () => {
  // ------------------------------------------------------------------ Home
  test(
    "12406_CP_TS1 — Home insurer logos show Lonpac, Allianz, Tokio Marine in this order, Allianz logo image shown",
    { tag: ["@P1", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      // Steps 1-2: Secarang > Home, scroll to the insurer logos
      await runSecarangFlow(ts.page, { stopAfter: "home" });
      const home = new SecarangHomePage(ts.page);
      const row = await home.logoRow();
      expect(row.length, "Home shows no insurer logo at all").toBeGreaterThan(0);
      const names = row.map((l) => insurerOfLogo(l.file) || `unknown logo ${l.file}`);
      ts.note(`Home logos read: ${JSON.stringify(row)}`);
      await ts.prove("E1", {
        shows: `Home insurer logos, left to right: ${row.map((l) => `${insurerOfLogo(l.file) || "?"} (${l.file})`).join(", ")}`,
        match: sameList(names, HOME_LOGOS_IN_ORDER),
        hl: home.logoRowFrame(), // the whole logo row (insurerLogos() framed Lonpac only: ts.shot outlines the first match)
        name: "home-insurer-logos",
      });
      const az = row.filter((l) => insurerOfLogo(l.file) === "Allianz");
      if (az.some((l) => l.colours === -1)) throw new Error("The Allianz logo's pixels could not be read (canvas refused): E2 cannot be judged by this script");
      const a = az[0];
      await ts.prove("E2", {
        shows: a
          ? `Allianz logo ${a.file}: image loaded ${a.loaded}, file ${a.natural}px, drawn ${a.width}x${a.height}px, ${a.colours} colours painted${az.length > 1 ? ` (${az.length} Allianz logos)` : ""}`
          : "no Allianz logo image on Home",
        // a broken image does not load; a blank box paints 1-2 colours; text is not an <img>
        match: az.length === 1 && a.loaded && a.width >= 20 && a.height >= 10 && a.colours > 8,
        hl: home.logoByFile("allianz"),
        name: "home-allianz-logo",
      });
    },
  );

  // ------------------------------------------------------------------ About Us
  test(
    "12406_CP_TS2 — About Us > Our partnership shows the new Allianz wording",
    { tag: ["@P1", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      // Step 1: Secarang > About Us; Our partnership
      await openSecarangInfoPage(ts.page, "About Us");
      const about = new SecarangAboutUsPage(ts.page);
      const para = about.partnershipParagraph();
      const text = await about.partnershipText();
      const hl = [about.partnershipHeading(), para];
      await ts.prove("E1", {
        shows: `Our partnership: "${text}"`,
        match: text.includes(PARTNERSHIP_SENTENCE),
        expected: PARTNERSHIP_SENTENCE,
        hl,
        name: "about-us-our-partnership-sentence",
      });
      await ts.prove("E2", {
        shows: `Our partnership paragraph reads: "${text}"`,
        match: text === clean(PARTNERSHIP_PARAGRAPH),
        hl,
        name: "about-us-our-partnership-paragraph",
      });
      const page = clean(await about.content().innerText());
      const at = page.indexOf(PARTNERSHIP_OLD_ENDING);
      await ts.prove("E3", {
        shows: at < 0 ? `the old ending "...${PARTNERSHIP_OLD_ENDING}" is not on About Us` : `About Us still shows the old ending: "...${page.slice(Math.max(0, at - 80), at + PARTNERSHIP_OLD_ENDING.length)}"`,
        match: at < 0,
        hl,
        name: "about-us-old-ending-gone",
      });
    },
  );

  // ------------------------------------------------------------------ FAQs
  test(
    "12406_CP_TS3 — FAQs 'Which insurers can I get instant quotation from?' lists Lonpac, Allianz, Tokio Marine only",
    { tag: ["@P1", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      // E2 compares with the BEFORE capture: shown first so the video holds both
      const beforeStyle = beforeFaqListStyle();
      await showBefore(ts, beforeShot("12406_CP_TS8_E4_faq-which-insurers-instant-quotation.png"), `FAQ answer, ${beforeStyle} list`);
      // Steps 1-2: FAQs > Topic 1 > expand the question
      await openSecarangInfoPage(ts.page, "FAQs");
      const faq = new SecarangFaqPage(ts.page);
      const q = faq.question(FAQ_WHICH_INSURERS);
      expect(await faq.setOpen(q, true), "the question did not open").toBe(true);
      const items = await faq.answerItemTexts(q);
      await ts.prove("E1", {
        shows: `the answer lists ${items.length}: ${items.map((x, i) => `${i + 1}. ${x}`).join(" | ")}`,
        match: sameList(items, INSURERS_IN_ORDER),
        hl: [faq.collapsableHeader(q), faq.answerItems(q)],
        name: "faq-which-insurers-answer",
      });
      const lists = faq.answerLists(q);
      const nLists = await lists.count();
      const look = nLists ? await lookOf(lists.first()) : null;
      const itemLook = (await faq.answerItems(q).count()) ? await lookOf(faq.answerItems(q).first()) : null;
      const marker = itemLook?.listStyleType ?? "";
      const now = !look ? "no list" : look.tag === "OL" || /decimal|roman|alpha|latin/.test(marker) ? "numbered" : /disc|circle|square/.test(marker) ? "bulleted" : `other (${look.tag}, ${marker})`;
      await ts.prove("E2", {
        shows: `the answer is a ${now} list (${look?.tag ?? "-"}, marker ${marker || "-"}, ${nLists} list${nLists === 1 ? "" : "s"}); BEFORE the deploy: ${beforeStyle} (12406_CP_TS8 E4)`,
        match: nLists === 1 && now === beforeStyle,
        hl: lists.first(),
        name: "faq-which-insurers-list-style",
      });
    },
  );

  // ------------------------------------------------------------------ Support
  test(
    "12406_CP_TS4 — Support 'Need to contact insurance company?' shows Lonpac, Allianz, Tokio Marine sections in this order",
    { tag: ["@P1", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      // Step 1: Support > Need to contact insurance company?, as the page loads (Q28: recorded)
      await openSecarangInfoPage(ts.page, "Support");
      const sup = new SecarangSupportPage(ts.page);
      const sections = sup.insurerSections();
      const n = await sections.count();
      const onLoad: string[] = [];
      for (let i = 0; i < n; i++) {
        const s = sections.nth(i);
        onLoad.push(`${clean(await sup.sectionName(s).innerText())}: ${(await sup.isOpen(s)) ? "open" : "closed"}`);
      }
      ts.note(`Q28 (recorded, not judged): sections as the page loads: ${onLoad.join("; ")}`);
      await ts.shot("support-as-loaded", `as loaded: ${onLoad.join("; ")}`, [sup.contactInsurerHeading(), sections]);

      const names = await sup.sectionNames();
      await ts.prove("E1", {
        shows: `sections, top to bottom: ${names.join(" | ") || "none"}`,
        match: sameList(names, INSURERS_IN_ORDER),
        hl: ts.page.locator("app-collapsable h5.insurance-company-name"),
        name: "support-insurer-sections-order",
      });

      // Step 2: expand Lonpac, then Tokio Marine; screenshot each
      const lonpac = sup.section("Lonpac");
      const tokio = sup.section("Tokio Marine");
      const allianz = sup.section("Allianz");
      // the control of each header when closed (all three closed first if one loaded open)
      for (const s of [lonpac, allianz, tokio]) if (await sup.collapsableHeader(s).count()) await sup.setOpen(s, false);
      const closedIcon = {
        L: (await sup.collapsableHeader(lonpac).count()) ? await sup.iconClass(lonpac) : "no section",
        A: (await sup.collapsableHeader(allianz).count()) ? await sup.iconClass(allianz) : "no section",
        T: (await sup.collapsableHeader(tokio).count()) ? await sup.iconClass(tokio) : "no section",
      };
      expect(await sup.setOpen(lonpac, true), "Lonpac did not open").toBe(true);
      await ts.shot("support-lonpac-expanded", "Lonpac expanded", lonpac);
      expect(await sup.setOpen(tokio, true), "Tokio Marine did not open").toBe(true);
      await ts.shot("support-tokio-marine-expanded", "Tokio Marine expanded", tokio);

      // E2: the Allianz header is an insurer name header with the same expand / collapse control
      const openIconL = await sup.iconClass(lonpac);
      const openIconT = await sup.iconClass(tokio);
      const azName = (await sup.sectionName(allianz).count()) ? clean(await sup.sectionName(allianz).innerText()) : "";
      const headerLook = async (s: typeof allianz) => ((await sup.sectionName(s).count()) ? fontKey(await lookOf(sup.sectionName(s))) : "none");
      const [hA, hL, hT] = [await headerLook(allianz), await headerLook(lonpac), await headerLook(tokio)];
      const azClosedIcon = closedIcon.A;
      const opened = await sup.setOpen(allianz, true);
      const azOpenIcon = await sup.iconClass(allianz);
      await ts.shot("support-allianz-expanded", `Allianz expanded with the header control: open ${opened}, icon ${azOpenIcon}`, allianz);
      const closed = !(await sup.setOpen(allianz, false));
      const azClosedAgain = await sup.iconClass(allianz);
      const sameControl =
        azClosedIcon === closedIcon.L && azClosedIcon === closedIcon.T && azClosedAgain === azClosedIcon &&
        azOpenIcon === openIconL && azOpenIcon === openIconT;
      await ts.prove("E2", {
        shows:
          `Allianz header "${azName}" (${hA}; Lonpac ${hL}; Tokio Marine ${hT}). Control closed: Allianz "${azClosedIcon}", Lonpac "${closedIcon.L}", Tokio Marine "${closedIcon.T}"; ` +
          `open: Allianz "${azOpenIcon}", Lonpac "${openIconL}", Tokio Marine "${openIconT}"; Allianz opened by its header: ${opened}, closed again: ${closed}`,
        match: azName === ALLIANZ && hA === hL && hA === hT && opened && closed && sameControl,
        hl: [sup.collapsableHeader(allianz), sup.collapsableHeader(lonpac), sup.collapsableHeader(tokio)],
        name: "support-allianz-header-control",
      });
    },
  );

  test(
    "12406_CP_TS5 — Support: Allianz expanded shows one helpline line and the towing sentence, then collapses",
    { tag: ["@P2", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      await openSecarangInfoPage(ts.page, "Support");
      const sup = new SecarangSupportPage(ts.page);
      const allianz = sup.section("Allianz");
      const lonpac = sup.section("Lonpac");
      const tokio = sup.section("Tokio Marine");
      expect(await sup.sectionName(allianz).count(), "no Allianz section on Support: nothing to expand").toBe(1);

      // Step 1: expand Allianz
      expect(await sup.setOpen(allianz, true), "Allianz did not open").toBe(true);
      const lines = await sup.readLines(allianz);
      const bodyText = clean(await sup.collapsableContent(allianz).innerText());
      const banned = NOT_ALLIANZ_LABELS.filter((r) => r.test(bodyText)).map(String);
      // same format as Lonpac / Tokio Marine: li > h6 (label) + p (number), same fonts
      const fmt = async (s: typeof allianz) => {
        const li = sup.contactLines(s).first();
        if (!(await li.count())) return "no contact line";
        return `li(${(await lookOf(li)).display}) h6 ${fontKey(await lookOf(li.locator("h6").first()))} / p ${fontKey(await lookOf(li.locator("p").first()))}`;
      };
      const [fA, fL, fT] = [await fmt(allianz), await fmt(lonpac), await fmt(tokio)];
      await ts.prove("E1", {
        shows:
          `Allianz contact lines (${lines.length}): ${lines.map((l) => `"${l.label}" "${l.number}"`).join("; ") || "none"}` +
          `${banned.length ? `; also shows ${banned.join(", ")}` : ""}. Format Allianz ${fA}; Lonpac ${fL}; Tokio Marine ${fT}`,
        match:
          lines.length === 1 && lines[0].label === ALLIANZ_HELPLINE_LABEL && lines[0].number === ALLIANZ_HELPLINE_NUMBER &&
          banned.length === 0 && fA === fL && fA === fT,
        hl: sup.contactLines(allianz),
        name: "support-allianz-expanded-contact-line",
      });

      const notes = sup.notes(allianz);
      const noteTexts = (await notes.allInnerTexts()).map(clean);
      const lastLine = sup.contactLines(allianz).last();
      const below = noteTexts.length ? (await box(notes.first())).y >= (await box(lastLine)).y + (await box(lastLine)).height - 1 : false;
      await ts.prove("E2", {
        shows: `below the contact details: ${noteTexts.map((t) => `"${t}"`).join(" | ") || "nothing"}${noteTexts.length ? ` (under the contact line: ${below})` : ""}`,
        match: noteTexts.length === 1 && noteTexts[0] === ALLIANZ_TOWING && below,
        hl: notes,
        name: "support-allianz-towing-sentence",
      });

      // Step 2: collapse Allianz
      const closed = !(await sup.setOpen(allianz, false));
      const lineShown = await sup.contactLines(allianz).first().isVisible();
      const noteShown = await notes.first().isVisible().catch(() => false);
      // the other insurers when closed (closed here if one is open): their details hidden too
      for (const s of [lonpac, tokio]) await sup.setOpen(s, false);
      const othersClosedHidden = !(await sup.isOpen(lonpac)) && !(await sup.contactLines(lonpac).first().isVisible()) && !(await sup.isOpen(tokio)) && !(await sup.contactLines(tokio).first().isVisible());
      await ts.prove("E3", {
        shows: `Allianz collapsed: header closed ${closed}, contact line shown ${lineShown}, towing sentence shown ${noteShown}; Lonpac / Tokio Marine closed with details hidden: ${othersClosedHidden}`,
        match: closed && !lineShown && !noteShown && othersClosedHidden,
        hl: [sup.collapsableHeader(allianz), sup.collapsableHeader(lonpac), sup.collapsableHeader(tokio)],
        name: "support-allianz-collapsed",
      });
    },
  );

  // ------------------------------------------------------------------ look against the mockup
  test(
    "12406_CP_TS6 — About Us, FAQs and Support changed blocks look as the mockup 20261015, no mockup review marks",
    { tag: ["@P2", "@func", "@sheet-CP"] },
    async ({ ts }) => {
      ts.side = SIDE;
      // -------- Step 1: About Us > Our partnership beside the mockup
      await openMockup(ts.page, "about-us");
      const mP = mockupPartnership(ts.page);
      const mLook = await lookOf(mP);
      const mOthers = await Promise.all([0, 1, 3].map((i) => lookOf(ts.page.locator("section#about-us p").nth(i))));
      await ts.shot("mockup-about-us-our-partnership", `MOCKUP 20261015 Our partnership: ${fontKey(mLook)}, ${mLook.textAlign}`, mP);

      await openSecarangInfoPage(ts.page, "About Us");
      const about = new SecarangAboutUsPage(ts.page);
      const sLook = await lookOf(about.partnershipParagraph());
      const nP = await about.paragraphs().count();
      const sOthers: SecarangLook[] = [];
      for (let i = 0; i < nP; i++) {
        const t = clean(await about.paragraphs().nth(i).innerText());
        if (!t.startsWith("At SeCarang")) sOthers.push(await lookOf(about.paragraphs().nth(i)));
      }
      const sameAsRest = sOthers.length > 0 && sOthers.every((o) => fontKey(o) === fontKey(sLook));
      const asMockup = font1(sLook.fontFamily) === font1(mLook.fontFamily) && sLook.color === mLook.color && sLook.textAlign === "center" && mLook.textAlign === "center";
      await ts.prove("E1", {
        shows:
          `site Our partnership: ${fontKey(sLook)}, ${sLook.textAlign}; the other About Us paragraphs: ${[...new Set(sOthers.map(fontKey))].join(" / ")}; ` +
          `mockup: ${fontKey(mLook)}, ${mLook.textAlign} (mockup's other About Us paragraphs ${[...new Set(mOthers.map((o) => o.fontSize))].join(" / ")}; the mockup is drawn at its own size, compared: font, colour, centred)`,
        match: sameAsRest && asMockup,
        hl: about.partnershipParagraph(),
        name: "about-us-our-partnership-look",
      });
      const aboutMarks = [
        ...(await about.reviewMarks(about.partnershipHeading())),
        ...(await about.reviewMarks(about.partnershipParagraph())),
        ...(await about.reviewMarks(ts.page.locator("body"), true)),
      ];
      const menuMarks = await about.menuMarks();
      await ts.prove("E5", {
        expected: "About Us and the top menu: no mockup review mark (pill, yellow highlight, frame, menu dot)",
        shows: `About Us review marks: ${aboutMarks.join("; ") || "none"}; top menu marks: ${menuMarks.join("; ") || "none"}`,
        match: aboutMarks.length === 0 && menuMarks.length === 0,
        hl: [about.partnershipParagraph(), about.menuLink("About Us"), about.menuLink("FAQs"), about.menuLink("Support")],
        name: "about-us-no-review-marks",
      });

      // -------- Step 2a: FAQs 'Which insurers…' (expanded) beside the mockup
      await openMockup(ts.page, "faqs");
      await ts.shot("mockup-faq-which-insurers", "MOCKUP 20261015 FAQ 'Which insurers…' open", mockupFaqWhichInsurers(ts.page));
      await openSecarangInfoPage(ts.page, "FAQs");
      const faq = new SecarangFaqPage(ts.page);
      const q = faq.question(FAQ_WHICH_INSURERS);
      const other = faq.collapsables().first(); // "Who can use the service provided by Insurance?"
      const qClosedIcon = await faq.iconClass(q);
      const otherClosedIcon = await faq.iconClass(other);
      expect(await faq.setOpen(q, true), "the question did not open").toBe(true);
      const qOpenIcon = await faq.iconClass(q);
      const items = faq.answerItems(q);
      const looks: string[] = [];
      for (let i = 0; i < (await items.count()); i++) {
        const l = await lookOf(items.nth(i));
        looks.push(`${clean(await items.nth(i).innerText())}: ${fontKey(l)} ${l.display} ${l.listStyleType}`);
      }
      const key = (s: string) => s.slice(s.indexOf(":") + 2);
      const azLine = looks.find((l) => l.startsWith(ALLIANZ));
      const sameLines = !!azLine && looks.length === 3 && looks.every((l) => key(l) === key(azLine));
      // the other question in the same states, for "as the other questions"
      expect(await faq.setOpen(other, true), "the first question did not open").toBe(true);
      const otherOpenIcon = await faq.iconClass(other);
      await faq.setOpen(other, false);
      const minusPlus = /\bbi-dash\b/.test(qOpenIcon) && /\bbi-plus(-lg)?\b/.test(qClosedIcon) && qOpenIcon === otherOpenIcon && qClosedIcon === otherClosedIcon;
      await ts.prove("E2", {
        shows: `answer lines: ${looks.join(" | ")}. Icon on 'Which insurers…' open "${qOpenIcon}" (−), closed "${qClosedIcon}" (+); first question open "${otherOpenIcon}", closed "${otherClosedIcon}"`,
        match: sameLines && minusPlus,
        hl: [faq.collapsableIcon(q), items],
        name: "faq-which-insurers-look",
      });
      const faqMarks = [...(await faq.reviewMarks(q)), ...(await faq.reviewMarks(ts.page.locator("body"), true))];
      await ts.prove("E5", {
        expected: "FAQs: no mockup review mark ('Changed: Allianz added' / 'New' pills, yellow highlight)",
        shows: `FAQ review marks: ${faqMarks.join("; ") || "none"}`,
        match: faqMarks.length === 0,
        hl: q,
        name: "faq-no-review-marks",
      });

      // -------- Step 2b: Support > Allianz (expanded) beside the mockup
      await openMockup(ts.page, "support");
      await ts.shot("mockup-support-allianz", "MOCKUP 20261015 Support > Allianz open", mockupSupportAllianz(ts.page));
      await openSecarangInfoPage(ts.page, "Support");
      const sup = new SecarangSupportPage(ts.page);
      const az = sup.section("Allianz");
      const lp = sup.section("Lonpac");
      const tm = sup.section("Tokio Marine");
      for (const s of [lp, az, tm]) await sup.setOpen(s, true);
      const layout = async (s: typeof az) => {
        const li = sup.contactLines(s).first();
        if (!(await li.count())) return { key: "no contact line", label: "", below: false, icon: "" };
        const h6 = li.locator("h6").first();
        const p = li.locator("p").first();
        const liL = await lookOf(li);
        const b6 = await box(h6);
        return {
          key: `header ${fontKey(await lookOf(sup.sectionName(s)))}; icon ${await sup.iconClass(s)}; bullet ${liL.display} ${liL.listStyleType}; label ${fontKey(await lookOf(h6))}; number ${fontKey(await lookOf(p))}`,
          label: clean(await h6.innerText()),
          below: (await box(p)).y >= b6.y + b6.height - 1,
          icon: await sup.iconClass(s),
        };
      };
      const [lA, lL, lT] = [await layout(az), await layout(lp), await layout(tm)];
      await ts.prove("E3", {
        shows: `Allianz: ${lA.key}; label "${lA.label}", number below the label: ${lA.below}. Lonpac: ${lL.key}, number below: ${lL.below}. Tokio Marine: ${lT.key}, number below: ${lT.below}. Mockup: bullet, label "24-Hours Helpline", number below it`,
        match: lA.key === lL.key && lA.key === lT.key && lA.label === ALLIANZ_HELPLINE_LABEL && lA.below && lL.below && lT.below,
        hl: [sup.collapsableHeader(az), sup.contactLines(az)],
        name: "support-allianz-layout",
      });

      const note = sup.notes(az).first();
      const hasNote = (await sup.notes(az).count()) === 1;
      const noteText = hasNote ? clean(await note.innerText()) : "";
      const nb = hasNote ? await box(note) : { x: 0, y: 0, width: 0, height: 0 };
      const cb = await box(sup.collapsableContent(az));
      const lastLi = await box(sup.contactLines(az).last());
      const noteLook = hasNote ? await lookOf(note) : null;
      const inLi = hasNote ? await note.evaluate((e) => !!e.closest("li")) : false;
      const fullWidth = nb.width >= 0.9 * cb.width;
      const under = nb.y >= lastLi.y + lastLi.height - 1;
      const plain = !!noteLook && noteLook.display !== "list-item" && !inLi && !/^[•\-*]/.test(noteText);
      await ts.prove("E4", {
        shows: `towing sentence: ${hasNote ? `"${noteText}"` : "none"}; width ${Math.round(nb.width)} of ${Math.round(cb.width)}px; under the contact line: ${under}; bullet: ${plain ? "none" : `yes (${noteLook?.display}, inside a list item: ${inLi})`}; number "1800-22-5542" with hyphens: ${noteText.includes("1800-22-5542")}`,
        match: hasNote && fullWidth && under && plain && noteText.includes("1800-22-5542"),
        hl: note,
        name: "support-allianz-towing-sentence-look",
      });

      const marksOf = async (s: typeof az) => (await sup.reviewMarks(s)).join("; ");
      const [mA, mL, mT] = [await marksOf(az), await marksOf(lp), await marksOf(tm)];
      const [bgA, bgL, bgT] = [await lookOf(az.locator(".collapsable-header")), await lookOf(lp.locator(".collapsable-header")), await lookOf(tm.locator(".collapsable-header"))];
      const frame = (l: SecarangLook) => `${l.backgroundColor} outline ${l.outline}`;
      const supPills = await sup.reviewMarks(ts.page.locator("body"), true);
      await ts.prove("E5", {
        expected: "Support: no mockup review mark; the Allianz section has the same background and no frame, like Lonpac / Tokio Marine",
        shows: `Allianz section marks: ${mA || "none"} (Lonpac: ${mL || "none"}; Tokio Marine: ${mT || "none"}); header Allianz ${frame(bgA)}, Lonpac ${frame(bgL)}, Tokio Marine ${frame(bgT)}; pills / <mark> on the page: ${supPills.join("; ") || "none"}`,
        match: !mA && !mL && !mT && frame(bgA) === frame(bgL) && frame(bgA) === frame(bgT) && supPills.length === 0,
        hl: [az, lp, tm],
        name: "support-no-review-marks",
      });

      // -------- Step 4: Home logos, size and alignment (recorded, no Home mockup; Q38)
      await runSecarangFlow(ts.page, { stopAfter: "home" });
      const home = new SecarangHomePage(ts.page);
      const row = await home.logoRow();
      ts.note(`Q38 (recorded, not judged): Home logos ${row.map((l) => `${l.file} ${l.width}x${l.height} at x${l.x} y${l.y}`).join("; ")}`);
      await ts.shot("home-logos-recorded", `Home logos (recorded, Q38): ${row.map((l) => `${insurerOfLogo(l.file)} ${l.width}x${l.height} y${l.y}`).join(", ")}`, home.logoRowFrame()); // the whole logo row framed (ts.shot outlines only the first match)
    },
  );
});
