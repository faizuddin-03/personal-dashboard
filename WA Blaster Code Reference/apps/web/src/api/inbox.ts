import { api } from './client';

export type InboxTab = 'all' | 'awaiting' | 'replied' | 'resolved';

export interface InboxContact {
  id: string;
  name: string;
  phone: string;
}

export interface ConversationListItem {
  contact: InboxContact;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  resolvedAt: string | null;
  lastPreview: string;
  lastDirection: 'inbound' | 'outbound';
  windowExpiresAt: string | null;
  windowOpen: boolean;
  attribution: { blastId: string; blastName: string } | null;
}

export interface ThreadMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: string;
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  source?: 'BLAST' | 'INBOX';
  blastName?: string;
  failureReason?: string;
}

export interface ConversationDetail {
  contact: InboxContact;
  messages: ThreadMessage[];
  windowExpiresAt: string | null;
  windowOpen: boolean;
  resolvedAt: string | null;
}

export async function listInboxConversations(params: {
  tab: InboxTab;
  cursor?: string;
  limit?: number;
  search?: string;
}): Promise<{ items: ConversationListItem[]; nextCursor: string | null }> {
  const { data } = await api.get<{ items: ConversationListItem[]; nextCursor: string | null }>(
    '/inbox/conversations',
    { params },
  );
  return data;
}

export async function getInboxConversation(contactId: string): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>(`/inbox/conversations/${contactId}`);
  return data;
}

export async function sendInboxReply(
  contactId: string,
  body: string,
): Promise<{ message: ThreadMessage }> {
  const { data } = await api.post<{ message: ThreadMessage }>(
    `/inbox/conversations/${contactId}/messages`,
    { body },
  );
  return data;
}

export async function resolveInboxConversation(contactId: string): Promise<void> {
  await api.post(`/inbox/conversations/${contactId}/resolve`);
}

export async function reopenInboxConversation(contactId: string): Promise<void> {
  await api.post(`/inbox/conversations/${contactId}/reopen`);
}

export async function getInboxUnreadCount(): Promise<{ count: number }> {
  const { data } = await api.get<{ count: number }>('/inbox/unread-count');
  return data;
}
