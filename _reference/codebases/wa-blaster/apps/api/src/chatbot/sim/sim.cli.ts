/**
 * Chatbot CLI simulator. Boots a standalone Nest context (no HTTP server) and pipes messages
 * through the real {@link ChatbotService.handleInbound} pipeline, printing the decision, the reply,
 * and the citations.
 *
 * Interactive:  pnpm --filter api chatbot:sim
 * Batch:        pnpm --filter api chatbot:sim -- --file=msgs.json
 *               (msgs.json = [{ "phone": "60123456789", "message": "What time do you open?" }, ...])
 *
 * Defaults all mock flags ON unless already set, so it never makes a real Meta/Ollama call by
 * accident. Override with e.g. LLM_MOCK_MODE=false EMBEDDINGS_MOCK_MODE=false to drive real models.
 */
// Imported first: loads apps/api/.env (so real-mode flags win) then defaults any unset mock flags.
import './bootstrap-env';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SimAppModule } from './sim-app.module';
import { ChatbotSimulator } from './sim.command';

function parseFileArg(argv: string[]): string | null {
  const eq = argv.find((a) => a.startsWith('--file='));
  if (eq) return eq.slice('--file='.length);
  const idx = argv.indexOf('--file');
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return null;
}

async function main(): Promise<void> {
  // Quiet boot logs (drop 'log'-level InstanceLoader spam) so the interactive prompt is visible;
  // keep warn/error so Ollama/DB problems still surface.
  const app = await NestFactory.createApplicationContext(SimAppModule, { logger: ['error', 'warn'] });
  const sim = new ChatbotSimulator(app);
  try {
    const file = parseFileArg(process.argv.slice(2));
    if (file) {
      await sim.runBatch(file);
    } else {
      await sim.runInteractive();
    }
  } finally {
    await app.close();
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err) => {
    new Logger('chatbot:sim').error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
