import { ChatMessage, LlmAdapter, LlmCompleteOptions, LlmCompletion } from './adapter.interface';

/**
 * Deterministic, network-free adapter used when LLM_MOCK_MODE=true (and in tests).
 * Picks an intent from keywords in the last user message; returns JSON when jsonMode
 * is set (classify) or a canned reply otherwise (draft). No randomness, no clock.
 */
export class MockAdapter implements LlmAdapter {
  name(): string {
    return 'mock';
  }

  async complete(messages: ChatMessage[], opts: LlmCompleteOptions = {}): Promise<LlmCompletion> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    const intent = classify(lastUser);
    const text = opts.jsonMode
      ? JSON.stringify({ intent, confidence: intent === 'other' ? 0.5 : 0.9 })
      : draft(intent);
    return { text, modelUsed: 'mock', latencyMs: 0, finishReason: 'stop' };
  }
}

function classify(message: string): string {
  const text = message.toLowerCase();
  if (/refund|pulang|return/.test(text)) return 'refund';
  if (/harga|price|berapa|cost/.test(text)) return 'pricing';
  if (/hello|hi|hai|salam/.test(text)) return 'greeting';
  return 'other';
}

function draft(intent: string): string {
  switch (intent) {
    case 'refund':
      return 'Untuk permohonan refund, sila kongsi nombor pesanan anda dan kami akan bantu.';
    case 'pricing':
      return 'Terima kasih atas pertanyaan harga — boleh kongsi produk yang anda minati?';
    case 'greeting':
      return 'Hai! Bagaimana kami boleh bantu anda hari ini?';
    default:
      return 'Terima kasih atas mesej anda. Boleh kongsi lebih lanjut supaya kami boleh bantu?';
  }
}
