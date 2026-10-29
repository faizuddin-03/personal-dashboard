// Module list for /eauto/flows. One file per module in ./modules — add new
// modules there and list them here. Shape: ./types.ts. Order follows the
// taxonomy built on 2026-10-23 (_reference/inbox/eauto-flows-run/09-taxonomy.md):
// onboarding first, then the transaction modules, then admin and tools.
import type { Module } from "./types";
import { onboarding } from "./modules/onboarding";
import { ucdPortal } from "./modules/ucd-portal";
import { stms } from "./modules/stms";
import { ucdToUcd } from "./modules/ucd-to-ucd";
import { apt } from "./modules/apt";
import { estm } from "./modules/estm";
import { stmsAddons } from "./modules/stms-addons";
import { insurance } from "./modules/insurance";
import { secarang } from "./modules/secarang";
import { bmk } from "./modules/bmk";
import { jomcheck } from "./modules/jomcheck";
import { dereg } from "./modules/dereg";
import { ssm } from "./modules/ssm";
import { companyProfileEinvoice } from "./modules/company-profile-einvoice";
import { cibo } from "./modules/cibo";
import { paymentsFees } from "./modules/payments-fees";
import { servicePortal } from "./modules/service-portal";
import { wholesale } from "./modules/wholesale";
import { platform } from "./modules/platform";
import { serviceHub } from "./modules/service-hub";
import { backoffice } from "./modules/backoffice";
import { qaTools } from "./modules/qa-tools";

export const EAUTO_FLOW_MODULES: Module[] = [
  onboarding, ucdPortal, stms, ucdToUcd, apt, estm, stmsAddons, insurance,
  secarang, bmk, jomcheck, serviceHub, dereg, ssm, companyProfileEinvoice,
  backoffice, cibo, paymentsFees, servicePortal, wholesale, platform, qaTools,
];
