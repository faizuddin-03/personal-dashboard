import { useQuery } from '@tanstack/react-query';
import { listInboxConversations, InboxTab } from '../api/inbox';

export function useInboxConversations(params: { tab: InboxTab; search?: string }) {
  return useQuery({
    queryKey: ['inbox', 'conversations', params.tab, params.search ?? ''],
    queryFn: () => listInboxConversations({ tab: params.tab, search: params.search, limit: 50 }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
