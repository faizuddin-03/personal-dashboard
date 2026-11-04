/**
 * Service Hub flows — Software Installation and Biometric Device Purchase.
 *
 * Same shape as `stms.flow.ts`: `stopAfter` names the step just COMPLETED, every
 * option has a default, and the result carries what the next step needs.
 *
 *   await runSoftwareInstallationFlow(page, { stopAfter: "payment" });      // on Step 1 Payment
 *   await runSoftwareInstallationFlow(page, { stopAfter: "payConfirm" });   // confirm dialog open
 *   await runBiometricPurchaseFlow(page, { stopAfter: "payment" });         // on Step 2 Payment
 *   await runBiometricPurchaseFlow(page, { withInstallation: false, stopAfter: "payConfirm" }); // device only
 *
 * Biometric Device Purchase variants (Azfar 21.10.2026): WITH installation (default, as below) and
 * WITHOUT ("I don't need software installation" on Step 2 Payment: Payment → Submission, no
 * Appointment; read from the page script, UNCONFIRMED until a paid run). See the BDP section.
 *
 * ── WHERE THESE STOP, AND WHY ──────────────────────────────────────────────────
 * Both services take payment BEFORE the appointment (observed 2026-10-20, staging /eauto/):
 *   Software Installation:     1 Payment → 2 Appointment → 3 Submission
 *   Biometric Device Purchase: 1 Selection → 2 Payment → 3 Appointment → 4 Submission
 * Stops:
 *  - `payment`     — ON the Payment step (nothing pressed after arrival); its final button is
 *                    Make Payment → "Sure to proceed with payment?" Next.
 *  - `appointment` — PAYS first (Next on that dialog; RM54.00 / RM850.00 on staging 20.10.2026),
 *                    then ON the Appointment calendar (nothing pressed after arrival); its final
 *                    button is Confirm Appointment, which submits with NO confirm dialog.
 *  - `slotPicked`  — a slot held, Confirm Appointment not pressed.
 *  - `submitted`   — FINAL STOP (SUBMITS): Submission `view/ucd/service-hub/installation/submitted.do?id=…`,
 *                    marker "Request Submitted" (`ServiceHubPage.submittedMarker`); SI Step 3 / BDP Step 4.
 * EAINT-12253 (21.10): final-step stop returns on arrival; nothing after it touches a dialog (BA rule
 * 21.10: the reminder shows on the final step after a successful payment / submission; for Service Hub
 * that reads as Submission, Q10 still to be confirmed by the BA). `payment` / `appointment` are kept as
 * they were. The slot modal `#si-ovl` is the app's own booking control, before the final step.
 *
 * The payment is not keyed on a vehicle (no RHB switch needed; accepted for AZFARAZO on 20.10.2026). Paying uses a staging appointment slot shared with other testers.
 *
 * Side effects: Biometric Selection → Next CREATES an unpaid purchase request
 * (`purchase/create.do`). Software Installation creates nothing until Make Payment → Next.
 * No MyKad / thumbprint. The page must ALREADY be signed in.
 * Register: UNVERIFIED (src/flows/README.md).
 */

import type { Page } from "@playwright/test";
import { ServiceHubPage } from "@pages/ucd/service-hub.page";
import { nextMobile } from "@data/generator";

// ── Software Installation ─────────────────────────────────────────────────────

/**
 * `payment`    — on Step 1 Payment (installation.do), quantity set, nothing paid
 * `payConfirm` — Make Payment pressed: "Sure to proceed with payment?" Back/Next dialog OPEN. Nothing paid
 * `appointment` — PAID; ON Step 2 Appointment (slot.do), nothing pressed after arrival
 * `slotPicked`  — first free slot held (modal Confirm); Confirm Appointment NOT pressed
 * `submitted`   — FINAL. Confirm Appointment pressed (SUBMITS): ON Step 3 Submission, "Request Submitted",
 *                 returned on arrival
 */
export type SoftwareInstallationStep = "payment" | "payConfirm" | "appointment" | "slotPicked" | "submitted";
const SI_ORDER: SoftwareInstallationStep[] = ["payment", "payConfirm", "appointment", "slotPicked", "submitted"];

export interface SoftwareInstallationScenario {
  /** Number of installations; uses the page's own +/- buttons. Default 1 (the page default). */
  quantity?: number;
  /** Default "payConfirm". */
  stopAfter?: SoftwareInstallationStep;
  /** At `payConfirm`, close the dialog with Back before returning. Default false. */
  closeDialog?: boolean;
}

export interface ServiceHubResult<S extends string> {
  stoppedAfter: S;
  flowSteps: { steps: string[]; active: string };
  total: string;
  payDialogText?: string;
  /** The paid request's id (`slot.do?id=` / `submitted.do?id=`), from `appointment` on. */
  requestId?: string;
  /** The date held at `slotPicked` / `submitted` (yyyy-mm-dd). */
  appointmentDate?: string;
  page: Page;
  hub: ServiceHubPage;
}

type AfterPay = "appointment" | "slotPicked" | "submitted";

/** Shared tail of both services: PAY (Next on the open dialog) → Appointment → slot → submit. */
async function afterPayConfirm<S extends string>(
  page: Page,
  hub: ServiceHubPage,
  base: Omit<ServiceHubResult<S>, "stoppedAfter">,
  reaches: (st: AfterPay) => boolean,
): Promise<ServiceHubResult<S>> {
  await hub.paymentDialog.locator("button.confirm-dialog-btn, button:text-is('Next')").first().click(); // PAYS
  await page.waitForURL(/service-hub\/installation\/slot\.do/, { timeout: 120_000 });
  const requestId = new URL(page.url()).searchParams.get("id") ?? undefined;
  if (!reaches("slotPicked")) return { ...base, requestId, stoppedAfter: "appointment" as S }; // nothing after arrival
  const appointmentDate = await hub.pickFirstFreeSlot();
  if (!reaches("submitted")) return { ...base, requestId, appointmentDate, stoppedAfter: "slotPicked" as S };
  await hub.confirmAppointment(); // returns on arrival at Submission
  // Reads the strip only; nothing after arrival touches a dialog (EAINT-12253).
  return { ...base, requestId, appointmentDate, flowSteps: await hub.flowSteps(), stoppedAfter: "submitted" as S };
}

export async function runSoftwareInstallationFlow(
  page: Page,
  s: SoftwareInstallationScenario = {},
): Promise<ServiceHubResult<SoftwareInstallationStep>> {
  const stopAfter = s.stopAfter ?? "payConfirm";
  if (!SI_ORDER.includes(stopAfter)) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const siReaches = (st: SoftwareInstallationStep) => SI_ORDER.indexOf(st) <= SI_ORDER.indexOf(stopAfter);
  const hub = new ServiceHubPage(page);
  await hub.open("software-installation");
  await page.waitForURL(/service-hub\/installation\.do/, { timeout: 30_000 });

  const qty = s.quantity ?? 1;
  for (let i = 1; i < qty; i++) await page.locator("button[onclick='siPayQty(1)']").click();

  const base = { flowSteps: await hub.flowSteps(), total: await hub.totalPayable(), page, hub };
  if (stopAfter === "payment") return { stoppedAfter: "payment", ...base };

  const payDialogText = await hub.openPaymentDialog();
  if (!siReaches("appointment")) {
    if (s.closeDialog) await hub.cancelPaymentDialog();
    return { stoppedAfter: "payConfirm", ...base, payDialogText };
  }
  return afterPayConfirm<SoftwareInstallationStep>(page, hub, { ...base, payDialogText }, siReaches);
}

// ── Biometric Device Purchase ─────────────────────────────────────────────────

/**
 * `selection`  — on Step 1 Selection (purchase.do), fields filled, Next NOT pressed
 * `payment`    — Next pressed: on Step 2 Payment (purchase/create.do), unpaid request created,
 *                with / without installation chosen (nothing pressed after the checkbox)
 * `payConfirm` — Make Payment pressed: confirm dialog OPEN. Nothing paid
 * `appointment` / `slotPicked` / `submitted` — WITH installation: as for Software Installation
 *   (PAYS RM850.00 on staging, then books the free installation on the same calendar)
 * `submitted`  — WITHOUT installation: PAYS, then straight to Step 4 Submission
 *   `installation/submitted.do?id=` (page script `PAID:SUB`), returned on arrival. UNCONFIRMED: the
 *   redirect and the "Request Submitted" marker for a device-only request are read from the page
 *   script / the with-installation Submission, to confirm on a paid run. `appointment` / `slotPicked`
 *   do not exist on this variant and throw.
 *
 * Variants (Azfar 21.10.2026; probe `cr/EAINT-12253/03-spec/probes-2110/p01`):
 *   WITH installation (default): 1 Selection → 2 Payment → 3 Appointment → 4 Submission
 *   WITHOUT installation:        1 Selection → 2 Payment → 4 Submission (strip still shows all four)
 * The choice is the "I don't need software installation" checkbox on Step 2 Payment, NOT on Selection.
 */
export type BiometricPurchaseStep = "selection" | "payment" | "payConfirm" | "appointment" | "slotPicked" | "submitted";
const BIO_ORDER: BiometricPurchaseStep[] = ["selection", "payment", "payConfirm", "appointment", "slotPicked", "submitted"];

export interface BiometricPurchaseScenario {
  /** Devices; default 1 (page default). */
  quantity?: number;
  /** Default: the prefilled recipient. */
  recipientName?: string;
  /** Default: a generated 01xxxxxxxx number (the prefilled profile number may fail validation). */
  contactNo?: string;
  /** Default: ship to the showroom address (prefilled). */
  deliveryAddress?: string;
  /**
   * Default true (the page default: free installation, booked on the Appointment calendar after paying).
   * false = tick "I don't need software installation" (`#installOptOut`) on Step 2 Payment: device only,
   * no Appointment step (UNVERIFIED past `payConfirm`).
   */
  withInstallation?: boolean;
  /** Default "payConfirm". */
  stopAfter?: BiometricPurchaseStep;
  /** At `payConfirm`, close the dialog with Back before returning. Default false. */
  closeDialog?: boolean;
}

export async function runBiometricPurchaseFlow(
  page: Page,
  s: BiometricPurchaseScenario = {},
): Promise<ServiceHubResult<BiometricPurchaseStep>> {
  const stopAfter = s.stopAfter ?? "payConfirm";
  const stopAt = BIO_ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: BiometricPurchaseStep) => BIO_ORDER.indexOf(st) <= stopAt;
  const withInstallation = s.withInstallation ?? true;
  if (!withInstallation && (stopAfter === "appointment" || stopAfter === "slotPicked")) {
    throw new Error(`stopAfter "${stopAfter}" does not exist WITHOUT installation (Payment → Submission).`);
  }

  const hub = new ServiceHubPage(page);
  await hub.open("biometric-device-purchase");
  await page.waitForURL(/service-hub\/purchase\.do/, { timeout: 30_000 });
  await hub.fillBiometricSelection({
    quantity: s.quantity,
    recipientName: s.recipientName,
    contactNo: s.contactNo ?? nextMobile(),
    deliveryAddress: s.deliveryAddress,
  });
  if (!reaches("payment")) return { stoppedAfter: "selection", flowSteps: await hub.flowSteps(), total: "", page, hub };

  await hub.biometricNextToPayment();
  if (!withInstallation) await hub.setBiometricInstallation(false); // default (with) needs no click
  const base = { flowSteps: await hub.flowSteps(), total: await hub.totalPayable(), page, hub };
  if (!reaches("payConfirm")) return { stoppedAfter: "payment", ...base };

  const payDialogText = await hub.openPaymentDialog();
  if (!reaches("appointment")) {
    if (s.closeDialog) await hub.cancelPaymentDialog();
    return { stoppedAfter: "payConfirm", ...base, payDialogText };
  }
  if (!withInstallation) {
    // FINAL STOP without installation: PAYS → Submission, returned on arrival. Reads the strip only;
    // nothing after arrival touches a dialog (EAINT-12253).
    const requestId = await hub.payToSubmission();
    return { ...base, payDialogText, requestId, flowSteps: await hub.flowSteps(), stoppedAfter: "submitted" };
  }
  return afterPayConfirm<BiometricPurchaseStep>(page, hub, { ...base, payDialogText }, reaches);
}
