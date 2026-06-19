/**
 * Seed a LIVE car-insurance knowledge base for testing the chatbot (Malaysian motor insurance
 * topics). Idempotent and self-replacing: every run first deletes the previously seeded set
 * (documents whose name starts with "kb-") and then re-creates the current set, so the KB never
 * accumulates stale docs. Uses whatever embedding adapter the environment selects:
 *
 *   # Mock embeddings (no Ollama needed) — structurally complete KB for plumbing/branch demos:
 *   EMBEDDINGS_MOCK_MODE=true pnpm --filter api exec ts-node scripts/seed-chatbot-kb.ts
 *
 *   # Real embeddings (Ollama + bge-m3 up) — required for genuine rag_answer retrieval:
 *   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/seed-chatbot-kb.ts
 *
 * Docs are status=LIVE so RAG can retrieve them immediately, and are owned by the first real user
 * (or a sentinel UUID) — NOT the soak's SOAK_USER_ID — so `chatbot:soak` will not purge them.
 */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IngestionService } from '../src/chatbot/knowledge/ingestion.service';

/** All seeded docs share this name prefix so a re-run can cleanly replace the previous set. */
const SEED_PREFIX = 'kb-';

const DOCS: Array<{ name: string; title: string; category: string; body: string }> = [
  {
    name: 'kb-ins-coverage-types.md',
    title: 'Types of Motor Insurance',
    category: 'Coverage',
    body: 'There are three main types of motor cover in Malaysia. Third Party is the legal minimum and covers injury or death to other people and damage to their property, but nothing for your own car. Third Party, Fire & Theft adds protection if your own vehicle is stolen or damaged by fire. Comprehensive is the widest cover: everything in Third Party plus accidental damage to your own vehicle, fire and theft.',
  },
  {
    name: 'kb-ins-comprehensive.md',
    title: 'What Comprehensive Insurance Covers',
    category: 'Coverage',
    body: 'A comprehensive policy covers accidental loss or damage to your own vehicle (collision, overturning, fire and theft) and your legal liability to third parties for bodily injury, death and damage to their property. It does not automatically include flood and other special perils, windscreen damage, or use for e-hailing — these are optional add-ons available for an extra premium.',
  },
  {
    name: 'kb-ins-ncd.md',
    title: 'No Claim Discount (NCD)',
    category: 'Pricing',
    body: 'No Claim Discount rewards you for not claiming. The rate rises each claim-free year: 25% after one year, 30% after two, 38.33% after three, 45% after four, and 55% from five years onward. An at-fault own-damage claim resets your NCD to 0% at the next renewal. NCD belongs to you, not the car, so it transfers to your next vehicle, and you can verify it through the official ISM/MyCarInfo records.',
  },
  {
    name: 'kb-ins-claims.md',
    title: 'How to Make a Claim',
    category: 'Claims',
    body: 'After an accident, lodge a police report within 24 hours and photograph the damage and the scene. To claim on your own comprehensive policy, send the car to an authorised panel workshop with your IC, driving licence, vehicle registration (geran) and police report — the workshop helps process the claim. For a third-party claim you can use your insurer\'s Knock-for-Knock arrangement or claim directly against the other driver\'s insurer. An at-fault own-damage claim affects your NCD.',
  },
  {
    name: 'kb-ins-windscreen.md',
    title: 'Windscreen Cover',
    category: 'Add-ons',
    body: 'Windscreen, window and sunroof glass are not covered by a standard comprehensive policy. You can add windscreen cover for an extra premium (typically around 15% of the windscreen sum insured). The key benefit is that claiming for windscreen damage under this add-on does not affect your No Claim Discount and usually carries no excess.',
  },
  {
    name: 'kb-ins-special-perils.md',
    title: 'Flood & Special Perils',
    category: 'Add-ons',
    body: 'Damage from flood, storm, landslide and other natural disasters is not included in a basic comprehensive policy. Given Malaysia\'s monsoon seasons we strongly recommend adding Special Perils cover, which protects your vehicle against flood, windstorm, landslide and similar events. The add-on premium is usually a small percentage of your sum insured.',
  },
  {
    name: 'kb-ins-sum-insured.md',
    title: 'Sum Insured: Agreed vs Market Value',
    category: 'Coverage',
    body: 'The sum insured is the amount your vehicle is covered for. Agreed Value fixes the payout upfront (common for newer cars) so there is no dispute on a total loss. Market Value pays the prevailing market price at the time of loss. Insuring below the correct value (under-insurance) can trigger the average clause, where claims are reduced proportionally, so always insure at the proper value.',
  },
  {
    name: 'kb-ins-excess.md',
    title: 'Excess / Deductible',
    category: 'Claims',
    body: 'Excess (deductible) is the amount you pay out of pocket on a claim before the insurer pays the rest. A compulsory excess of RM400 applies if, at the time of the accident, the car was driven by someone not named in the policy, or by a driver under 21, holding a provisional (P) licence, or with a full licence held for less than two years. You may also opt for a voluntary excess to reduce your premium.',
  },
  {
    name: 'kb-ins-roadtax-renewal.md',
    title: 'Road Tax & Renewal',
    category: 'Renewal',
    body: 'You must have an active motor insurance policy before you can renew your road tax (cukai jalan / LKM). Renew your insurance about two weeks before it expires to avoid a lapse. If a policy lapses, the car may need a PUSPAKOM inspection before it can be insured again. Once insured, road tax can be renewed online via MyEG or JPJ, or over the counter at the post office.',
  },
  {
    name: 'kb-ins-takaful.md',
    title: 'Takaful vs Conventional Insurance',
    category: 'Coverage',
    body: 'Motor Takaful is the Shariah-compliant alternative to conventional insurance. Instead of a premium you contribute to a common fund (tabarru\') used to help participants who suffer a loss, and any surplus may be shared back. Coverage and claims work very similarly to conventional comprehensive insurance; the main difference is the underlying contract, which avoids elements such as interest (riba) and uncertainty (gharar).',
  },
  {
    name: 'kb-ins-ehailing.md',
    title: 'e-Hailing & Commercial Use',
    category: 'Coverage',
    body: 'A standard private-car policy does not cover e-hailing (Grab and similar), carrying passengers for hire, or commercial use, and a claim may be rejected if the car is used this way. If you drive for an e-hailing platform, add the e-hailing extension to your comprehensive policy so both private and e-hailing use are covered. Tell us your platform and we will arrange the right extension.',
  },
  {
    name: 'kb-ins-buy-renew.md',
    title: 'Buying or Renewing a Policy',
    category: 'Renewal',
    body: 'To buy or renew we need your IC, your vehicle registration card (geran), and your current or previous policy details so your NCD can be confirmed. For a new purchase or a lapsed vehicle a PUSPAKOM inspection may be required. Share your car\'s make, model, year and your postcode and we will prepare a quote with the recommended sum insured and any add-ons.',
  },
  {
    name: 'kb-ins-roadside.md',
    title: 'Roadside Assistance & Towing',
    category: 'Add-ons',
    body: 'Many comprehensive policies include or offer 24-hour roadside assistance: emergency towing to the nearest panel workshop after a breakdown or accident, plus minor on-the-spot help such as a jump-start, tyre change or fuel delivery. Coverage limits vary by plan, so confirm your towing-distance entitlement; we can add or upgrade roadside assistance on request.',
  },
];

async function main(): Promise<void> {
  const logger = new Logger('seed-chatbot-kb');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const prisma = app.get(PrismaService);
    const ingestion = app.get(IngestionService);

    // Own the docs as a real user if one exists (nice in the dashboard); else a non-soak sentinel.
    const user = await prisma.user.findFirst({ select: { id: true } });
    const createdById = user?.id ?? '00000000-0000-0000-0000-0000000d0c5e';

    // Self-replace: clear the previously seeded set (cascades chunks) before re-seeding.
    const removed = await prisma.knowledgeDocument.deleteMany({ where: { name: { startsWith: SEED_PREFIX } } });
    logger.log(`Cleared ${removed.count} previously seeded doc(s). Seeding ${DOCS.length} car-insurance document(s)...`);

    for (const d of DOCS) {
      const contentMd = `# ${d.title}\n\n${d.body}\n`;
      const wordCount = contentMd.split(/\s+/).filter(Boolean).length;
      const doc = await prisma.knowledgeDocument.create({
        data: {
          name: d.name,
          title: d.title,
          category: d.category,
          contentMd,
          wordCount,
          status: 'LIVE',
          embeddingModel: '',
          createdById,
        },
      });
      const res = await ingestion.ingest(doc.id);
      logger.log(`  ✓ ${d.title.padEnd(34)} ${res.chunksCreated} chunk(s)  (${res.embeddingModel})`);
    }

    const liveCount = await prisma.knowledgeDocument.count({ where: { status: 'LIVE' } });
    logger.log(`Done. ${DOCS.length} car-insurance doc(s) seeded; ${liveCount} LIVE document(s) total in the KB.`);
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
