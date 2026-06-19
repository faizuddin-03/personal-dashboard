import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { StagedPlan } from '../../api/assistant';

export function PlanCards({
  staged, onApprove, onCancel, pending,
}: {
  staged: StagedPlan;
  onApprove: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const { plan } = staged;
  const t = plan.template;
  const sendAt = new Date(plan.schedule.sendAt);
  return (
    <div className="space-y-3">
      <Card title="Template" subtitle={t.mode === 'reuse' ? 'Reusing approved template' : 'New template (submits to Meta)'}>
        <div className="text-sm font-medium text-foreground">{t.name}</div>
        {t.mode === 'create' && (
          <>
            <div className="mt-1 text-xs text-foreground-muted">{t.category} · {t.languages.join(', ')}</div>
            <div className="mt-2 whitespace-pre-wrap rounded-md bg-background-subtle p-3 text-[13px] text-foreground">{t.bodyText}</div>
          </>
        )}
      </Card>

      <Card title="Audience">
        <div className="text-sm text-foreground">Segment: <span className="font-mono">{plan.audience.segmentId}</span></div>
      </Card>

      <Card title="Schedule">
        <div className="text-sm text-foreground">{sendAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} (KL)</div>
        <div className="mt-1 text-xs text-foreground-muted">Campaign: {plan.campaignName}</div>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" onClick={onApprove} disabled={pending}>
          {pending ? 'Scheduling…' : 'Approve & schedule'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button>
      </div>
    </div>
  );
}
