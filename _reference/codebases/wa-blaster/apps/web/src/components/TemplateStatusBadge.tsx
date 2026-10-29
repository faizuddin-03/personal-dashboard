import type { TemplateStatus } from '../api/templates';
import { StatusPill } from './ui/Pill';

export default function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return <StatusPill status={status} testId={`status-badge-${status}`} />;
}
