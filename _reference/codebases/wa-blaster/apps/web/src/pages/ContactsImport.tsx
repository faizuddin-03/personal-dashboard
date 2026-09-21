import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { importContactsCsv, type ImportResult } from '../api/contacts';
import { Page, PageHead, Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function ContactsImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const upload = useMutation({
    mutationFn: importContactsCsv,
    onSuccess: (data) => setResult(data),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (file) upload.mutate(file);
  }

  return (
    <Page>
      <PageHead
        title="Import contacts from CSV"
        subtitle="CSV up to 50 MB · phone numbers will be normalised to E.164"
      />

      <div className="space-y-4">
        {/* Help / expected columns */}
        <Card title="Expected columns">
          <div className="space-y-3 text-sm">
            <code className="block rounded-md border border-border bg-background-subtle px-4 py-3 font-mono text-xs text-foreground">
              phone, name, dateOfBirth, gender, ethnicity, religion, occupation, languagePreference, city, state
            </code>
            <p className="text-[13px] text-foreground-muted">
              Only <strong className="text-foreground">phone</strong> is required. Phone numbers can be in local
              format (e.g. <code className="rounded bg-background-subtle px-1 py-0.5 font-mono text-xs">0123456789</code>)
              — they&apos;ll be normalized to E.164 (<code className="rounded bg-background-subtle px-1 py-0.5 font-mono text-xs">+60123456789</code>).
              Imported contacts are marked OPTED_IN with source = <code className="rounded bg-background-subtle px-1 py-0.5 font-mono text-xs">csv:&lt;filename&gt;</code>.
              Duplicate phones are skipped silently.
            </p>
          </div>
        </Card>

        {/* Upload form */}
        <Card title="Upload your CSV">
          <form onSubmit={onSubmit} className="space-y-5" data-testid="import-form">
            {/* Drop zone / file picker */}
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-background-subtle px-6 py-10 text-center transition-colors hover:border-accent hover:bg-background-hover"
              htmlFor="csv-file-input"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-background border border-border text-foreground-muted">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13V4M6 8l4-4 4 4" />
                  <path d="M3 15h14" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">
                  {file ? file.name : 'Drop your CSV here, or click to browse'}
                </div>
                <div className="mt-1 text-xs text-foreground-muted">
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB selected`
                    : 'Accepts .csv · max 50 MB'}
                </div>
              </div>
            </label>
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
              data-testid="csv-file"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => navigate('/contacts')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!file || upload.isPending}
                data-testid="csv-submit"
              >
                {upload.isPending ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Results */}
        {result && (
          <section data-testid="import-result">
            <Card title="Import complete">
              <div className="space-y-5">
                {/* Stat tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{result.imported}</div>
                    <div className="mt-1 text-xs text-green-700 opacity-70">Imported</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">{result.skipped}</div>
                    <div className="mt-1 text-xs text-amber-500 opacity-70">Skipped (duplicates)</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{result.errors.length}</div>
                    <div className="mt-1 text-xs text-red-500 opacity-70">Errors</div>
                  </div>
                </div>

                {/* Error list */}
                {result.errors.length > 0 && (
                  <div className="rounded-lg border border-border bg-background-subtle p-4">
                    <div className="mb-2 text-xs font-medium text-foreground">Errors</div>
                    <ul className="space-y-1" data-testid="import-errors">
                      {result.errors.map((e, i) => (
                        <li key={i} className="font-mono text-xs text-red-500">
                          Row {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/contacts')}
                  >
                    Back to contacts
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </Page>
  );
}
