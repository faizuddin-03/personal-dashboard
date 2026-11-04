/**
 * The documents the LKM Refund pop-up is given (STMS Step 5 add-on), for the simulator seller
 * CARDS.malaysianIndividual (MyKad 020406081081, "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM").
 *
 * Since 07.10.2026 the document check at the pop-up's [Next] is a REAL AI read, so the files must be real and match the
 * seller and the bank details typed. They are a real person's data: they live OUTSIDE the repo, on the QA PC, and only
 * their paths are named here. Override any of them by env:
 *
 *   LKM_COPY_OF_IC      default ~\IC test\ic_020406081081.pdf   (the QA test IC of 020406081081)
 *   LKM_BANK_STATEMENT  default ~\OneDrive - MODE FAIR SDN BHD\Documents\test file\bimb statement header2.jpg
 *   (~ = this PC's home folder; on another PC, ask the QA who owns the files and set both in .staging.env-local)
 *   LKM_BANK            default BANK ISLAM MALAYSIA BERHAD                     (as printed on the statement)
 *   LKM_ACCOUNT_NO      default 08013024351249                                 (as printed on the statement)
 *
 * The defaults are the set Azfar named for the 12022 eSim runs with this seller (16.10.2026, Insurance Cancellation
 * pop-up, which runs the same real AI read); not yet tried on the LKM Refund pop-up. `missing` lists the files that
 * are not on this PC, so a spec can stop before it creates anything.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export interface LkmRefundDocs {
  copyOfIc: string;
  bankStatement: string;
  bank: string;
  accountNo: string;
  /** Files above that do not exist on this PC (empty = ready). */
  missing: string[];
  /** Which values came from env, for the run log. */
  fromEnv: string[];
}

const DEFAULTS = {
  LKM_COPY_OF_IC: path.join(os.homedir(), "IC test", "ic_020406081081.pdf"),
  LKM_BANK_STATEMENT: path.join(os.homedir(), "OneDrive - MODE FAIR SDN BHD", "Documents", "test file", "bimb statement header2.jpg"),
  LKM_BANK: "BANK ISLAM MALAYSIA BERHAD",
  LKM_ACCOUNT_NO: "08013024351249",
} as const;

export function lkmRefundDocs(): LkmRefundDocs {
  const fromEnv: string[] = [];
  const v = (k: keyof typeof DEFAULTS) => {
    const e = process.env[k];
    if (e) fromEnv.push(k);
    return e || DEFAULTS[k];
  };
  const docs = {
    copyOfIc: v("LKM_COPY_OF_IC"),
    bankStatement: v("LKM_BANK_STATEMENT"),
    bank: v("LKM_BANK"),
    accountNo: v("LKM_ACCOUNT_NO").replace(/[^0-9]/g, ""),
  };
  const missing = [docs.copyOfIc, docs.bankStatement].filter((f) => !fs.existsSync(f));
  return { ...docs, missing, fromEnv };
}
