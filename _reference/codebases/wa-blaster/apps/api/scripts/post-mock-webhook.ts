/**
 * One-off CLI: sign and POST a synthetic Meta "messages" webhook at the running API, exercising
 * the full inbound path (signature verify → WebhookController → ChatbotService.handleInbound).
 *
 * Prereqs: the API is running with CHATBOT_ENABLED=true and the mock flags on
 * (LLM_MOCK_MODE=true, EMBEDDINGS_MOCK_MODE=true, WHATSAPP_MOCK_MODE=true), and the `from` number
 * belongs to an OPTED_IN contact. The chatbot's `enabled` setting (chatbot_settings) must be true.
 *
 *   npx ts-node scripts/post-mock-webhook.ts [fromE164NoPlus] [messageText]
 *   npx ts-node scripts/post-mock-webhook.ts 60123456789 "Can I get a refund?"
 */
import 'dotenv/config';
import * as crypto from 'crypto';

const PORT = process.env.PORT ?? '3000';
// Sign with whatever the API verifies with. A dev .env often leaves this empty, in which case
// both sides HMAC with an empty key — still a valid round-trip through the signature check.
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? '';
if (!APP_SECRET) {
  console.warn('WHATSAPP_APP_SECRET is empty — signing with an empty key (matches a dev .env with no secret).');
}

const from = process.argv[2] ?? '60123456789'; // E.164 digits, no leading '+'
const text = process.argv[3] ?? 'What time do you open?';
const wamid = `wamid.mock-${Date.now()}`;

const payload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'entry-mock',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '60000000000', phone_number_id: 'pnid-mock' },
            contacts: [{ wa_id: from, profile: { name: 'Mock Customer' } }],
            messages: [
              {
                from,
                id: wamid,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: 'text',
                text: { body: text },
              },
            ],
          },
        },
      ],
    },
  ],
};

// Sign the EXACT bytes we send — Meta's X-Hub-Signature-256 is HMAC-SHA256 over the raw body.
const raw = JSON.stringify(payload);
const signature = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');

async function main(): Promise<void> {
  // Global prefix is `api` (see main.ts → app.setGlobalPrefix('api')).
  const res = await fetch(`http://localhost:${PORT}/api/webhooks/meta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    body: raw,
  });
  const body = await res.text();
  console.log(`POST /api/webhooks/meta → ${res.status} ${body}`);
  console.log(`  from=+${from}  wamid=${wamid}  text=${JSON.stringify(text)}`);
  if (!res.ok) process.exitCode = 1;
}

main().catch((err) => {
  console.error('post-mock-webhook failed:', err);
  process.exit(1);
});
