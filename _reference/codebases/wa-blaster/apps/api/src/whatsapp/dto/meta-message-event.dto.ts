export interface MetaMessageStatusEvent {
  id: string;                                // wamid of the message
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;                         // unix epoch seconds, as string
  recipient_id: string;                      // phone number
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface MetaInboundMessage {
  from: string;                    // E.164 phone number without leading "+"
  id: string;                      // wamid
  timestamp: string;               // unix seconds, as string
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'interactive' | 'button' | 'reaction';
  text?: { body: string };
  context?: { id?: string; from?: string };
  button?: { text: string; payload?: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
}

export interface MetaMessagesValue {
  messaging_product: 'whatsapp';
  metadata: { display_phone_number: string; phone_number_id: string };
  statuses?: MetaMessageStatusEvent[];
  messages?: MetaInboundMessage[];
  contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
}
