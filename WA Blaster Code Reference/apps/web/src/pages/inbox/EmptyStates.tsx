import { Link } from 'react-router-dom';
import { Empty, IcMessage, IcLock } from '../../components/ui';

export function EmptyInbox() {
  return (
    <Empty
      icon={<IcMessage size={20} />}
      title="No conversations yet"
      body="They'll appear here when contacts reply to your blasts."
      cta={
        <Link
          to="/blasts"
          className="text-[13px] font-medium text-accent hover:underline"
        >
          Go to Blasts →
        </Link>
      }
    />
  );
}

export function EmptyTab({ tab }: { tab: string }) {
  return <Empty title={`No ${tab} conversations right now.`} />;
}

export function ComingSoonAI() {
  return (
    <Empty
      icon={<IcLock size={20} />}
      title="Coming soon"
      body="Auto-reply and escalation arrive with the chatbot subsystem in a future phase. For now, all replies route to your human inbox."
    />
  );
}

export function NoSelection() {
  return (
    <Empty
      icon={<IcMessage size={20} />}
      title="Select a conversation"
      body="Pick a conversation from the list to view the thread."
    />
  );
}
