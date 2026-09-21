/**
 * Imported FIRST by the sim CLI and the soak script, before any other module. It loads apps/api/.env
 * so configured flags (e.g. a real-mode LLM_MOCK_MODE=false) win, THEN defaults any still-unset mock
 * flags to 'true' so the tools never hit real services when nothing is configured. A simulator must
 * also never send a real WhatsApp message.
 *
 * Kept in its own module so the .env load is guaranteed to run before the defaulting below — and
 * both run before AppModule's ConfigModule reads process.env (dotenv does not override existing
 * process.env values, so inline `LLM_MOCK_MODE=true ...` still wins over .env).
 */
import 'dotenv/config';

for (const key of ['WHATSAPP_MOCK_MODE', 'LLM_MOCK_MODE', 'EMBEDDINGS_MOCK_MODE']) {
  if (!process.env[key]) process.env[key] = 'true';
}
