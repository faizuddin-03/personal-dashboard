/**
 * Seed the QA-owned "O" prefixes (src/data/qa-prefixes.ts) into eSim.
 *
 * SAFE BY DESIGN — never touches anyone else's data:
 *  - a prefix that does not exist is CREATED;
 *  - a prefix that exists with a remark starting QA_TAG is left alone (or,
 *    with --update, brought back to the definition);
 *  - a prefix that exists WITHOUT our tag makes the script STOP for that
 *    prefix and report it. It is never edited.
 * Needs the company VPN (eSim is internal).
 *
 *   npx tsx scripts/seed-qa-prefixes.ts --check      # report only
 *   npx tsx scripts/seed-qa-prefixes.ts              # create missing
 *   npx tsx scripts/seed-qa-prefixes.ts --rhb OQ OK  # flip the switchable prefix
 *   npx tsx scripts/seed-qa-prefixes.ts --only OZ    # limit any of the above to these prefixes
 */
import { loadEnv } from "../config/load-env";
import { EsimClient, ESIM_ENTITY } from "../src/fixtures/esim";
import { QA_PREFIXES, QA_TAG, qaPrefix } from "../src/data/qa-prefixes";

loadEnv();

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const update = args.includes("--update");
// --only OZ [OS ...]: touch only these prefixes (so restoring one prefix never creates or changes another)
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? args.slice(onlyAt + 1).filter((a) => !a.startsWith("--")) : null;

async function main() {
  const esim = new EsimClient();
  await esim.connect();
  const ours = (r: any) => String(r?.remark ?? "").startsWith(QA_TAG);

  // --rhb <PREFIX> <CODE>: flip one of OUR RHB records
  const i = args.indexOf("--rhb");
  if (i >= 0) {
    const [prefix, code] = [args[i + 1], args[i + 2]];
    qaPrefix(prefix);
    const rec = await esim.findByPrefix(ESIM_ENTITY.rhbTransfer, prefix);
    if (!rec || !ours(rec)) throw new Error(`${prefix} rhb-transfer-resp is missing or not ours — refusing.`);
    await esim.update(ESIM_ENTITY.rhbTransfer, { ...(rec as any), responseCode: code });
    console.log(`${prefix} rhb-transfer-resp -> ${code}`);
    await esim.close();
    return;
  }

  for (const p of QA_PREFIXES.filter((x) => !only || only.includes(x.prefix))) {
    const want = {
      responseCode: p.jpj, usageCode: p.usageCode, bodyType: p.bodyType,
      jsjStatus: "0", sekatStatus: "0", jpjEnqStatus: "0", delayMiliSeconds: 0,
      ...(p.lkmRefund ? { refundAmount: p.lkmRefund.balance } : {}),
      remark: `${QA_TAG} · ${p.purpose} · reusable`.slice(0, 250),
    };
    const have = await esim.findByPrefix(ESIM_ENTITY.stmsEnquiry, p.prefix);
    if (have && !ours(have)) { console.log(`  ${p.prefix}  STOP — exists and is NOT ours (remark "${(have as any).remark}"). Untouched.`); continue; }
    if (!have) {
      if (checkOnly) console.log(`  ${p.prefix}  missing (would create ${p.usageCode}+${p.bodyType} JPJ ${p.jpj})`);
      else { await esim.create(ESIM_ENTITY.stmsEnquiry, { vnStartWith: p.prefix, ...want }); console.log(`  ${p.prefix}  created stms-enquiry-resp ${p.usageCode}+${p.bodyType} JPJ ${p.jpj}`); }
    } else if (update && !checkOnly) {
      await esim.update(ESIM_ENTITY.stmsEnquiry, { ...(have as any), ...want });
      console.log(`  ${p.prefix}  ours — updated to definition`);
    } else console.log(`  ${p.prefix}  ours — in place (${(have as any).usageCode}+${(have as any).bodyType} JPJ ${(have as any).responseCode})`);

    if (p.estm) {
      const e = await esim.findByPrefix(ESIM_ENTITY.estmEnquiry, p.prefix);
      if (e && !ours(e)) { console.log(`  ${p.prefix}  STOP — estm-enquiry-resp exists and is NOT ours. Untouched.`); continue; }
      if (!e && !checkOnly) {
        await esim.create(ESIM_ENTITY.estmEnquiry, {
          vnStartWith: p.prefix, jsjStatus: "0", sekatStatus: "0", jpjEnqStatus: "0",
          responseCode: p.estm.responseCode, usageCode: p.usageCode, bodyType: p.bodyType,
          paymentAmount: 0, fisAmount: 0, declarationArea: p.estm.declarationArea, delayMiliSeconds: 0,
          remark: `${QA_TAG} · eSTM ${p.estm.responseCode} ${p.estm.declarationArea} · reusable`,
        });
        console.log(`  ${p.prefix}  created estm-enquiry-resp ${p.estm.responseCode} ${p.estm.declarationArea}`);
      } else console.log(`  ${p.prefix}  estm-enquiry-resp ${e ? "ours — " + (e as any).responseCode + " " + (e as any).declarationArea : "missing"}`);
    }
    if (p.rhb) {
      const r = await esim.findByPrefix(ESIM_ENTITY.rhbTransfer, p.prefix);
      if (r && !ours(r)) { console.log(`  ${p.prefix}  STOP — rhb-transfer-resp exists and is NOT ours. Untouched.`); continue; }
      if (!r && !checkOnly) {
        await esim.create(ESIM_ENTITY.rhbTransfer, { vnStartWith: p.prefix, responseCode: p.rhb, description: "QA switchable", delayMiliSeconds: 0, remark: `${QA_TAG} · switchable RHB · reusable` });
        console.log(`  ${p.prefix}  created rhb-transfer-resp ${p.rhb}`);
      } else console.log(`  ${p.prefix}  rhb-transfer-resp ${r ? "ours — " + (r as any).responseCode : "missing"}`);
    }
    if (p.lkmRefund) {
      const sets = [
        [ESIM_ENTITY.lkmRefundOcr, { ...p.lkmRefund.ocr, delayMiliSeconds: 0, remark: `${QA_TAG} · LKM Refund document check · reusable` }],
        [ESIM_ENTITY.lkmRefundInquiry, { ...p.lkmRefund.inquiry, refundRemark: null, delayMiliSeconds: 0, remark: `${QA_TAG} · LKM Refund status ${p.lkmRefund.inquiry.refundStatus} · reusable` }],
      ] as const;
      for (const [entity, body] of sets) {
        const r = await esim.findByPrefix(entity, p.prefix);
        if (r && !ours(r)) { console.log(`  ${p.prefix}  STOP — ${entity} exists and is NOT ours. Untouched.`); continue; }
        if (!r && !checkOnly) { await esim.create(entity, { vnStartWith: p.prefix, ...body }); console.log(`  ${p.prefix}  created ${entity}`); }
        else if (r && update && !checkOnly) { await esim.update(entity, { ...(r as any), ...body }); console.log(`  ${p.prefix}  ${entity} ours — updated to definition`); }
        else console.log(`  ${p.prefix}  ${entity} ${r ? "ours — in place" : "missing"}`);
      }
    }
  }
  await esim.close();
}
main().catch((e) => { console.error(String(e)); process.exit(1); });
