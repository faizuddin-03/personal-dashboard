/**
 * Seed one company into eSim's SSM simulator — both rows, matched.
 *
 *   npx tsx scripts/seed-ssm.ts --type ROC --directors 2
 *   npx tsx scripts/seed-ssm.ts --type ROC --directors 4 --secretaries 1 --shareholders 3
 *   npx tsx scripts/seed-ssm.ts --type ROC --directors 2 --foreign 1
 *   npx tsx scripts/seed-ssm.ts --type ROC --roc 1234567-A --newRoc 202301012345   (a real company)
 *   npx tsx scripts/seed-ssm.ts --list
 *   npx tsx scripts/seed-ssm.ts --type ROC --director "MUHAMMAD ALI BIN ABDULLAH|880101-01-1234"   (STMS company seller)
 *
 * The seeding itself lives in `src/data/ssm-seed.ts` so a build can call it;
 * this is only the command line around it.
 */
import { loadEnv } from "../config/load-env";
loadEnv();

import { EsimClient } from "@fixtures/esim";
import { SSM_ENQUIRY_ENTITY, SSM_SUBMISSION_ENTITY, type SsmType } from "@data/ssm";
import { seedSsmCompany, isSeededByUs } from "@data/ssm-seed";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const num = (name: string, d: number): number => Number(arg(name, String(d)));

async function main(): Promise<void> {
  const type = (arg("type", "ROC") as SsmType) ?? "ROC";
  const sim = new EsimClient();
  await sim.connect();
  try {
    if (process.argv.includes("--list")) {
      const enquiry = await sim.list(SSM_ENQUIRY_ENTITY);
      const submissions = await sim.list(SSM_SUBMISSION_ENTITY[type]);
      const enqRoc = new Set(enquiry.map((r) => String(r.roc)));
      console.log(`${SSM_ENQUIRY_ENTITY}: ${enquiry.length} rows`);
      console.log(`${SSM_SUBMISSION_ENTITY[type]}: ${submissions.length} rows`);
      console.log(`matched pairs: ${submissions.filter((r) => enqRoc.has(String(r.roc))).length}`);
      for (const r of submissions.filter(isSeededByUs)) {
        console.log(`  SEEDED  ${r.roc} / ${r.newRoc}  ${r.companyName}`);
      }
      return;
    }

    const company = await seedSsmCompany(sim, {
      type,
      directors: num("directors", 2),
      secretaries: num("secretaries", 0),
      shareholders: num("shareholders", 0),
      foreign: num("foreign", 0),
      companyName: arg("company"),
      roc: arg("roc"),
      newRoc: arg("newRoc"),
      // --director "NAME|880101-01-1234" (repeatable via comma): seed exactly this director
      owners: arg("director") ? arg("director")!.split(",").map((d) => { const [name, ic] = d.split("|"); return { name, ic, designation: "DIRECTOR" as const }; }) : undefined,
    });
    console.log(`Seeded ${company.type}  ${company.companyName}`);
    console.log(`  Old BRN  ${company.roc}`);
    console.log(`  New BRN  ${company.newRoc}`);
    console.log(`  EXPECTED DIRECTOR ROWS ON THE APPLICATION: ${company.expectedDirectors}`);
  } finally {
    await sim.close();
  }
}

main().catch((e) => {
  console.error("FAILED:", (e as Error).message);
  process.exit(1);
});
