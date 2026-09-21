import { useMemo } from 'react';

/**
 * Names each {{n}} placeholder found in a template body, one labelled input per
 * placeholder (e.g. "{{1}} : customer_name"). Replaces the old positional
 * comma-separated field so operators can't mis-align names with placeholders.
 *
 * The value model is unchanged from the rest of the app: `variables` is a
 * positional array where index i is the name for {{i+1}}. Blank trailing names
 * are dropped so the stored array matches what the API persists.
 */

const SAMPLE_NAMES = ['customer_name', 'plate_number', 'expiry_date', 'amount', 'agent_name'];

/** Distinct {{n}} numbers present in the body, ascending. */
function placeholderNumbers(body: string): number[] {
  const nums = new Set<number>();
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) nums.add(Number(m[1]));
  return Array.from(nums).sort((a, b) => a - b);
}

export interface VariableNameEditorProps {
  body: string;
  variables: string[];
  onChange: (variables: string[]) => void;
  disabled?: boolean;
}

export function VariableNameEditor({ body, variables, onChange, disabled }: VariableNameEditorProps) {
  const numbers = useMemo(() => placeholderNumbers(body), [body]);

  if (numbers.length === 0) {
    return (
      <p className="text-[12px] text-foreground-muted" data-testid="variable-name-editor-empty">
        Add <code className="font-mono">{'{{1}}'}</code> in the body to define a variable, then name it here.
      </p>
    );
  }

  const max = numbers[numbers.length - 1];
  // Meta requires placeholders to run sequentially from {{1}}.
  const sequential = numbers.length === max && numbers.every((n, i) => n === i + 1);

  function setName(index: number, value: string) {
    const next = variables.slice();
    while (next.length <= index) next.push('');
    next[index] = value;
    // Drop trailing blanks so a single named {{1}} stores as ['name'], not ['name',''].
    let end = next.length;
    while (end > 0 && (next[end - 1] ?? '').trim() === '') end--;
    onChange(next.slice(0, end));
  }

  return (
    <div className="space-y-2" data-testid="variable-name-editor">
      {numbers.map((n) => (
        <div key={n} className="flex items-center gap-2.5">
          <code className="shrink-0 rounded bg-background-hover px-2 py-1 font-mono text-xs text-foreground">
            {`{{${n}}}`}
          </code>
          <span className="text-foreground-muted text-sm" aria-hidden>:</span>
          <input
            type="text"
            value={variables[n - 1] ?? ''}
            onChange={(e) => setName(n - 1, e.target.value)}
            disabled={disabled}
            placeholder={`e.g. ${SAMPLE_NAMES[(n - 1) % SAMPLE_NAMES.length]}`}
            className="flex-1 rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            data-testid={`variable-name-${n}`}
          />
        </div>
      ))}
      {!sequential && (
        <p className="text-[12px] text-amber-600" data-testid="variable-sequence-warning">
          Variables must be numbered sequentially starting at <code className="font-mono">{'{{1}}'}</code>{' '}
          (e.g. <code className="font-mono">{'{{1}}'}</code>, <code className="font-mono">{'{{2}}'}</code>).
          Renumber the placeholders in your body.
        </p>
      )}
    </div>
  );
}
