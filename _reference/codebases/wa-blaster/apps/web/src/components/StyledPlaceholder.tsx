import { AIOrb } from './ui/AIOrb';
import { Page, PageHead } from './ui/Card';

interface StyledPlaceholderProps {
  title: string;
  note?: string;
}

export default function StyledPlaceholder({ title, note }: StyledPlaceholderProps) {
  return (
    <Page>
      <PageHead title={title} />
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AIOrb size={56} breathe style={{ borderRadius: 16 }} />
        <div className="mt-2 text-base font-medium text-foreground">{title}</div>
        <div className="max-w-xs text-[13px] text-foreground-muted">
          {note ?? 'This screen is coming soon.'}
        </div>
      </div>
    </Page>
  );
}
