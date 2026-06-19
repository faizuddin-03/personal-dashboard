import { Injectable } from '@nestjs/common';

@Injectable()
export class YesNoDetector {
  private readonly yesPatterns = [
    // English
    /\b(yes|yeah|yep|yup|ok|okay|sure|please|alright|go ahead|do it|connect me|i would|i'd like|sounds good)\b/i,
    // Malay — affirmations
    /\b(ya|ye|ok ?lah|boleh|setuju|sila|teruskan|silakan)\b/i,
    // Malay — want-words, but NOT when negated by a preceding tak/tidak ("tak nak" is a refusal)
    /(?<!\btak ?)(?<!\btidak )\b(nak|mahu|mau)\b/i,
  ];
  private readonly noPatterns = [
    // English
    /\b(no|nope|nah|not now|not really|skip|don't|do not|never mind|nvm|later|no thanks|maybe later|i'm good|i am good)\b/i,
    // Malay
    /\b(tak|tidak|tak ?nak|tak ?mahu|tak ?payah|jangan|tak ?perlu|lain ?kali|tak ?usah)\b/i,
  ];
  // Hesitation / reversal markers — the sender is walking back a clean answer, so treat as ambiguous.
  private readonly reversalPattern = /\b(but|actually|wait|hold on|however|hmm)\b/i;

  detect(message: string): 'yes' | 'no' | 'ambiguous' {
    const text = (message ?? '').trim().toLowerCase();
    if (!text) return 'ambiguous';
    if (this.reversalPattern.test(text)) return 'ambiguous';
    const hasYes = this.yesPatterns.some((r) => r.test(text));
    const hasNo = this.noPatterns.some((r) => r.test(text));
    if (hasYes && !hasNo) return 'yes';
    if (hasNo && !hasYes) return 'no';
    return 'ambiguous'; // both or neither → let the engine treat as new turn
  }
}
