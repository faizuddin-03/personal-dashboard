import { useQuery } from '@tanstack/react-query';
import { getInboxUnreadCount } from '../api/inbox';

export function useInboxUnreadCount() {
  return useQuery({
    queryKey: ['inbox', 'unread-count'],
    queryFn: getInboxUnreadCount,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}
