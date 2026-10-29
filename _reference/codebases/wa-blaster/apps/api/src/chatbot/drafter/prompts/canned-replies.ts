import { Injectable } from '@nestjs/common';

export type CannedReplyKey =
  | 'consent_offer'
  | 'escalation_accepted'
  | 'escalation_declined'
  | 'still_being_processed';

const REPLIES: Record<CannedReplyKey, { en: string; ms: string }> = {
  consent_offer: {
    en: "I'm not sure I can answer that one accurately. Would you like me to connect you to our customer support team? Please reply YES or NO.",
    ms: 'Maaf, saya tidak pasti dengan jawapan untuk soalan ini. Adakah anda mahu saya sambungkan kepada pasukan khidmat pelanggan kami? Sila balas YA atau TIDAK.',
  },
  escalation_accepted: {
    en: "Got it — I've passed your question to our customer support team. Someone will get back to you shortly.",
    ms: 'Baik — saya telah hantar soalan anda kepada pasukan khidmat pelanggan. Mereka akan hubungi anda sebentar lagi.',
  },
  escalation_declined: {
    en: 'No problem. Let me know if you need anything else!',
    ms: 'Tiada masalah. Beritahu saya jika ada apa-apa lagi!',
  },
  still_being_processed: {
    en: "Your previous enquiry is still being processed by our team. Please wait until that's resolved before I can take a new question — thanks for your patience!",
    ms: 'Pertanyaan anda yang sebelumnya masih dalam proses oleh pasukan kami. Sila tunggu sehingga itu selesai dahulu sebelum saya boleh terima soalan baru — terima kasih atas kesabaran anda!',
  },
};

@Injectable()
export class CannedRepliesService {
  get(key: CannedReplyKey, language: 'en' | 'ms'): string {
    return REPLIES[key][language === 'ms' ? 'ms' : 'en'];
  }
}
