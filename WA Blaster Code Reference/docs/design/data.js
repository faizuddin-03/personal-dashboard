// data.js — mock Malaysian data for the WhatsApp Blaster prototype.
// Plain JS — no JSX. Loaded as <script src="data.js"> before the React app.

const myrFmt = (n) => "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const myrInt = (n) => "RM " + Math.round(n).toLocaleString("en-MY");
const fmtPhone = (s) => "🇲🇾 +60 " + s; // s like "12-345 6789"

const TEAMMATES = [
  { id: "u1", name: "Aisyah Rahman",   initials: "AR", role: "admin",    color: "#128C7E" },
  { id: "u2", name: "Daniel Ng",        initials: "DN", role: "operator", color: "#075E54" },
  { id: "u3", name: "Priya Subramaniam",initials: "PS", role: "operator", color: "#1E88A8" },
  { id: "u4", name: "Hafiz Bakri",      initials: "HB", role: "operator", color: "#4A6B82" },
  { id: "u5", name: "Mei Ling Tan",     initials: "MT", role: "admin",    color: "#6B4A82" },
  { id: "u6", name: "Khairul Anwar",    initials: "KA", role: "operator", color: "#825A4A" },
];

const TEMPLATES = [
  { id: "t1", name: "order_confirmation_v3", category: "Utility",     language: "ms_MY", status: "approved", lastEdited: "2 days ago",  author: "Aisyah Rahman",  sent7d: 4280, vars: 3 },
  { id: "t2", name: "delivery_otw",          category: "Utility",     language: "ms_MY", status: "approved", lastEdited: "5 days ago",  author: "Daniel Ng",      sent7d: 2118, vars: 2 },
  { id: "t3", name: "raya_promo_2025",       category: "Marketing",   language: "ms_MY", status: "pending",  lastEdited: "12 min ago",  author: "Mei Ling Tan",   sent7d: 0,    vars: 2 },
  { id: "t4", name: "vip_birthday_voucher",  category: "Marketing",   language: "en_US", status: "approved", lastEdited: "Yesterday",   author: "Mei Ling Tan",   sent7d: 612,  vars: 4 },
  { id: "t5", name: "appointment_reminder",  category: "Utility",     language: "en_US", status: "approved", lastEdited: "1 week ago",  author: "Aisyah Rahman",  sent7d: 1947, vars: 3 },
  { id: "t6", name: "feedback_survey",       category: "Utility",     language: "ms_MY", status: "approved", lastEdited: "1 week ago",  author: "Daniel Ng",      sent7d: 489,  vars: 1 },
  { id: "t7", name: "winback_60day",         category: "Marketing",   language: "ms_MY", status: "rejected", lastEdited: "3 days ago",  author: "Mei Ling Tan",   sent7d: 0,    vars: 3 },
  { id: "t8", name: "merdeka_flash_sale",    category: "Marketing",   language: "ms_MY", status: "approved", lastEdited: "2 weeks ago", author: "Aisyah Rahman",  sent7d: 8920, vars: 2 },
  { id: "t9", name: "kyc_verification",      category: "Authentication", language: "en_US", status: "approved", lastEdited: "1 month ago", author: "Aisyah Rahman", sent7d: 218, vars: 1 },
];

const SEGMENTS = [
  { id: "s1", name: "All opted-in",          size: 12480, updated: "live",        rule: "opt_in = true",                              owner: "system" },
  { id: "s2", name: "VIP — Klang Valley",    size: 842,   updated: "3 hours ago", rule: "tier = VIP AND state IN (Selangor, KL)",     owner: "Mei Ling Tan" },
  { id: "s3", name: "Cart abandoners 7d",    size: 1638,  updated: "live",        rule: "cart_value > 0 AND last_seen < 7d",          owner: "Daniel Ng" },
  { id: "s4", name: "Lapsed 60d+",           size: 3142,  updated: "Yesterday",   rule: "last_order > 60d AND opt_in = true",         owner: "Aisyah Rahman" },
  { id: "s5", name: "Birthday this week",    size: 187,   updated: "live",        rule: "dob_week = current_week",                    owner: "system" },
  { id: "s6", name: "Bahasa preference",     size: 7104,  updated: "live",        rule: "language = ms",                              owner: "system" },
  { id: "s7", name: "Penang foodies",        size: 514,   updated: "5 days ago",  rule: "state = Penang AND tag = food",              owner: "Priya Subramaniam" },
];

const CONTACTS = [
  { id: "c1",  name: "Nurul Izzah",        phone: fmtPhone("12-345 6789"), tags: ["VIP", "KL"],        optIn: true,  lang: "ms",   lastSeen: "2h ago",      lastSeenExact: "21 Oct 2025 08:14 UTC", segments: 4, lifetime: 1842.50 },
  { id: "c2",  name: "Lim Wei Jie",        phone: fmtPhone("16-228 1903"), tags: ["foodie", "Penang"], optIn: true,  lang: "en",   lastSeen: "12 min ago",  lastSeenExact: "21 Oct 2025 10:14 UTC", segments: 2, lifetime: 412.00 },
  { id: "c3",  name: "Raj Kumar",          phone: fmtPhone("11-1207 8830"), tags: ["VIP"],              optIn: true,  lang: "en",   lastSeen: "Yesterday",   lastSeenExact: "20 Oct 2025 09:42 UTC", segments: 3, lifetime: 2380.10 },
  { id: "c4",  name: "Siti Aminah",        phone: fmtPhone("19-665 2210"), tags: ["lapsed"],           optIn: true,  lang: "ms",   lastSeen: "62 days ago", lastSeenExact: "20 Aug 2025 03:11 UTC", segments: 1, lifetime: 188.00 },
  { id: "c5",  name: "Cheong Ka Mun",      phone: fmtPhone("17-908 4421"), tags: ["JB"],                optIn: false, lang: "en",   lastSeen: "5 days ago",  lastSeenExact: "16 Oct 2025 14:08 UTC", segments: 0, lifetime: 92.00 },
  { id: "c6",  name: "Ahmad Faizal",       phone: fmtPhone("13-512 7780"), tags: ["VIP", "Selangor"],   optIn: true,  lang: "ms",   lastSeen: "1h ago",      lastSeenExact: "21 Oct 2025 09:48 UTC", segments: 5, lifetime: 3104.00 },
  { id: "c7",  name: "Tan Hui Min",        phone: fmtPhone("12-887 9061"), tags: ["new"],               optIn: true,  lang: "en",   lastSeen: "30 min ago",  lastSeenExact: "21 Oct 2025 09:55 UTC", segments: 1, lifetime: 38.00 },
  { id: "c8",  name: "Mohd Iqbal",         phone: fmtPhone("18-330 5512"), tags: ["VIP", "KL"],         optIn: true,  lang: "ms",   lastSeen: "3h ago",      lastSeenExact: "21 Oct 2025 07:21 UTC", segments: 4, lifetime: 1278.40 },
  { id: "c9",  name: "Sarala Devi",        phone: fmtPhone("16-661 4498"), tags: [],                    optIn: true,  lang: "en",   lastSeen: "Yesterday",   lastSeenExact: "20 Oct 2025 13:05 UTC", segments: 1, lifetime: 612.00 },
  { id: "c10", name: "Wong Zhi Hao",       phone: fmtPhone("11-2256 1108"), tags: ["foodie"],           optIn: true,  lang: "en",   lastSeen: "4h ago",      lastSeenExact: "21 Oct 2025 06:13 UTC", segments: 2, lifetime: 220.00 },
  { id: "c11", name: "Farah Khairudin",    phone: fmtPhone("13-712 3340"), tags: ["VIP"],               optIn: true,  lang: "ms",   lastSeen: "1d ago",      lastSeenExact: "20 Oct 2025 16:44 UTC", segments: 3, lifetime: 1980.00 },
  { id: "c12", name: "Bryan Yap",          phone: fmtPhone("17-203 8845"), tags: ["lapsed"],            optIn: true,  lang: "en",   lastSeen: "78 days ago", lastSeenExact: "4 Aug 2025 11:22 UTC", segments: 1, lifetime: 56.00 },
];

const CAMPAIGNS = [
  { id: "cm1", name: "Raya VIP early access",   template: "raya_promo_2025",      segment: "VIP — Klang Valley", status: "scheduled", scheduledAt: "Tomorrow 09:00", audience: 842,   delivered: 0,    read: 0,    replied: 0,   cost: 0,       owner: "Mei Ling Tan" },
  { id: "cm2", name: "October cart winback",    template: "winback_60day",        segment: "Cart abandoners 7d", status: "draft",     scheduledAt: "—",              audience: 1638,  delivered: 0,    read: 0,    replied: 0,   cost: 0,       owner: "Daniel Ng" },
  { id: "cm3", name: "Merdeka flash 2× points", template: "merdeka_flash_sale",   segment: "All opted-in",       status: "sending",   scheduledAt: "Now",            audience: 12480, delivered: 8124, read: 5106, replied: 312, cost: 487.36,  owner: "Aisyah Rahman" },
  { id: "cm4", name: "Birthday voucher Oct W4", template: "vip_birthday_voucher", segment: "Birthday this week", status: "complete",  scheduledAt: "Oct 21, 09:00",  audience: 187,   delivered: 187,  read: 162,  replied: 41,  cost: 11.22,   owner: "Mei Ling Tan" },
  { id: "cm5", name: "Order confirmations",     template: "order_confirmation_v3",segment: "Transactional",      status: "always-on", scheduledAt: "Trigger",        audience: 4280,  delivered: 4280, read: 4061, replied: 218, cost: 256.80,  owner: "system" },
  { id: "cm6", name: "Q3 NPS",                  template: "feedback_survey",      segment: "All opted-in",       status: "complete",  scheduledAt: "Sep 30, 14:00",  audience: 12102, delivered: 11984, read: 8201, replied: 1842, cost: 719.04, owner: "Aisyah Rahman" },
  { id: "cm7", name: "Penang foodie preview",   template: "vip_birthday_voucher", segment: "Penang foodies",     status: "paused",    scheduledAt: "Paused at 38%",  audience: 514,   delivered: 195,  read: 102,  replied: 18,  cost: 11.70,   owner: "Priya Subramaniam" },
];

// Inbox conversations
const CONVERSATIONS = [
  {
    id: "co1",
    contactId: "c2",
    name: "Lim Wei Jie",
    initials: "LW",
    color: "#075E54",
    phone: fmtPhone("16-228 1903"),
    tags: ["foodie", "Penang"],
    lang: "en",
    state: "esc", // operator must approve bot draft
    assignee: "u3",
    unread: 1,
    pinned: false,
    lastActivity: "12 min ago",
    windowMinutesLeft: 1380, // 23h
    preview: "Boleh tukar slot kepada esok pagi tak?",
    csValueLifetime: 412.00,
    messages: [
      { id: "m1", side: "in",  body: "Hi, I ordered the chef's tasting menu for tonight 8pm.", at: "10:14", date: "Today" },
      { id: "m2", side: "out", body: "Hi Wei Jie, confirmed for tonight 8 PM, party of 4. Your booking ref is BKG-9821.", at: "10:14", by: "bot", date: "Today", intent: "booking_confirm", confidence: 0.94, model: "MiniMax-M2", auto: true },
      { id: "m3", side: "in",  body: "Eh sorry, boleh tukar slot kepada esok pagi tak? 11am brunch?", at: "10:26", date: "Today" },
    ],
    botDraft: {
      text: "Boleh, Wei Jie. Saya tukar tempahan anda ke esok 11:00 AM. Sila balas YA untuk sahkan, atau TIDAK untuk batal.",
      confidence: 0.62,
      intent: "reschedule_booking",
      knowledge: ["booking_policy.md §3", "operating_hours.md"],
      needsApproval: true,
    },
  },
  {
    id: "co2",
    contactId: "c6",
    name: "Ahmad Faizal",
    initials: "AF",
    color: "#128C7E",
    phone: fmtPhone("13-512 7780"),
    tags: ["VIP", "Selangor"],
    lang: "ms",
    state: "auto", // bot handled, low-priority
    assignee: null,
    unread: 0,
    pinned: true,
    lastActivity: "32 min ago",
    windowMinutesLeft: 1310,
    preview: "Thanks! Akan pasang nanti 👌",
    csValueLifetime: 3104.00,
    messages: [
      { id: "m1", side: "in",  body: "Boleh hantar tracking link pesanan saya?", at: "09:48", date: "Today" },
      { id: "m2", side: "out", body: "Ahmad, pesanan #SO-44210 sedang dalam perjalanan. Track: https://trk.co/SO-44210", at: "09:48", by: "bot", date: "Today", intent: "order_tracking", confidence: 0.97, model: "Qwen3", auto: true },
      { id: "m3", side: "in",  body: "Thanks! Akan pasang nanti 👌", at: "10:02", date: "Today" },
    ],
    botDraft: null,
  },
  {
    id: "co3",
    contactId: "c1",
    name: "Nurul Izzah",
    initials: "NI",
    color: "#6B4A82",
    phone: fmtPhone("12-345 6789"),
    tags: ["VIP", "KL"],
    lang: "ms",
    state: "reply",
    assignee: "u2",
    unread: 0,
    pinned: false,
    lastActivity: "32 min ago",
    windowMinutesLeft: 480, // 8h
    preview: "Saya dah baca, masih tunggu update dari finance.",
    csValueLifetime: 1842.50,
    messages: [
      { id: "m1", side: "in",  body: "Hi, refund untuk order #SO-43102 belum masuk", at: "08:12", date: "Today" },
      { id: "m2", side: "out", body: "Maaf, Nurul. Saya tak dapat sahkan status refund. Saya akan rujuk kepada pasukan kewangan.", at: "08:13", by: "bot", date: "Today", intent: "refund_status", confidence: 0.42, model: "MiniMax-M2", auto: false },
      { id: "m3", side: "in",  body: "Refund saya belum masuk, dah 5 hari…", at: "08:14", date: "Today" },
      { id: "m4", side: "system", body: "Escalated to Daniel Ng · low confidence (refund_status)", at: "08:14", date: "Today" },
      { id: "m5", side: "in",  body: "Tolong follow up, urgent. Saya nak buat report.", at: "10:01", date: "Today" },
      { id: "m6", side: "out", body: "Salam Nurul, saya Daniel dari pasukan kewangan. Saya dah trace refund anda — ia sedang diproses oleh bank, akan masuk dalam 1–2 hari bekerja. Saya akan update bila settled.", at: "10:18", by: "u2", date: "Today" },
    ],
    botDraft: null,
  },
  {
    id: "co4",
    contactId: "c10",
    name: "Wong Zhi Hao",
    initials: "WZ",
    color: "#4A6B82",
    phone: fmtPhone("11-2256 1108"),
    tags: ["foodie"],
    lang: "en",
    state: "auto",
    assignee: null,
    unread: 0,
    pinned: false,
    lastActivity: "4h ago",
    windowMinutesLeft: 1200,
    preview: "Pickup confirmed, see you at 7.",
    csValueLifetime: 220.00,
    messages: [
      { id: "m1", side: "in",  body: "What time can I collect today?", at: "06:11", date: "Today" },
      { id: "m2", side: "out", body: "Hi Zhi Hao, your order is ready for pickup from 5 PM until close (10 PM).", at: "06:11", by: "bot", date: "Today", intent: "pickup_time", confidence: 0.93, model: "Qwen3", auto: true },
      { id: "m3", side: "in",  body: "Pickup confirmed, see you at 7.", at: "06:13", date: "Today" },
    ],
    botDraft: null,
  },
  {
    id: "co5",
    contactId: "c8",
    name: "Mohd Iqbal",
    initials: "MI",
    color: "#825A4A",
    phone: fmtPhone("18-330 5512"),
    tags: ["VIP", "KL"],
    lang: "ms",
    state: "esc",
    assignee: "u3",
    unread: 1,
    pinned: false,
    lastActivity: "1h ago",
    windowMinutesLeft: 1380,
    preview: "Berapa cost untuk express delivery ke Cheras?",
    csValueLifetime: 1278.40,
    messages: [
      { id: "m1", side: "in",  body: "Salam, berapa cost untuk express delivery ke Cheras?", at: "09:31", date: "Today" },
    ],
    botDraft: {
      text: "Wa'alaikumsalam, Iqbal. Express delivery ke Cheras ialah RM 12 (1–2 jam). Sila sahkan alamat penuh untuk teruskan.",
      confidence: 0.84,
      intent: "shipping_quote",
      knowledge: ["shipping_table.md §KL"],
      needsApproval: false,
    },
  },
  {
    id: "co6",
    contactId: "c11",
    name: "Farah Khairudin",
    initials: "FK",
    color: "#1E88A8",
    phone: fmtPhone("13-712 3340"),
    tags: ["VIP"],
    lang: "ms",
    state: "auto",
    assignee: null,
    unread: 0,
    pinned: false,
    lastActivity: "Yesterday",
    windowMinutesLeft: 30,
    preview: "OK terima kasih.",
    csValueLifetime: 1980.00,
    messages: [
      { id: "m1", side: "in",  body: "Adakah anda buka pada hari Ahad?", at: "16:42", date: "Yesterday" },
      { id: "m2", side: "out", body: "Ya, Farah. Kami buka setiap hari 10 AM – 10 PM.", at: "16:42", by: "bot", date: "Yesterday", intent: "operating_hours", confidence: 0.98, model: "Qwen3", auto: true },
      { id: "m3", side: "in",  body: "OK terima kasih.", at: "16:44", date: "Yesterday" },
    ],
    botDraft: null,
  },
  {
    id: "co7",
    contactId: "c3",
    name: "Raj Kumar",
    initials: "RK",
    color: "#075E54",
    phone: fmtPhone("11-1207 8830"),
    tags: ["VIP"],
    lang: "en",
    state: "new",
    assignee: null,
    unread: 1,
    pinned: false,
    lastActivity: "3h ago",
    windowMinutesLeft: 1260,
    preview: "Can I get an invoice with my company GST?",
    csValueLifetime: 2380.10,
    messages: [
      { id: "m1", side: "in",  body: "Can I get an invoice with my company GST?", at: "07:42", date: "Today" },
    ],
    botDraft: null,
  },
  {
    id: "co8",
    contactId: "c7",
    name: "Tan Hui Min",
    initials: "TH",
    color: "#6B4A82",
    phone: fmtPhone("12-887 9061"),
    tags: ["new"],
    lang: "en",
    state: "auto",
    assignee: null,
    unread: 0,
    pinned: false,
    lastActivity: "Yesterday",
    windowMinutesLeft: 60,
    preview: "Welcome offer claimed.",
    csValueLifetime: 38.00,
    messages: [
      { id: "m1", side: "in",  body: "Hi I'm new, do you have a welcome offer?", at: "15:02", date: "Yesterday" },
      { id: "m2", side: "out", body: "Welcome, Hui Min! Use code FIRST15 for 15% off your first order.", at: "15:02", by: "bot", date: "Yesterday", intent: "welcome_offer", confidence: 0.91, model: "MiMo-V2-Flash", auto: true },
      { id: "m3", side: "in",  body: "Welcome offer claimed.", at: "15:18", date: "Yesterday" },
    ],
    botDraft: null,
  },
];

const AUDIT = [
  { at: "10:42",  actor: "Aisyah Rahman", action: "Sent campaign", target: "Merdeka flash 2× points",   ip: "203.106.84.12",  scope: "admin" },
  { at: "10:31",  actor: "Mei Ling Tan",   action: "Submitted template for review", target: "raya_promo_2025", ip: "203.106.84.41", scope: "admin" },
  { at: "10:18",  actor: "Daniel Ng",      action: "Replied in inbox", target: "Nurul Izzah", ip: "175.140.21.7", scope: "operator" },
  { at: "09:55",  actor: "system",         action: "Quality rating updated", target: "Medium → High", ip: "—", scope: "system" },
  { at: "09:42",  actor: "Mei Ling Tan",   action: "Added user", target: "Khairul Anwar (operator)", ip: "203.106.84.41", scope: "admin" },
  { at: "09:21",  actor: "Aisyah Rahman",  action: "Edited segment", target: "VIP — Klang Valley", ip: "203.106.84.12", scope: "admin" },
  { at: "08:14",  actor: "system",         action: "Escalated conversation", target: "Nurul Izzah · refund_status", ip: "—", scope: "system" },
  { at: "Yesterday 17:02", actor: "Aisyah Rahman", action: "Updated chatbot knowledge", target: "shipping_table.md", ip: "203.106.84.12", scope: "admin" },
  { at: "Yesterday 15:48", actor: "Priya Subramaniam", action: "Paused campaign", target: "Penang foodie preview", ip: "175.143.9.224", scope: "operator" },
  { at: "Yesterday 14:11", actor: "system", action: "Template rejected by Meta", target: "winback_60day · reason: promotional content in utility category", ip: "—", scope: "system" },
];

const KB_DOCS = [
  { id: "k1", title: "shipping_table.md",  category: "Logistics", words: 1240, updated: "Today 09:18",  author: "Aisyah Rahman",  status: "live",  embeds: 142 },
  { id: "k2", title: "booking_policy.md",  category: "Booking",   words: 870,  updated: "2 days ago",    author: "Mei Ling Tan",   status: "live",  embeds: 88 },
  { id: "k3", title: "operating_hours.md", category: "General",   words: 312,  updated: "1 week ago",    author: "Daniel Ng",      status: "live",  embeds: 24 },
  { id: "k4", title: "billing_faq.md",     category: "Billing",   words: 2104, updated: "3 days ago",    author: "Aisyah Rahman",  status: "live",  embeds: 218 },
  { id: "k5", title: "refund_policy.md",   category: "Billing",   words: 1480, updated: "1 month ago",   author: "Aisyah Rahman",  status: "draft", embeds: 0 },
  { id: "k6", title: "ramadan_promo.md",   category: "Marketing", words: 612,  updated: "Yesterday",     author: "Mei Ling Tan",   status: "live",  embeds: 64 },
  { id: "k7", title: "menu_descriptions.md", category: "Menu",    words: 4280, updated: "5 days ago",    author: "Daniel Ng",      status: "live",  embeds: 480 },
];

// 14-day sparkline values (messages sent)
const SPARK_SENT = [820, 940, 1020, 880, 1150, 1280, 1190, 1340, 1490, 1380, 1620, 1840, 2010, 1920];
const SPARK_READ = [610, 720, 790, 650, 870, 980, 920, 1040, 1180, 1090, 1290, 1480, 1610, 1530];
const SPARK_REPLY = [78, 92, 104, 81, 113, 142, 128, 159, 174, 162, 198, 234, 261, 248];

Object.assign(window, {
  myrFmt, myrInt, fmtPhone,
  TEAMMATES, TEMPLATES, SEGMENTS, CONTACTS, CAMPAIGNS, CONVERSATIONS, AUDIT, KB_DOCS,
  SPARK_SENT, SPARK_READ, SPARK_REPLY,
});
