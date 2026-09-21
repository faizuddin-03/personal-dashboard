import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulateInbound, getSimThread, resetSim, getSimStatus } from '../api/simulator';

export default function Simulator() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('60123456789');
  const [draft, setDraft] = useState('');

  const status = useQuery({ queryKey: ['sim-status'], queryFn: getSimStatus });
  const thread = useQuery({
    queryKey: ['sim-thread', phone],
    queryFn: () => getSimThread(phone),
    refetchInterval: 2000,
  });

  const send = useMutation({
    mutationFn: (text: string) => simulateInbound(phone, text),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['sim-thread', phone] });
    },
  });

  const reset = useMutation({
    mutationFn: () => resetSim(phone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-thread', phone] }),
  });

  const s = status.data;
  const modeBanner = s
    ? s.llmMock
      ? 'Mock LLM — replies are canned & deterministic'
      : 'Ollama — real RAG answers'
    : '…';

  return (
    <div className="sim-phone" data-testid="simulator-page">
      <header className="sim-phone-head">
        <input
          data-testid="sim-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
          aria-label="Phone number"
        />
        <span className="sim-mode" data-testid="sim-mode">{modeBanner}</span>
        <button data-testid="sim-reset" onClick={() => reset.mutate()} disabled={reset.isPending}>
          Reset
        </button>
      </header>

      <div className="sim-thread" data-testid="sim-thread">
        {(thread.data?.items ?? []).map((m) => (
          <div
            key={m.id}
            className={`sim-bubble sim-${m.direction}`}
            data-testid="sim-bubble"
            data-kind={m.kind}
            data-direction={m.direction}
          >
            <div className="sim-bubble-body">{m.body || <em>(no reply — escalated)</em>}</div>
            <div className="sim-bubble-meta">
              {m.kind === 'blast' && m.meta?.templateName ? `blast · ${m.meta.templateName} · ${m.meta.status}` : null}
              {m.kind === 'bot_reply' ? 'bot' : null}
              {m.kind === 'operator_reply' ? 'operator' : null}
            </div>
          </div>
        ))}
      </div>

      <form
        className="sim-composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send.mutate(draft.trim());
        }}
      >
        <input
          data-testid="sim-message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message as the customer…"
          aria-label="Message"
        />
        <button data-testid="sim-send" type="submit" disabled={send.isPending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
