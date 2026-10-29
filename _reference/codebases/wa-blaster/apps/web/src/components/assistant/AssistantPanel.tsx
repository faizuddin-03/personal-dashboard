import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAssistantMessage, approvePlan, cancelPlan, type ChatHistoryItem, type StagedPlan } from '../../api/assistant';
import { useToast } from '../toast/ToastProvider';
import { Button } from '../ui/Button';
import { AIOrb } from '../ui/AIOrb';
import { PlanCards } from './PlanCards';

const inputCls =
  'h-10 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent';

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState<StagedPlan | null>(null);

  const chat = useMutation({
    mutationFn: sendAssistantMessage,
    onSuccess: (res) => {
      setHistory((h) => [...h, { role: 'assistant', content: res.reply }]);
      if (res.plan) setPlan(res.plan);
    },
    onError: () => showToast('Assistant request failed'),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePlan(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['blasts'] });
      showToast(`Campaign scheduled (${res.templateName})`);
      setPlan(null);
      setHistory((h) => [...h, { role: 'assistant', content: 'Done — campaign scheduled.' }]);
    },
    onError: () => showToast('Could not schedule the campaign'),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || chat.isPending) return;
    const nextHistory = [...history, { role: 'user' as const, content: msg }];
    setHistory(nextHistory);
    setInput('');
    chat.mutate({ message: msg, history });
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Campaign assistant">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <AIOrb size={22} breathe />
            <span className="text-sm font-medium text-foreground">Campaign assistant</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {history.length === 0 && (
            <p className="text-[13px] text-foreground-muted">
              Try: "blast dealers about car A on Monday morning".
            </p>
          )}
          {history.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
              <span className={`inline-block rounded-lg px-3 py-2 text-[13px] ${m.role === 'user' ? 'bg-accent text-white' : 'bg-background-subtle text-foreground'}`}>
                {m.content}
              </span>
            </div>
          ))}
          {chat.isPending && <p className="text-[13px] text-foreground-muted">Thinking…</p>}
          {plan && (
            <PlanCards
              staged={plan}
              pending={approve.isPending}
              onApprove={() => approve.mutate(plan.id)}
              onCancel={() => { cancelPlan(plan.id).catch(() => undefined); setPlan(null); }}
            />
          )}
        </div>

        <form onSubmit={submit} className="border-t border-border p-3">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the campaign…"
            className={inputCls}
          />
        </form>
      </aside>
    </div>
  );
}
