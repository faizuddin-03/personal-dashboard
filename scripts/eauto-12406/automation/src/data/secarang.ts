/**
 * Secarang test data. ALL MADE UP: no real person's IC, plate, address, phone or email is written here.
 *
 * Faizuddin's data files (secarang-insurance `data/config.ts`, `data/regression.ts`) were NOT carried over: they
 * held the staging site password, a real-looking IC / vehicle / address and the bank simulator login. The site
 * password and logins live only in env/.staging.env-local.
 *
 * Quote data on staging /ia/ (on the insurer SIMULATOR on 28.10.2026, Azfar): the team doc §13 says plates
 * HXA0001A–HXA0020A and ZZZ1A quote Lonpac "with a real IC" and postcode 55000; QAT9100A gets "no instant
 * quotation". With the made-up IC 900101-14-5671, HXA0001A and HXA0003A got "no instant quotation" on
 * 28.10.2026 (cr/EAINT-12406/05-evidence/pre-push/12406_CP_TS8). The candidates below are what a run tries, in
 * order; which (if any) reached All Quotations is recorded in src/flows/README.md.
 * The team doc also says: do not set a vehicle prefix for insurance by default, prefixes drive simulator
 * outcomes (QA team, 27.10.2026).
 */

import type { SecarangQuoteForm } from "@pages/secarang/home.page";
import type { SandboxCard } from "@pages/secarang/fiuu-popup.page";

/** Made-up Private Car quote inputs, tried in this order (Azfar's brief 28.10.2026: the first + up to 3 others). */
export const SECARANG_QUOTE_CANDIDATES: (SecarangQuoteForm & { note: string })[] = [
  { plateNo: "HXA0001A", idNo: "900101145671", postalCode: "55000", note: "team plate, made-up IC 900101-14-5671 (no quote 28.10 before-run)" },
  { plateNo: "ZZZ1A", idNo: "900101145671", postalCode: "55000", note: "the other team plate, same made-up IC" },
  { plateNo: "HXA0005A", idNo: "850615105523", postalCode: "55000", note: "team plate range, a second made-up IC 850615-10-5523" },
  { plateNo: "HXA0001A", idNo: "780322086011", postalCode: "55000", note: "first plate, a third made-up IC 780322-08-6011" },
];

/** A made-up company SSM for the Company Car tab: answers "unable to retrieve your vehicle information" (28.10.2026). */
export const SECARANG_MADE_UP_SSM = { plateNo: "HXA0002A", idNo: "202501999999", postalCode: "55000" } as const;

/**
 * Fiuu SANDBOX test cards (team doc §5, live 19–20.10.2026): these take the 3D Secure OTP 123456. They are the
 * gateway's public test numbers, not anyone's card. 4111 1111 1111 1111 / 5105 1051 0510 5100 are REJECTED
 * ("P10: Sorry, Your Credit Card Number or CVV or expiration date is not valid").
 */
export const FIUU_SANDBOX_CARDS: Record<"visa" | "master", SandboxCard> = {
  visa: { number: "4456530000001096", expiry: "12/26", cvv: "111" },
  master: { number: "5200000000001096", expiry: "12/26", cvv: "111" },
};

/**
 * The owner details typed on Confirmation for a Secarang PURCHASE run. The WhatsApp and email receipts go to the
 * phone and email typed there, so they are the QA's own, from env/.staging.env-local SECARANG_TEST_PHONE /
 * SECARANG_TEST_EMAIL (Azfar 28.10.2026: no full purchase until he gives them; never written in the repo). The
 * name and address are MADE UP (an insurer simulator on staging /ia/ takes any), so no real person's name or
 * address shows in evidence. Throws when the two env values are missing, rather than buying with someone else's.
 */
export function secarangOwner(): { name: string; email: string; mobile: string; address1: string; address2: string; address3: string } {
  const email = (process.env.SECARANG_TEST_EMAIL ?? "").trim();
  const mobile = (process.env.SECARANG_TEST_PHONE ?? "").trim();
  if (!email || !mobile) {
    throw new Error("SECARANG_TEST_EMAIL / SECARANG_TEST_PHONE must be set in env/.staging.env-local (the QA's own email and phone: Secarang sends the receipts there).");
  }
  return { name: "QA SECARANG TEST", email, mobile, address1: "NO 1 JALAN UJIAN QA", address2: "TAMAN UJIAN", address3: "KUALA LUMPUR" };
}

/**
 * Quote inputs for a purchase run: plate per use, IC and postcode shared. The IC is SECARANG_QUOTE_IC from
 * env/.staging.env-local when set (the IC the QA team quotes with on /ia/: team doc §13 says HXA0001A–HXA0020A /
 * ZZZ1A quote Lonpac "with a real IC", so it never goes in the repo), else the first made-up candidate's IC
 * (Azfar 28.10.2026: on the simulator any IC will do; but made-up ICs got "no instant quotation" before the
 * deploy on 28.10). Postcode 55000 (team doc §13).
 */
export function secarangQuoteForm(plateNo: string): SecarangQuoteForm {
  const ic = (process.env.SECARANG_QUOTE_IC ?? "").replace(/\D/g, "");
  return { plateNo, idNo: ic || SECARANG_QUOTE_CANDIDATES[0].idNo, postalCode: "55000" };
}
