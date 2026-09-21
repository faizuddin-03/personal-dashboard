import type { BlastStatus } from '../api/blasts';
import { StatusPill } from './ui/Pill';

export default function BlastStatusBadge({ status }: { status: BlastStatus }) {
  return <StatusPill status={status} testId={`blast-status-${status}`} />;
}
