import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedChatbot } from './seed-chatbot';

type SeedDealer = {
  name: string; pic: string; picRole: 'OWNER' | 'SALES_MANAGER' | 'ADMIN';
  numberType: 'PHONE' | 'LANE'; phone: string; state: string; vehicle: string;
  lang: 'EN' | 'MS' | 'ZH'; optIn: boolean; tier: 'BRONZE' | 'SILVER' | 'GOLD';
  sub: 'ACTIVE' | 'EXPIRING' | 'LAPSED'; credits: number; transfers: number;
  joined: string; spend: number;
};

// E.164 for Malaysia: strip non-digits, prefix +60 (design phones omit +60 and the leading 0)
const toE164 = (raw: string) => '+60' + raw.replace(/\D/g, '');

const STATE_ENUM: Record<string, string> = {
  Selangor: 'SELANGOR', 'Kuala Lumpur': 'KUALA_LUMPUR', Penang: 'PENANG', Johor: 'JOHOR',
  Perak: 'PERAK', 'Negeri Sembilan': 'NEGERI_SEMBILAN', Melaka: 'MELAKA', Kedah: 'KEDAH',
  Pahang: 'PAHANG', Terengganu: 'TERENGGANU', Kelantan: 'KELANTAN', Perlis: 'PERLIS',
  Sabah: 'SABAH', Sarawak: 'SARAWAK', Labuan: 'LABUAN', Putrajaya: 'PUTRAJAYA',
};

const VEHICLE_ENUM: Record<string, string> = {
  National: 'NATIONAL', 'Continental/Luxury': 'CONTINENTAL_LUXURY', 'SUV/MPV': 'SUV_MPV',
  'Commercial/Pickup': 'COMMERCIAL_PICKUP', 'EV/Hybrid': 'EV_HYBRID', Motorcycle: 'MOTORCYCLE',
  'Multi-brand': 'MULTI_BRAND',
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
// Parse 'MMM YYYY' to a TZ-stable UTC date on the 1st of the month
// (avoids engine/locale-dependent Date string parsing that can shift the month).
const parseJoined = (s: string): Date => {
  const [mon, yr] = s.split(' ');
  return new Date(Date.UTC(parseInt(yr, 10), MONTHS[mon], 1));
};

const resolveEnum = (map: Record<string, string>, key: string, field: string): string => {
  const val = map[key];
  if (!val) throw new Error(`Unknown ${field}: "${key}"`);
  return val;
};

const SEED_DEALERS: SeedDealer[] = [
  { name: 'Auto Bestari Sdn Bhd', pic: 'Rahman Abdullah', picRole: 'OWNER', numberType: 'PHONE', phone: '12-345 6789', state: 'Selangor', vehicle: 'National', lang: 'MS', optIn: true, tier: 'GOLD', sub: 'EXPIRING', credits: 142, transfers: 84, joined: 'Jan 2024', spend: 48900 },
  { name: 'KL Premium Motors', pic: 'Tan Wei Ming', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '16-228 7741', state: 'Kuala Lumpur', vehicle: 'Continental/Luxury', lang: 'ZH', optIn: true, tier: 'GOLD', sub: 'ACTIVE', credits: 880, transfers: 112, joined: 'Mar 2023', spend: 124300 },
  { name: 'Penang Auto Mart', pic: 'Rajesh Kumar', picRole: 'ADMIN', numberType: 'PHONE', phone: '19-770 2210', state: 'Penang', vehicle: 'Multi-brand', lang: 'EN', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 36, transfers: 41, joined: 'Aug 2024', spend: 38750 },
  { name: 'JB Used Cars', pic: 'Siti Khadijah Yusof', picRole: 'OWNER', numberType: 'PHONE', phone: '13-554 9082', state: 'Johor', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'BRONZE', sub: 'EXPIRING', credits: 8, transfers: 12, joined: 'Feb 2025', spend: 15600 },
  { name: 'EV Hub Motors', pic: 'Lim Chee Keong', picRole: 'OWNER', numberType: 'PHONE', phone: '12-908 4453', state: 'Selangor', vehicle: 'EV/Hybrid', lang: 'EN', optIn: true, tier: 'GOLD', sub: 'ACTIVE', credits: 1240, transfers: 96, joined: 'Nov 2023', spend: 189000 },
  { name: 'Cahaya Auto Trading', pic: 'Farah Diana Ismail', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '17-665 1190', state: 'Kuala Lumpur', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 210, transfers: 38, joined: 'Jun 2024', spend: 42400 },
  { name: 'Ipoh Motor Sdn Bhd', pic: 'Arumugam Ganesan', picRole: 'OWNER', numberType: 'PHONE', phone: '11-2876 5540', state: 'Perak', vehicle: 'Commercial/Pickup', lang: 'EN', optIn: false, tier: 'BRONZE', sub: 'LAPSED', credits: 0, transfers: 0, joined: 'May 2024', spend: 21100 },
  { name: 'Northern Auto Gallery', pic: 'Wong Mei Ling', picRole: 'ADMIN', numberType: 'LANE', phone: '4-228 9001', state: 'Penang', vehicle: 'National', lang: 'ZH', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 54, transfers: 9, joined: 'Oct 2024', spend: 9900 },
  { name: 'Seremban Auto Niaga', pic: 'Muhammad Hafiz', picRole: 'OWNER', numberType: 'PHONE', phone: '14-552 0098', state: 'Negeri Sembilan', vehicle: 'Motorcycle', lang: 'MS', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 120, transfers: 6, joined: 'Jan 2024', spend: 1200 },
  { name: 'Klang Valley Cars', pic: 'Chong Li Wei', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '12-447 8821', state: 'Selangor', vehicle: 'Multi-brand', lang: 'ZH', optIn: true, tier: 'SILVER', sub: 'EXPIRING', credits: 18, transfers: 33, joined: 'Dec 2023', spend: 44200 },
  { name: 'Melaka Motorworld', pic: 'Aisha Kamal', picRole: 'OWNER', numberType: 'PHONE', phone: '19-118 3360', state: 'Melaka', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 305, transfers: 44, joined: 'Sep 2024', spend: 27800 },
  { name: 'Southern Auto Hub', pic: 'Devraj Manickam', picRole: 'ADMIN', numberType: 'LANE', phone: '7-558 2233', state: 'Johor', vehicle: 'National', lang: 'EN', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 62, transfers: 14, joined: 'Jul 2024', spend: 6400 },
];
// NOTE: representative 12-dealer subset spanning every tier/subscription/specialization/
// language/number-type. Extend from docs/design/data.jsx (c13–c21) if a larger base is wanted.

type SeedKnowledge = {
  slug: string; question: string; answer: string; category: string;
  uses: number; source: 'SYNCED' | 'FROM_ESCALATION'; status: 'PUBLISHED' | 'CANDIDATE';
};

const SEED_KNOWLEDGE: SeedKnowledge[] = [
  { slug: 'ownership_transfer.md', question: 'How do I do an ownership transfer (tukar milik) online?', answer: 'Transfers → New transfer, enter vehicle & buyer, both parties e-sign, book Puspakom B5. JPJ issues the new geran in 2–5 working days via e-STMS.', category: 'Transfer', uses: 842, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'credits_pricing.md', question: 'How does credit top-up and pricing work?', answer: 'Credits power vehicle-history checks & e-STMS. Bundles: 50 = RM 250, 200 = RM 900 (10% off). Credits never expire. Top up under Billing.', category: 'Billing', uses: 735, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'history_check.md', question: "What's the turnaround for a JPJ vehicle-history check?", answer: 'Instant in most cases. If the JPJ source is slow, results arrive within minutes and any failed check is auto-refunded.', category: 'Checks', uses: 610, source: 'FROM_ESCALATION', status: 'PUBLISHED' },
  { slug: 'roadtax_renewal.md', question: 'How do road-tax renewals & refunds work?', answer: 'Renew road tax + insurance together for instant issuance. JPJ refunds unused, pro-rated road tax on transfer/deregistration — submit under Renewals → Refunds.', category: 'Road tax', uses: 455, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'insurance_guide.md', question: 'How do I issue motor insurance via eAuto?', answer: 'Get instant quotes from multiple panels in the dealer app, pick coverage, and issue cover in seconds — road tax follows automatically.', category: 'Insurance', uses: 498, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'subscription_plans.md', question: "What's included in each dealer plan tier?", answer: 'Bronze: pay-as-you-go basics. Silver: priority queue + monthly transfer allowance. Gold: unlimited + bulk e-STMS pricing & dedicated support.', category: 'Billing', uses: 512, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'compliance_jpj.md', question: 'What documents does JPJ require for a transfer?', answer: "Both parties' MyKad, valid Puspakom B5, active insurance, and a settled road tax. Company-registered vehicles need SSM docs + authorised-signatory letter.", category: 'Compliance', uses: 333, source: 'FROM_ESCALATION', status: 'PUBLISHED' },
  { slug: 'portal_how_to.md', question: 'How do I add a staff login to the dealer portal?', answer: 'Settings → Team → Invite. Owners can add sales/admin seats; access is controlled per role. Locked out? Reset via the login page or contact us.', category: 'General', uses: 271, source: 'SYNCED', status: 'PUBLISHED' },
  // candidates awaiting review (Phase 5 "Learned from escalations") — seeded so the candidates endpoint has data
  { slug: 'ownership_transfer.md', question: 'Can eAuto handle transfer for a company-registered vehicle?', answer: "Yes — company-registered (Sdn Bhd) vehicles can be transferred via eAuto. You'll need the SSM business docs + an authorised-signatory letter on top of the standard transfer documents.", category: 'Transfer', uses: 9, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
  { slug: 'credits_pricing.md', question: "What's the price per history-check credit in a bundle?", answer: 'In the 200-check bundle it works out to about RM 4.50 per check (RM 900 total — 10% off pay-as-you-go). Credits never expire.', category: 'Billing', uses: 14, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
  { slug: 'subscription_plans.md', question: 'Does my plan include unlimited road-tax renewals?', answer: "Road-tax renewals aren't capped by tier — renew as many vehicles as you like; you only pay the JPJ road tax + insurance. Gold just adds priority processing.", category: 'Billing', uses: 6, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
];

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  let admin = await prisma.user.findUnique({ where: { email } });
  if (admin) {
    console.log(`Admin user ${email} already exists — skipping`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    admin = await prisma.user.create({
      data: { email, passwordHash, name: 'Initial Admin', role: 'ADMIN' },
    });
    console.log('=========================================');
    console.log('Seeded initial admin user:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('Change the password after first login.');
    console.log('=========================================');
  }

  const supportEmail = process.env.SEED_SUPPORT_EMAIL ?? 'support@example.com';
  const supportPassword = process.env.SEED_SUPPORT_PASSWORD ?? 'ChangeMe123!';
  const existingSupport = await prisma.user.findUnique({ where: { email: supportEmail } });
  if (!existingSupport) {
    const supportHash = await bcrypt.hash(supportPassword, 12);
    await prisma.user.create({
      data: { email: supportEmail, passwordHash: supportHash, name: 'Priya Nair', role: 'OPERATOR' },
    });
    console.log(`Seeded Customer Support user: ${supportEmail} / ${supportPassword}`);
  } else {
    console.log(`Support user ${supportEmail} already exists — skipping`);
  }

  let createdDealers = 0;
  for (const d of SEED_DEALERS) {
    const phoneE164 = toE164(d.phone);
    const existing = await prisma.contact.findUnique({ where: { phoneE164 } });
    if (existing) continue;
    await prisma.contact.create({
      data: {
        phoneE164,
        name: d.name,
        languagePreference: d.lang,
        state: resolveEnum(STATE_ENUM, d.state, 'state') as any,
        optInStatus: d.optIn ? 'OPTED_IN' : 'OPTED_OUT',
        optInSource: 'seed',
        optInAt: d.optIn ? new Date() : null,
        picName: d.pic,
        picRole: d.picRole as any,
        numberType: d.numberType as any,
        tier: d.tier as any,
        subscriptionStatus: d.sub as any,
        vehicleSpecialization: resolveEnum(VEHICLE_ENUM, d.vehicle, 'vehicle') as any,
        historyCheckCredits: d.credits,
        transfers30d: d.transfers,
        lifetimeSpend: d.spend,
        joinedAt: parseJoined(d.joined),
        lastSeenAt: new Date(),
      },
    });
    createdDealers++;
  }
  if (createdDealers === SEED_DEALERS.length) console.log(`Seeded all ${createdDealers} dealer(s).`);
  else if (createdDealers > 0) console.log(`Seeded ${createdDealers} new dealer(s); the rest already existed.`);
  else console.log('Dealers already exist — skipping.');

  // Seed an APPROVED test template so Phase 4 E2E can blast against it
  const existingTemplate = await prisma.template.findFirst({ where: { name: 'sample_promo_2026' } });
  if (!existingTemplate) {
    await prisma.template.create({
      data: {
        name: 'sample_promo_2026',
        version: 1,
        language: 'EN',
        category: 'MARKETING',
        bodyText: 'Hello {{1}}! Check out our promo.',
        footerText: 'Reply STOP to unsubscribe',
        variables: ['customer_name'],
        status: 'APPROVED',
        metaTemplateId: 'seed-fake-meta-id-en',
        submittedAt: new Date(),
        approvedAt: new Date(),
        createdById: admin!.id,
      },
    });
    await prisma.template.create({
      data: {
        name: 'sample_promo_2026',
        version: 1,
        language: 'MS',
        category: 'MARKETING',
        bodyText: 'Salam {{1}}! Lihat promosi kami.',
        footerText: 'Balas STOP untuk berhenti',
        variables: ['customer_name'],
        status: 'APPROVED',
        metaTemplateId: 'seed-fake-meta-id-ms',
        submittedAt: new Date(),
        approvedAt: new Date(),
        createdById: admin!.id,
      },
    });
    console.log('Seeded sample APPROVED template "sample_promo_2026" (EN + MS).');
  } else {
    console.log('Sample template already exists — skipping.');
  }

  // Seed default system settings
  const tier = await prisma.systemSetting.findUnique({ where: { key: 'current_messaging_tier' } });
  if (!tier) {
    await prisma.systemSetting.create({ data: { key: 'current_messaging_tier', value: 'TIER_1' } });
    console.log('Seeded current_messaging_tier = TIER_1.');
  }

  const autopilotDefaults: Record<string, string> = {
    autopilot_enabled: 'true',
    autopilot_escalation_threshold: '70',
    autopilot_honour_stop: 'true',
    autopilot_after_hours: 'AWAY_THEN_ESCALATE',
  };
  for (const [key, value] of Object.entries(autopilotDefaults)) {
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.systemSetting.create({ data: { key, value } });
      console.log(`Seeded ${key} = ${value}.`);
    }
  }

  const costSetting = await prisma.systemSetting.findUnique({ where: { key: 'cost_per_message_rm' } });
  if (!costSetting) {
    await prisma.systemSetting.create({ data: { key: 'cost_per_message_rm', value: '0.08' } });
    console.log('Seeded cost_per_message_rm = 0.08.');
  }

  let createdKb = 0;
  for (const k of SEED_KNOWLEDGE) {
    const existing = await prisma.knowledgeDoc.findFirst({ where: { slug: k.slug, question: k.question } });
    if (existing) continue;
    await prisma.knowledgeDoc.create({
      data: {
        slug: k.slug,
        question: k.question,
        answer: k.answer,
        category: k.category,
        uses: k.uses,
        source: k.source as any,
        status: k.status as any,
      },
    });
    createdKb++;
  }
  if (createdKb > 0) console.log(`Seeded ${createdKb} knowledge doc(s).`);
  else console.log('Knowledge docs already exist — skipping.');

  if ((await prisma.ticket.count()) === 0) {
    const adminUser = await prisma.user.findUnique({ where: { email } });
    const dealerByPhone = (raw: string) =>
      prisma.contact.findUnique({ where: { phoneE164: toE164(raw) } });

    const seedTickets: { phone: string; reason: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE'; intent: string; assign: boolean; status: 'OPEN' | 'IN_PROGRESS' }[] = [
      { phone: '13-554 9082', reason: 'KNOWLEDGE_GAP', intent: 'transfer_support', assign: false, status: 'OPEN' },   // JB Used Cars
      { phone: '12-345 6789', reason: 'COMPLAINT', intent: 'complaint', assign: true, status: 'IN_PROGRESS' },        // Auto Bestari
      { phone: '19-770 2210', reason: 'LOW_CONFIDENCE', intent: 'credit_topup', assign: false, status: 'OPEN' },      // Penang Auto Mart
    ];

    let createdTickets = 0;
    for (const t of seedTickets) {
      const dealer = await dealerByPhone(t.phone);
      if (!dealer) continue;
      await prisma.ticket.create({
        data: {
          contactId: dealer.id,
          reason: t.reason,
          intent: t.intent,
          status: t.status,
          assigneeId: t.assign ? adminUser?.id ?? null : null,
          assignedAt: t.assign ? new Date() : null,
        },
      });
      createdTickets++;
    }
    console.log(`Seeded ${createdTickets} ticket(s).`);
  } else {
    console.log('Tickets already exist — skipping.');
  }

  if ((await prisma.cannedReply.count()) === 0) {
    const cannedReplies = [
      { title: 'Transfer — how to start', body: 'To start an ownership transfer: Transfers → New transfer, enter the vehicle & buyer, both parties e-sign, then book Puspakom B5. JPJ issues the new geran in 2–5 working days.', category: 'Transfer' },
      { title: 'Credit top-up', body: 'You can top up credits under Billing. Bundles: 50 = RM 250, 200 = RM 900 (10% off). Credits never expire.', category: 'Billing' },
      { title: 'Road-tax renewal', body: 'Renew road tax + insurance together for instant issuance. Unused road tax is refunded pro-rata on transfer.', category: 'Road tax' },
      { title: 'Looking into it', body: 'Thanks for reaching out — I\'m looking into this now and will get back to you shortly.', category: 'General' },
      { title: 'Need more details', body: 'Could you share the vehicle registration number and the dealer account name so I can check this for you?', category: 'General' },
      { title: 'Resolved — anything else?', body: 'Glad that\'s sorted! Is there anything else I can help you with?', category: 'General' },
    ];
    for (const c of cannedReplies) {
      await prisma.cannedReply.create({ data: c });
    }
    console.log(`Seeded ${cannedReplies.length} canned replies.`);
  }

  await seedChatbot(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
