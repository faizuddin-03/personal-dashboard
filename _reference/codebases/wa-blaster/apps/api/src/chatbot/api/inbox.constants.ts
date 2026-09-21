import { ConversationState } from '@prisma/client';

/**
 * Single source of truth for the operator inbox's named tabs. Each tab maps to the set of
 * ConversationStates it surfaces; `all` carries an empty set, meaning "no state filter".
 *
 * Both the list filter (ListConversationsDto / InboxService.listConversations) and the badge-count
 * summary (InboxService.summary) derive their buckets from this map, so the dashboard tabs and their
 * counts can never drift apart. Note that ESCALATED appears in both `escalated` and `awaiting_reply`
 * by design — every escalation is also something a human is awaited on.
 */
export const INBOX_TABS = {
  all: [],
  auto_replied: ['AUTO_REPLIED'],
  escalated: ['ESCALATED'],
  awaiting_reply: ['ESCALATED', 'AWAITING_REPLY'],
  in_progress: ['REPLIED'],
  resolved: ['RESOLVED'],
} satisfies Record<string, ConversationState[]>;

export type InboxTab = keyof typeof INBOX_TABS;
