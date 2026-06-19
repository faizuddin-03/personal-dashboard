import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listStateLanguageMappings,
  upsertStateLanguageMapping,
  clearStateLanguageMapping,
  stateLabel,
  ALL_STATES,
  type MalaysianState,
  type StateMappingRow,
} from '../../api/stateLanguageMappings';
import type { LanguagePreference } from '../../api/contacts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';

const LANGUAGES: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];

export default function StateLanguageMappingCard() {
  const qc = useQueryClient();
  const { data: mappings, isLoading, error } = useQuery({
    queryKey: ['state-language-mappings'],
    queryFn: listStateLanguageMappings,
  });

  const [editingState, setEditingState] = useState<MalaysianState | null>(null);
  const [draft, setDraft] = useState<LanguagePreference[]>([]);

  const byState = new Map<MalaysianState, LanguagePreference[]>();
  for (const row of mappings ?? []) byState.set(row.state, row.languages);

  const onSuccess = (data: StateMappingRow[]) => {
    qc.setQueryData(['state-language-mappings'], data);
    qc.invalidateQueries({ queryKey: ['state-language-mappings'] });
    setEditingState(null);
    setDraft([]);
  };

  const upsert = useMutation({
    mutationFn: ({ state, languages }: { state: MalaysianState; languages: LanguagePreference[] }) =>
      upsertStateLanguageMapping(state, languages),
    onSuccess,
  });

  const clear = useMutation({
    mutationFn: (state: MalaysianState) => clearStateLanguageMapping(state),
    onSuccess,
  });

  const saving = upsert.isPending || clear.isPending;

  function startEdit(state: MalaysianState) {
    setEditingState(state);
    setDraft(byState.get(state) ?? []);
  }

  function toggleLang(lang: LanguagePreference) {
    setDraft((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  }

  function save(state: MalaysianState) {
    if (draft.length > 0) {
      upsert.mutate({ state, languages: draft });
    } else {
      clear.mutate(state);
    }
  }

  return (
    <Card
      title="State → language mapping"
      subtitle="When blasting by contact state, each contact receives a message in every language mapped to their state."
    >
      {isLoading && <p className="text-[13px] text-foreground-muted">Loading…</p>}
      {error && <p className="text-[13px] text-red-500">Failed to load mappings.</p>}
      {mappings && (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-[13px]" data-testid="state-lang-table">
            <thead className="bg-background-subtle">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">State</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-foreground-muted">Languages</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {ALL_STATES.map((state) => {
                const langs = byState.get(state) ?? [];
                const isEditing = editingState === state;
                return (
                  <tr key={state} className="border-t border-border align-top" data-testid={`state-lang-row-${state}`}>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{stateLabel(state)}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-3" data-testid="state-lang-multiselect">
                          {LANGUAGES.map((lang) => (
                            <label key={lang} className="inline-flex items-center gap-1.5 text-[13px] text-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={draft.includes(lang)}
                                onChange={() => toggleLang(lang)}
                                className="h-3.5 w-3.5 rounded border-border-strong text-accent focus:ring-accent"
                                data-testid={`state-lang-opt-${lang}`}
                              />
                              {lang}
                            </label>
                          ))}
                        </div>
                      ) : langs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {langs.map((lang) => (
                            <Pill key={lang} tone="blue">{lang}</Pill>
                          ))}
                        </div>
                      ) : (
                        <span className="text-foreground-muted">— (default)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => save(state)}
                            disabled={saving}
                            className="mr-1"
                            data-testid="state-lang-save"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingState(null); setDraft([]); }}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(state)}
                          className="text-accent hover:text-accent"
                        >
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
