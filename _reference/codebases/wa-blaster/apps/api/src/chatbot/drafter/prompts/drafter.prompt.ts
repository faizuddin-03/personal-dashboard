export function buildDrafterSystemPrompt(input: {
  businessName: string;
  language: 'en' | 'ms';
  chunks: Array<{ rank: number; text: string; document: { title: string; category: string } }>;
  campaignText?: string;
  history?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
  /**
   * When true, the confidence instruction is anchored to SOURCE coverage and explicitly decoupled
   * from output-language/translation difficulty. Gated (default false) because it also promotes
   * confident-but-wrong cross-lingual answers to auto-send where retrieval is imprecise (e.g. the
   * NCD-class wall) — safe to enable only alongside a faithfulness/grounding backstop. See
   * CHATBOT_CONFIDENCE_DECOUPLE_LANG in DrafterService.
   */
  decoupleLangConfidence?: boolean;
}): string {
  const lang = input.language === 'ms' ? 'Bahasa Malaysia' : 'English';
  const sources = input.chunks.length
    ? input.chunks
        .map(
          (c) =>
            `[CHUNK ${c.rank} — from "${c.document.title}" (${c.document.category})]\n${c.text}`,
        )
        .join('\n\n---\n\n')
    : '(no relevant knowledge found)';

  const campaignBlock = input.campaignText
    ? `CAMPAIGN (the marketing message this customer recently received — answer questions about this offer, discount, or deadline from here):\n${input.campaignText}\n\n`
    : '';

  const historyBlock =
    input.history && input.history.length
      ? `RECENT CONVERSATION (oldest first; use it to resolve follow-up questions like "what about that?"):\n${input.history
          .map(
            (h) =>
              `${h.role === 'customer' ? 'Customer' : h.role === 'operator' ? 'Agent' : 'You'}: ${h.body}`,
          )
          .join('\n')}\n\n`
      : '';

  const usesCampaign = Boolean(input.campaignText);

  const sourceInstruction = usesCampaign
    ? `Use ONLY the facts in the CAMPAIGN and SOURCES sections below. Do NOT invent prices, dates, policies, or any fact not present there. If the customer asks about the offer they received, answer from CAMPAIGN; otherwise use SOURCES. If neither contains the answer, say "Let me check with my colleague and get back to you shortly." in ${lang}.`
    : `Use ONLY the facts in the SOURCES below. Do NOT invent prices, dates, policies, or any fact not in the sources. If the sources don't contain the answer, say "Let me check with my colleague and get back to you shortly." in ${lang}.`;

  const confidenceLine = input.decoupleLangConfidence
    ? usesCampaign
      ? `- confidence: how well the CAMPAIGN/SOURCES contain the facts needed to answer — NOT how hard it is to phrase the reply. If the facts are present, stay confident even when you must translate them into ${lang}. 1.0 = fully answered, 0.5 = partial, 0.0 = no relevant info.`
      : `- confidence: how well the SOURCES contain the facts needed to answer — NOT how hard it is to phrase the reply. If the facts are present, stay confident even when you must translate them into ${lang}. 1.0 = fully answered, 0.5 = partial, 0.0 = no relevant info.`
    : usesCampaign
      ? '- confidence: how well the CAMPAIGN/SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.'
      : '- confidence: how well the SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.';

  const citedLine = usesCampaign
    ? '- cited_chunks: array of SOURCE chunk numbers (1-indexed) you actually used. Use an empty array if you answered from CAMPAIGN or said "let me check".'
    : '- cited_chunks: array of chunk numbers (1-indexed) you actually used in the reply. Empty array if you said "let me check".';

  return `You are a customer support agent for ${input.businessName}, a Malaysian business. Reply in ${lang}, briefly and politely.

${sourceInstruction}

Keep replies under 200 characters when possible. Do NOT mention that you are an AI, bot, or automated system.

${campaignBlock}${historyBlock}SOURCES:
${sources}

Respond ONLY with a JSON object: {"reply": "...", "confidence": 0.0-1.0, "cited_chunks": [<rank>, ...]}
${confidenceLine}
${citedLine}`;
}
