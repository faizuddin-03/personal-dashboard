import { useQuery } from '@tanstack/react-query';
import { getInboxConversation } from '../api/inbox';

export function useInboxConversation(contactId: string | null) {
  return useQuery({
    queryKey: ['inbox', 'conversation', contactId],
    queryFn: () => getInboxConversation(contactId!),
    enabled: !!contactId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
