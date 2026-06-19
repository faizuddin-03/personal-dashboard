// notifications.ts — Notif type + seed data
// Translated from docs/design/app.jsx NOTIFS_SEED (design intent)

export interface Notif {
  id: string;
  tone: string;
  icon: string;
  text: string;
  time: string;
  read: boolean;
  screen?: string;
}

export const NOTIFS_SEED: Notif[] = [
  {
    id: 'n1',
    tone: 'amber',
    icon: 'alert',
    text: 'Nurul Izzah escalated — needs human review',
    time: '2 min ago',
    read: false,
    screen: 'inbox',
  },
  {
    id: 'n2',
    tone: 'success',
    icon: 'checkCircle',
    text: 'Template raya_promo_2025 approved by Meta',
    time: '18 min ago',
    read: false,
    screen: 'templates',
  },
  {
    id: 'n3',
    tone: 'red',
    icon: 'x',
    text: 'Template hari_raya_flash rejected — policy violation',
    time: '1 hr ago',
    read: false,
    screen: 'templates',
  },
  {
    id: 'n4',
    tone: 'brand',
    icon: 'checkCircle',
    text: 'Campaign "Merdeka flash 2× points" finished — 4,821 sent',
    time: '3 hr ago',
    read: true,
    screen: 'campaigns',
  },
  {
    id: 'n5',
    tone: 'ai',
    icon: 'sparkle',
    text: 'AI handled 47 conversations while you were away',
    time: 'Yesterday',
    read: true,
    screen: 'inbox',
  },
];
