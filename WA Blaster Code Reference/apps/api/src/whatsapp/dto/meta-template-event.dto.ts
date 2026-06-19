export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  field: string; // e.g. "message_template_status_update"
  value: MetaTemplateStatusUpdateValue;
}

export interface MetaTemplateStatusUpdateValue {
  event: 'APPROVED' | 'REJECTED' | 'PENDING_DELETION' | 'FLAGGED' | 'DISABLED';
  message_template_id: string | number;
  message_template_name: string;
  message_template_language: string;
  reason?: string; // populated on REJECTED
}

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: MetaWebhookEntry[];
}
