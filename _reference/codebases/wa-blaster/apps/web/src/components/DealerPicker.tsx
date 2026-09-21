import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listContacts, type Contact } from '../api/contacts';
import { stateLabel } from '../api/stateLanguageMappings';

/**
 * Searchable, paginated multi-select for hand-picking individual dealers as a
 * blast audience. Only blast-eligible dealers (opted-in, real phone number) are
 * listed; the backend re-enforces that on send. Selection persists across search
 * and pagination because we track chosen contacts in a map keyed by id.
 */

const PAGE_SIZE = 8;

export interface DealerPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function DealerPicker({ selected, onChange }: DealerPickerProps) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);

  // Remember chosen dealers so their chips render even when off the current page.
  const [chosen, setChosen] = useState<Record<string, Contact>>({});

  // Debounce the search box; reset to page 1 whenever the term changes.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ['dealer-picker', debounced, page],
    queryFn: () =>
      listContacts({
        search: debounced || undefined,
        optInStatus: ['OPTED_IN'],
        numberType: ['PHONE'],
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(contact: Contact) {
    setChosen((prev) => ({ ...prev, [contact.id]: contact }));
    onChange(
      selectedSet.has(contact.id)
        ? selected.filter((id) => id !== contact.id)
        : [...selected, contact.id],
    );
  }

  function clearAll() {
    onChange([]);
  }

  function dealerLabel(c: Contact): string {
    return c.name?.trim() || c.phoneE164;
  }

  return (
    <div className="space-y-3" data-testid="dealer-picker">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search dealers by name or phone…"
        className="w-full h-9 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        data-testid="dealer-search"
      />

      {/* Selected summary */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12.5px] text-foreground-muted" data-testid="dealer-picker-count">
          {selected.length} dealer{selected.length === 1 ? '' : 's'} selected
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-medium text-red-500 hover:text-red-600"
            data-testid="dealer-clear"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-2.5 py-1 text-[12px] text-foreground"
            >
              {chosen[id] ? dealerLabel(chosen[id]) : id.slice(0, 8)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== id))}
                aria-label="remove dealer"
                className="text-foreground-muted hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results list */}
      <div className="rounded-md border border-border divide-y divide-border">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-foreground-muted">
            {isFetching ? 'Searching…' : 'No eligible dealers found.'}
          </p>
        ) : (
          items.map((c) => {
            const checked = selectedSet.has(c.id);
            return (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-background-hover"
                data-testid={`dealer-row-${c.id}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c)}
                  className="h-3.5 w-3.5 rounded border-border-strong text-accent focus:ring-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{dealerLabel(c)}</span>
                  <span className="block truncate text-[11.5px] text-foreground-muted">
                    {c.phoneE164}
                    {c.state ? ` · ${stateLabel(c.state)}` : ''}
                    {c.tier ? ` · ${c.tier}` : ''}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-[12.5px] text-foreground-muted">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border-strong px-2.5 py-1 disabled:opacity-40 hover:bg-background-hover"
            data-testid="dealer-prev"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages} · {total} dealer{total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-border-strong px-2.5 py-1 disabled:opacity-40 hover:bg-background-hover"
            data-testid="dealer-next"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
