import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listContacts, type ContactFilter } from '../api/contacts';
import FilterBuilder from '../components/FilterBuilder';
import Pagination from '../components/Pagination';
import { Page, PageHead } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IcPlus, IcUpload } from '../components/ui/icons';

const PAGE_SIZE = 50;

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContactFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', search, filter, page],
    queryFn: () => listContacts({ ...filter, search: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  function onFilterChange(next: ContactFilter) { setFilter(next); setPage(1); }

  return (
    <Page>
      <PageHead title="Contacts" actions={
        <>
          <Link to="/contacts/new" data-testid="add-contact">
            <Button variant="primary" icon={<IcPlus size={14} />}>Add Contact</Button>
          </Link>
          <Link to="/contacts/import" data-testid="import-csv">
            <Button variant="secondary" icon={<IcUpload size={14} />}>Import CSV</Button>
          </Link>
        </>
      } />

      <div className="mb-4">
        <input type="search" placeholder="Search by name or phone…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-9 w-full max-w-md rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
          data-testid="contacts-search" />
      </div>

      <div className="mb-4"><FilterBuilder value={filter} onChange={onFilterChange} /></div>

      {isLoading && <p className="text-foreground-muted">Loading…</p>}
      {error && <p className="text-red-500">Failed to load contacts.</p>}
      {data && (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <table className="w-full text-[13px]" data-testid="contacts-table">
            <thead className="border-b border-border bg-background-subtle text-left text-[11px] text-foreground-muted">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Ethnicity</th><th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">State</th><th className="px-4 py-3">Opt-in</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0" data-testid={`contact-row-${c.id}`}>
                  <td className="px-4 py-3.5 text-foreground">{c.name ?? '—'}</td>
                  <td className="px-4 py-3.5 font-mono text-foreground">{c.phoneE164}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.ethnicity}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.languagePreference}</td>
                  <td className="px-4 py-3.5 text-foreground">{c.state ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={c.optInStatus === 'OPTED_IN' ? 'text-green-700'
                      : c.optInStatus === 'OPTED_OUT' ? 'text-red-500' : 'text-foreground-subtle'}>{c.optInStatus}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link to={`/contacts/${c.id}`} className="text-green-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-foreground-muted">No contacts match these filters.</td></tr>
              )}
            </tbody>
          </table>
          <div className="border-t border-border px-4">
            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
          </div>
        </div>
      )}
    </Page>
  );
}
