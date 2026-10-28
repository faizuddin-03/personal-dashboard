import { test, expect } from "../fixtures/test-fixtures";
import { ENV } from "../utils/config";
import { arrangeBdpReferenceViaUCD } from "../utils/arrange";
import { uniqueSerials } from "../utils/serials";

/**
 * 12166_67_E2E_TS08 — Device Serial No. validation on the Update Shipping
 * Details popup: blank, too short, too long, character filtering, a
 * duplicate — then correcting everything and saving successfully.
 *
 * Message sourcing:
 *  - blank / length errors: exact text confirmed live
 *    (_reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html)
 *  - character filtering: CORRECTED 2026-09-24 per Faizuddin's exact
 *    behaviour list — symbols and Chinese characters are NOT rejected on
 *    save, they're silently STRIPPED LIVE as the user types (and on paste
 *    too), leaving valid letters/numbers in place. The field never holds an
 *    invalid character at all, so there's no save-time rejection to test
 *    here — only the live-stripped input value. (Previous version of this
 *    step wrongly assumed a save-time rejection, which meant the popup
 *    actually saved and closed during this step — since a stripped symbol
 *    value is valid+unique — leaving no popup for the duplicate-serial step
 *    that ran after it, which is why that step timed out waiting for a
 *    dialog that could never fire.)
 *  - duplicate: rendering CORRECTED 2026-09-24 per Faizuddin's manual check
 *    — QA-Issue EAINT-12394 (native alert() instead of inline error) is no
 *    longer reproducible; it now renders inline, same as every other field
 *    error on this popup. Asserted via the DOM locator, not a dialog
 *    listener. Message text CORRECTED again 2026-09-24 (first live run of
 *    the fixed assertion) — it's just "Duplicate serial number.", not the
 *    longer "Duplicate device serial number. Each serial number must be
 *    unique." sentence assumed before (never actually confirmed live).
 *  - duplicate, which field gets flagged: CONFIRMED 2026-09-24 per Faizuddin
 *    — only the LATER occurrence of a duplicated value is flagged; the
 *    FIRST occurrence shows no error at all. This is expected behaviour, not
 *    a bug (QA-Issue EAINT-12404 was raised over this, then closed once
 *    confirmed).
 */
test.describe("12166/12167 E2E — TS08 serial validation", () => {
  test("12166_67_E2E_TS08", async ({ page, loginPage, boListingPage, boDevicePurchaseDetailsPage }) => {
    const deviceQty = 2;
    // 2 installs, at/under the "5 or less" threshold — books a real slot
    // (per Faizuddin, 2026-09-24) so the appointment shows on the DO.
    const ref = await arrangeBdpReferenceViaUCD(page, { deviceQty, bookSlot: true });
    if (!ref) {
      test.skip(true, "Could not arrange a fresh 2-device Biometric Device Purchase via UCD.");
      return;
    }

    await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
    await boListingPage.navigate();
    await boListingPage.searchWithFilters({ referenceNo: ref, deliveryStatus: "New" });
    const rows = await boListingPage.getResultRows();
    expect(rows.length).toBeGreaterThan(0);
    await boListingPage.clickView(rows[0]);

    await boDevicePurchaseDetailsPage.openUpdateShippingDetails();
    const inputs = await boDevicePurchaseDetailsPage.shipSerialInputs.all();
    expect(inputs.length).toBe(deviceQty);

    // Two genuinely unique serials — reused as the "valid" values across every
    // step below. Hardcoded literals would collide with an earlier run of
    // this same test (serial uniqueness is system-wide, not per-transaction —
    // see uniqueSerials()'s own doc comment).
    const [serialA, serialB] = uniqueSerials(2);

    await test.step("13 characters -> input hard-stops at 12, 13th character never enters, no error shown", async () => {
      // Runs first, before anything triggers a save attempt: the inline
      // error div is only ever updated by the app on Update-click, not live
      // per keystroke — checking "no error shown" after an earlier step's
      // rejected save would just see that stale message, not a fresh one
      // caused by this action. Reverted 2026-09-24 per Faizuddin — the field
      // is a genuine hard input stop at 12 chars (matching the SRD's own
      // "12 chars is a hard input stop" wording): maxlength=12 blocks the
      // 13th keystroke via a normal .fill() too (Playwright respects
      // maxlength), so there is no way to reach 13 characters through the UI
      // at all, and no save-time error is ever triggered by this case.
      //
      // The error div is ALWAYS in the DOM with its default "This field is
      // required" text, hidden via style="display: none;" until a save
      // attempt toggles it (confirmed live —
      // _reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html,
      // line 203). So "no error shown" has to be a visibility check, not a
      // textContent check — textContent reads the hidden default text
      // regardless of display state.
      await inputs[0].fill("THIRTEENCHR12"); // 13 characters typed
      await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
      const value = await inputs[0].inputValue();
      expect(value.length, "the field must never hold more than 12 characters").toBe(12);
      expect(value).toBe("THIRTEENCHR1"); // the 13th character ("2") was dropped, not just untyped
      const errVisible = await boDevicePurchaseDetailsPage.getSerialFieldError(0).isVisible().catch(() => false);
      expect(errVisible, "no error should show — the field never held an invalid value").toBe(false);
    });

    await test.step("Blank field -> 'This field is required'", async () => {
      await inputs[0].fill("");
      await inputs[1].fill(serialB);
      await boDevicePurchaseDetailsPage.setDeliveryDate(boDevicePurchaseDetailsPage.daysFromToday(3));
      await boDevicePurchaseDetailsPage.setConsignmentNumber(`TS08${Date.now()}`.slice(-12));
      await boDevicePurchaseDetailsPage.setDeliveryStatusToNextOption();
      await boDevicePurchaseDetailsPage.attemptRejectedSave();
      await boDevicePurchaseDetailsPage.demoHighlight(boDevicePurchaseDetailsPage.getSerialFieldError(0), { color: "red" });
      await expect(boDevicePurchaseDetailsPage.getSerialFieldError(0)).toContainText("This field is required");
    });

    await test.step("7 characters -> length error", async () => {
      await inputs[0].fill("SHORT12");
      await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
      await boDevicePurchaseDetailsPage.attemptRejectedSave();
      await boDevicePurchaseDetailsPage.demoHighlight(boDevicePurchaseDetailsPage.getSerialFieldError(0), { color: "red" });
      await expect(boDevicePurchaseDetailsPage.getSerialFieldError(0)).toContainText(
        "Device Serial No. must be between 8 and 12 characters.",
      );
    });

    await test.step("Character filtering — letters/numbers kept, Chinese and symbols stripped live", async () => {
      // Real keystrokes (pressSequentially), not .fill() — .fill() sets the
      // value directly and never fires the per-keystroke input events the
      // live-stripping JS listens on. Paste is simulated via the clipboard +
      // Ctrl+V, which is the only way to exercise the app's separate
      // paste-handling path (also confirmed to strip, per Faizuddin).
      const pasteInto = async (locator: import("@playwright/test").Locator, text: string) => {
        await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
        await page.evaluate((t) => navigator.clipboard.writeText(t), text);
        await locator.click();
        await locator.press("Control+A");
        await locator.press("Control+V");
      };

      await test.step("English letters and numbers typed -> all accepted as-is", async () => {
        await inputs[0].fill("");
        await inputs[0].pressSequentially("SN928F940J");
        await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
        expect(await inputs[0].inputValue()).toBe("SN928F940J");
      });

      await test.step("Chinese characters typed via keyboard -> stripped live", async () => {
        await inputs[0].fill("");
        await inputs[0].pressSequentially("你好世界");
        expect(await inputs[0].inputValue()).toBe("");
      });

      await test.step("Chinese characters pasted -> stripped", async () => {
        await inputs[0].fill("");
        await pasteInto(inputs[0], "你好世界");
        expect(await inputs[0].inputValue()).toBe("");
      });

      await test.step("Pasted English+Chinese mix -> only the Chinese is stripped", async () => {
        await inputs[0].fill("");
        await pasteInto(inputs[0], "SN94039煎饺pls");
        await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
        expect(await inputs[0].inputValue()).toBe("SN94039pls");
      });

      await test.step("Symbols typed via keyboard -> stripped live", async () => {
        await inputs[0].fill("");
        await inputs[0].pressSequentially("!@#$%");
        expect(await inputs[0].inputValue()).toBe("");
      });

      await test.step("Symbols pasted -> stripped", async () => {
        await inputs[0].fill("");
        await pasteInto(inputs[0], "!@#$%");
        expect(await inputs[0].inputValue()).toBe("");
      });

      await test.step("Pasted letters+symbols mix -> only the symbols are stripped", async () => {
        await inputs[0].fill("");
        await pasteInto(inputs[0], "BDP92!%@4X3");
        await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
        expect(await inputs[0].inputValue()).toBe("BDP924X3");
      });
    });

    await test.step("Duplicate serial across two fields -> inline field error", async () => {
      // CORRECTED 2026-09-24 per Faizuddin's manual check — this used to be
      // a native browser alert() (QA-Issue EAINT-12394 flagged that
      // inconsistency), but it now renders the same way as every other
      // field error on this popup: inline, under the input, no dialog at
      // all. The old dialog-listener version hung forever waiting for a
      // native dialog that no longer fires.
      await inputs[0].fill(serialB); // same as inputs[1] — intentional, tests the duplicate check itself
      await boDevicePurchaseDetailsPage.demoHighlight(inputs[0]);
      await boDevicePurchaseDetailsPage.attemptRejectedSave();

      // CONFIRMED 2026-09-24 per Faizuddin — this is the intended behaviour,
      // not a bug: only the LATER occurrence of a duplicated value gets
      // flagged. Field 1 (the first occurrence) must show no error at all;
      // field 2 (the later occurrence) shows the duplicate message. QA-Issue
      // EAINT-12404 (raised over this same observation) was raised, then
      // closed once this was confirmed as expected.
      const err0 = boDevicePurchaseDetailsPage.getSerialFieldError(0);
      const err1 = boDevicePurchaseDetailsPage.getSerialFieldError(1);
      await expect(err0, "the first occurrence must show no error").not.toBeVisible();
      await boDevicePurchaseDetailsPage.demoHighlight(err1, { color: "red" });
      // CORRECTED 2026-09-24 — the real message is just "Duplicate serial
      // number." (confirmed live). The longer sentence asserted here before
      // ("Duplicate device serial number. Each serial number must be
      // unique.") was never actually confirmed live — it was carried over
      // from an earlier assumption and never re-checked.
      await expect(err1).toContainText("Duplicate serial number.");
    });

    await test.step("All serials valid and unique -> save succeeds", async () => {
      await inputs[0].fill(serialA);
      await inputs[1].fill(serialB);
      await boDevicePurchaseDetailsPage.submitUpdateShippingDetails();
      expect(await boDevicePurchaseDetailsPage.getDeliveryStatus()).toContain("Arranged");
    });
  });
});
