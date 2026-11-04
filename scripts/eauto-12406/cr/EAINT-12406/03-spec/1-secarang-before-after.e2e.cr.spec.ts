// @ticket   EAINT-12406
// @sheet    1 Secarang Pages (CP)
// @cases    12406_CP_TS8 [post-push]
// @env      Secarang staging /ia/ (INSTANCE=ia), CR_PHASE=post-push
// @status   draft
//
// 12406_CP_TS8 (yellow TS No, pre-deploy) — the AFTER half as a gated spec (29.10.2026, cr-author).
// The BEFORE half was captured on 28.10.2026 15:14-15:23 MYT on staging /ia/ with the old build, by the one-off tool
// 03-spec/before-run/ts-before.mjs (outside the per-TS gate), into 05-evidence/pre-push/12406_CP_TS8/ (screenshots,
// video, 12406_CP_TS8_page-texts-before.json, 12406_CP_TS8_note.md). Dev has since deployed (Azfar 29.10.2026), so the
// BEFORE cannot be redone: there is no [pre-push] test here (a pre-push run now would capture the NEW build as BEFORE).
// E1, E3, E4, E5 (BEFORE) are proved BY REFERENCE from that record: its own text and screenshots, copied into this TS's
// folder, named FROM-THE-BEFORE-CAPTURE-…, captioned "FROM THE BEFORE CAPTURE" and shown in this TS's video (Azfar
// 29.10.2026, proposed change C1). The BEFORE record wrote no evidence.seed(); its page texts file is the seed and is read
// directly.
// E2 (v5, Azfar 29.10.2026): "BEFORE: not captured before the deploy (made-up IC got 'no instant quotation' on 28.10; old
// build gone): recorded as not available". Proved from the same record: its step-2 state is the pop-up with "no instant
// quotation", and it holds no All Quotations screenshot. It fails if the record shows All Quotations was reached.
// Revised 29.10.2026 (cr-author) after v5; this spec has not run yet.
// Fixed 29.10.2026 (cr-author, triage of the 13:23 run): the AFTER Home logo order came from SecarangHomePage.logoRow()
// read while the logos were still sliding in and sorted by y first; logoRow() now waits for them to stop and orders
// them left to right within the row, and the logos are let settle before each outline. The assertions are unchanged.
// E6 (AFTER): steps 1-5 again on the new build; the page texts are compared line by line with the BEFORE texts, and
// every difference must be one of the Allianz changes of 12406_CP_TS1 to CP_TS5 (./_cp-expected.ts).
//
// @destructive: step 2 presses Get quotation (a quotation request to the insurer simulator; whether a quotation alone
// leaves a CIBO row is not known, flow note). Nothing is bought.
// Flow: secarang (VERIFIED 29.10.2026, cr-evidence; runs pp1 / fx5 in 04-runs/): runSecarangFlow stopAfter "home" and
// "quotations", openSecarangInfoPage.
import { test, expect, type TsRun } from "@fixtures";
import * as fs from "node:fs";
import * as path from "node:path";
import { currentPhase } from "@fixtures/evidence";
import { runSecarangFlow, openSecarangInfoPage, SecarangQuoteRefused } from "@flows/secarang.flow";
import { SecarangHomePage, insurerOfLogo } from "@pages/secarang/home.page";
import { SecarangAboutUsPage } from "@pages/secarang/about-us.page";
import { SecarangFaqPage, FAQ_WHICH_INSURERS } from "@pages/secarang/faq.page";
import { SecarangSupportPage } from "@pages/secarang/support.page";
import { SECARANG_QUOTE_CANDIDATES } from "@data/secarang";
import {
  ALLIANZ, LONPAC, TOKIO, PARTNERSHIP_PARAGRAPH, PARTNERSHIP_OLD_ENDING, ALLIANZ_HELPLINE_LABEL, ALLIANZ_HELPLINE_NUMBER,
  ALLIANZ_TOWING, FROM_BEFORE, beforeTexts, beforeShot, beforeAllQuotationsShots, clean, sameList, linesOf, diffLines,
} from "./_cp-expected";

const SIDE = "Secarang (public site, no login)";

/** A BEFORE screenshot copied into this TS's folder (named FROM-THE-BEFORE-CAPTURE-…) and shown in the video; returns the copy. */
async function beforeEvidence(ts: TsRun, name: string, what: string): Promise<string> {
  const copy = path.join(ts.dir, ts.numbered(`FROM-THE-BEFORE-CAPTURE-${path.basename(name, ".png").replace(/^12406_CP_TS8_/, "")}`));
  fs.copyFileSync(beforeShot(name), copy);
  await ts.showFile(copy, `${FROM_BEFORE} (28.10.2026 15:22 MYT, staging /ia/, old build, before Dev deployed): ${what}`);
  return copy;
}

/** The page's text as the BEFORE half read it (document.body.innerText), without this run's overlays. */
const pageLines = async (ts: TsRun) => linesOf(await ts.page.evaluate(() => document.body.innerText));

test.describe("EAINT-12406 sheet CP: before / after the deploy", () => {
  // Skipped here, not inside the test: a skip inside the test would still start the ts fixture and file an empty run.
  test.skip(currentPhase() !== "post-push", "AFTER half of 12406_CP_TS8: runs only with CR_PHASE=post-push (cr-run.mjs --phase post-push)");

  test(
    "12406_CP_TS8 [post-push] — Home, About Us, FAQs and Support differ from BEFORE only by the Allianz changes",
    { tag: ["@P2", "@e2e", "@sheet-CP", "@post-push", "@destructive"] },
    async ({ ts }) => {
      ts.side = SIDE;
      const before = beforeTexts();

      // ---------------------------------------------------------------- BEFORE (by reference)
      await ts.offscreen("BEFORE half: the record of 28.10.2026", "05-evidence/pre-push/12406_CP_TS8 (old build, staging /ia/)");
      const bLogos = before.homeLogos.map((l) => insurerOfLogo(l.src.split("/").pop() ?? ""));
      await ts.prove("E1", {
        shows: `BEFORE record: Home logos left to right ${before.homeLogos.map((l) => l.src.split("/").pop()).join(", ")}`,
        match: sameList(bLogos, ["Lonpac", "Tokio Marine"]),
        file: await beforeEvidence(ts, "12406_CP_TS8_E1_home-insurer-logos.png", "Home insurer logos"),
      });

      // E2 (v5): not captured before the deploy, recorded as not available (Azfar 29.10.2026)
      const bq = before.quotation;
      const aqShots = beforeAllQuotationsShots();
      const notReached = !!bq && bq.state === "popup" && /no instant quotation/i.test(bq.text ?? "") && aqShots.length === 0;
      await ts.prove("E2", {
        shows:
          `${FROM_BEFORE}: step 2 (HXA0001A, made-up IC, 55000) ended on ${bq ? `a ${bq.state}: "${clean(bq.text).slice(0, 120)}"` : "(no step-2 entry in the record)"}; ` +
          `All Quotations screenshots in the record: ${aqShots.join(", ") || "none"}. Old build gone (deployed 29.10): All Quotations BEFORE recorded as not available`,
        match: notReached,
        file: await beforeEvidence(ts, "12406_CP_TS8_E2_02-popup-after-get-quotation.png", "step 2 answered 'no instant quotation': All Quotations not captured before the deploy"),
      });

      const bPartner = linesOf(before.aboutUs).find((l) => l.startsWith("At SeCarang")) ?? "";
      await ts.prove("E3", {
        shows: `BEFORE record: Our partnership "${bPartner || "(not found)"}"`,
        match: bPartner.endsWith(PARTNERSHIP_OLD_ENDING),
        file: await beforeEvidence(ts, "12406_CP_TS8_E3_about-us-our-partnership.png", "About Us > Our partnership"),
      });

      const fl = linesOf(before.faq);
      const qi = fl.indexOf(FAQ_WHICH_INSURERS);
      const nextQ = qi >= 0 ? fl.findIndex((l, i) => i > qi && before.faqOpen.some(([q]) => clean(q) === l)) : -1;
      const bAnswer = qi >= 0 ? fl.slice(qi + 1, nextQ > qi ? nextQ : qi + 1) : [];
      await ts.prove("E4", {
        shows: `BEFORE record: FAQ 'Which insurers…' lists ${bAnswer.join(" | ") || "(not found)"}`,
        match: sameList(bAnswer, [LONPAC, TOKIO]),
        file: await beforeEvidence(ts, "12406_CP_TS8_E4_faq-which-insurers-instant-quotation.png", "FAQ 'Which insurers can I get instant quotation from?'"),
      });

      const bSections = before.supportSections.map((s) => clean(s.insurer));
      await ts.prove("E5", {
        shows: `BEFORE record: Support > Need to contact insurance company? sections ${bSections.join(" | ")}`,
        match: sameList(bSections, [LONPAC, TOKIO]),
        file: await beforeEvidence(ts, "12406_CP_TS8_E5_support-need-to-contact-insurance-company-all-open.png", "Support > Need to contact insurance company? (all open)"),
      });

      // ---------------------------------------------------------------- AFTER: steps 1-5 again
      await ts.offscreen("AFTER the deploy: steps 1-5 again", "same staging /ia/, same data");
      const after: Record<string, unknown> = {};

      // Step 1: Home logos
      await runSecarangFlow(ts.page, { stopAfter: "home" });
      const home = new SecarangHomePage(ts.page);
      const aLogos = await home.logoRow();
      after.homeLogos = aLogos;
      await home.scrollThrough(); // as the BEFORE half did before reading the page
      const homeLines = await pageLines(ts);
      after.home = homeLines.join("\n");
      await home.logosSettled(); // scrollThrough brought the logos back in: let them settle before outlining them
      await ts.shot("after-home-logos", `AFTER Home logos: ${aLogos.map((l) => l.file).join(", ")}`, home.logoRowFrame()); // the whole logo row framed (ts.shot outlines only the first match)

      // Step 2: the same car + owner as BEFORE > All Quotations (recorded; do not pay)
      const { note: _n, ...form } = SECARANG_QUOTE_CANDIDATES[0];
      const quoteForm = {
        plateNo: process.env.CP_TS8_PLATE ?? form.plateNo,
        idNo: process.env.CP_TS8_IC ?? form.idNo,
        postalCode: process.env.CP_TS8_POSTCODE ?? form.postalCode,
      };
      try {
        const q = await runSecarangFlow(ts.page, { form: quoteForm, stopAfter: "quotations" });
        after.quotation = q.quotations;
        ts.note(`step 2 (recorded): All Quotations for ${quoteForm.plateNo}: ${(q.quotations ?? []).map((c) => `${c.insurer} ${c.available ? c.prices.join("/") : `unavailable "${c.unavailableReason}"`}`).join("; ")}`);
        await ts.shot("after-all-quotations", "AFTER All Quotations (recorded, not judged here)", ts.page.locator(".insurance-card").filter({ visible: true }));
      } catch (e) {
        if (!(e instanceof SecarangQuoteRefused)) throw e;
        after.quotation = { refused: e.kind, text: e.popupText };
        ts.note(`step 2 (recorded): ${quoteForm.plateNo} refused (${e.kind}): "${e.popupText.slice(0, 200)}"`);
        await ts.shot("after-quotation-refused", `AFTER the quotation answered ${e.kind} (recorded)`, ts.page.locator("ngb-modal-window").filter({ visible: true }));
        // the answer pop-up is a message with OK (and the visitor form an X): OK only acknowledges it; the form is never filled
        const ok = home.modalButton(/^\s*OK\s*$/i);
        if (await ok.isVisible().catch(() => false)) await ok.click();
        else await home.closePromo();
      }
      // back to Home first: a menu link pressed on All Quotations may ask "Kindly confirm your navigation"
      await runSecarangFlow(ts.page, { stopAfter: "home" });

      // Step 3: About Us
      await openSecarangInfoPage(ts.page, "About Us");
      const about = new SecarangAboutUsPage(ts.page);
      await about.scrollThrough();
      const aboutLines = await pageLines(ts);
      after.aboutUs = aboutLines.join("\n");

      // Step 4: FAQs, every question open
      await openSecarangInfoPage(ts.page, "FAQs");
      const faq = new SecarangFaqPage(ts.page);
      const nFaq = await faq.openAll();
      const faqLines = await pageLines(ts);
      after.faq = faqLines.join("\n");
      ts.note(`FAQs: ${nFaq} questions opened (BEFORE: ${before.faqOpen.length})`);

      // Step 5: Support, every section open
      await openSecarangInfoPage(ts.page, "Support");
      const sup = new SecarangSupportPage(ts.page);
      const nSup = await sup.openAll();
      const supLines = await pageLines(ts);
      after.support = supLines.join("\n");
      ts.note(`Support: ${nSup} sections opened (BEFORE: ${before.supportSections.length})`);
      fs.writeFileSync(path.join(ts.dir, "12406_CP_TS8_page-texts-after.json"), JSON.stringify(after, null, 1));

      // ---------------------------------------------------------------- E6: compare, page by page
      const report = (page: string, d: ReturnType<typeof diffLines>) =>
        `${page}: ${d.unexpectedAdded.length || d.unexpectedRemoved.length ? "OTHER differences:" : "no other difference;"}` +
        `${d.unexpectedAdded.length ? ` added ${JSON.stringify(d.unexpectedAdded)}` : ""}${d.unexpectedRemoved.length ? ` removed ${JSON.stringify(d.unexpectedRemoved)}` : ""}` +
        ` (Allianz changes seen: added ${d.allowedSeen.added.length}, replaced ${d.allowedSeen.removed.length})`;

      // Home: no text change; logos BEFORE + Allianz (12406_CP_TS1)
      const dHome = diffLines(linesOf(before.home), homeLines, { added: [], removed: [] });
      const aNames = aLogos.map((l) => insurerOfLogo(l.file));
      const logosOnlyAllianz = sameList(aNames.filter((x) => x !== "Allianz"), bLogos);
      await runSecarangFlow(ts.page, { stopAfter: "home" });
      await home.logosSettled(); // the logos slide in on arrival: outline them only once still (13:23 run: frame drawn below Lonpac)
      await ts.prove("E6", {
        expected: "Home differs from BEFORE only by the Allianz logo (12406_CP_TS1)",
        shows: `${report("Home text", dHome)}; logos BEFORE ${bLogos.join(", ")} -> AFTER ${aNames.join(", ")}`,
        match: !dHome.unexpectedAdded.length && !dHome.unexpectedRemoved.length && logosOnlyAllianz,
        hl: home.logoRowFrame(), // the whole logo row (insurerLogos() framed Lonpac only: ts.shot outlines the first match)
        name: "after-home-compared",
      });

      // About Us: the Our partnership paragraph replaced (12406_CP_TS2)
      const dAbout = diffLines(linesOf(before.aboutUs), aboutLines, { added: [clean(PARTNERSHIP_PARAGRAPH)], removed: bPartner ? [bPartner] : [] });
      await openSecarangInfoPage(ts.page, "About Us");
      await ts.prove("E6", {
        expected: "About Us differs from BEFORE only by the Our partnership wording (12406_CP_TS2)",
        shows: report("About Us", dAbout),
        match: !dAbout.unexpectedAdded.length && !dAbout.unexpectedRemoved.length,
        hl: about.partnershipParagraph(),
        name: "after-about-us-compared",
      });

      // FAQs (all topics): the Allianz line added to 'Which insurers…' (12406_CP_TS3)
      const dFaq = diffLines(linesOf(before.faq), faqLines, { added: [ALLIANZ], removed: [] });
      await openSecarangInfoPage(ts.page, "FAQs");
      const q = faq.question(FAQ_WHICH_INSURERS);
      await faq.setOpen(q, true);
      await ts.prove("E6", {
        expected: "FAQs (all topics) differ from BEFORE only by the Allianz line in 'Which insurers can I get instant quotation from?' (12406_CP_TS3)",
        shows: `${report(`FAQs (${nFaq} questions open)`, dFaq)}`,
        match: !dFaq.unexpectedAdded.length && !dFaq.unexpectedRemoved.length && nFaq === before.faqOpen.length,
        hl: q,
        name: "after-faq-compared",
      });

      // Support: the Allianz section added (12406_CP_TS4, CP_TS5)
      const dSup = diffLines(linesOf(before.support), supLines, { added: [ALLIANZ, ALLIANZ_HELPLINE_LABEL, ALLIANZ_HELPLINE_NUMBER, ALLIANZ_TOWING], removed: [] });
      await openSecarangInfoPage(ts.page, "Support");
      await sup.openAll();
      await ts.prove("E6", {
        expected: "Support differs from BEFORE only by the Allianz section (12406_CP_TS4, CP_TS5)",
        shows: report(`Support (${nSup} sections open)`, dSup),
        match: !dSup.unexpectedAdded.length && !dSup.unexpectedRemoved.length,
        hl: sup.section("Allianz"),
        name: "after-support-compared",
      });
      expect(nSup, "Support shows no insurer section to compare").toBeGreaterThan(0);
    },
  );
});
