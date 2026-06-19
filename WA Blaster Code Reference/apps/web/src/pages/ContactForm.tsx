import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContact,
  deleteContact,
  getContact,
  updateContact,
  type CreateContactInput,
  type Ethnicity,
  type Gender,
  type LanguagePreference,
  type Occupation,
  type OptInStatus,
  type Religion,
} from '../api/contacts';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';
import { Page, PageHead } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ETHNICITY_OPTIONS: Ethnicity[] = ['MALAY', 'CHINESE', 'INDIAN', 'OTHER', 'UNKNOWN'];
const GENDER_OPTIONS: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const RELIGION_OPTIONS: Religion[] = ['ISLAM', 'BUDDHISM', 'HINDUISM', 'CHRISTIANITY', 'OTHER', 'UNKNOWN'];
const OCCUPATION_OPTIONS: Occupation[] = ['STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHER', 'UNKNOWN'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const OPT_IN_OPTIONS: OptInStatus[] = ['OPTED_IN', 'OPTED_OUT', 'PENDING'];

export default function ContactForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<CreateContactInput>({
    phone: '',
    gender: 'UNKNOWN',
    ethnicity: 'UNKNOWN',
    religion: 'UNKNOWN',
    occupation: 'UNKNOWN',
    languagePreference: 'EN',
    optInStatus: 'PENDING',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        phone: existing.phoneE164,
        name: existing.name ?? undefined,
        dateOfBirth: existing.dateOfBirth ?? undefined,
        gender: existing.gender,
        ethnicity: existing.ethnicity,
        religion: existing.religion,
        occupation: existing.occupation,
        languagePreference: existing.languagePreference,
        city: existing.city ?? undefined,
        state: existing.state ?? undefined,
        optInStatus: existing.optInStatus,
      });
    }
  }, [existing]);

  const create = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: (input: CreateContactInput) => updateContact(id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', id] });
      navigate('/contacts');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => deleteContact(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isEdit) update.mutate(form);
    else create.mutate(form);
  }

  function onDelete() {
    if (window.confirm(`Delete contact ${form.phone}?`)) remove.mutate();
  }

  function setField<K extends keyof CreateContactInput>(k: K, v: CreateContactInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <Page>
      <PageHead title={isEdit ? 'Edit Contact' : 'Add Contact'} />
      <div className="max-w-2xl">
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-border bg-background p-6"
          data-testid="contact-form"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Phone (E.164 or local Malaysian)">
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isEdit}
                data-testid="contact-phone"
              />
            </Field>
            <Field label="Name">
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(e) => setField('name', e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                data-testid="contact-name"
              />
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={(e) => setField('dateOfBirth', e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                data-testid="contact-dob"
              />
            </Field>
            <EnumField label="Gender" value={form.gender!} options={GENDER_OPTIONS} onChange={(v) => setField('gender', v)} testId="contact-gender" />
            <EnumField label="Ethnicity" value={form.ethnicity!} options={ETHNICITY_OPTIONS} onChange={(v) => setField('ethnicity', v)} testId="contact-ethnicity" />
            <EnumField label="Religion" value={form.religion!} options={RELIGION_OPTIONS} onChange={(v) => setField('religion', v)} testId="contact-religion" />
            <EnumField label="Occupation" value={form.occupation!} options={OCCUPATION_OPTIONS} onChange={(v) => setField('occupation', v)} testId="contact-occupation" />
            <EnumField label="Language preference" value={form.languagePreference!} options={LANGUAGE_OPTIONS} onChange={(v) => setField('languagePreference', v)} testId="contact-language" />
            <Field label="City">
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => setField('city', e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                data-testid="contact-city"
              />
            </Field>
            <Field label="State">
              <select
                value={form.state ?? ''}
                onChange={(e) => setField('state', (e.target.value || undefined) as MalaysianState | undefined)}
                className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                data-testid="contact-state"
              >
                <option value="">—</option>
                {ALL_STATES.map((s) => (<option key={s} value={s}>{stateLabel(s)}</option>))}
              </select>
            </Field>
            <EnumField label="Opt-in status" value={form.optInStatus!} options={OPT_IN_OPTIONS} onChange={(v) => setField('optInStatus', v)} testId="contact-optin" />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500" data-testid="contact-form-error">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/contacts')}
              data-testid="contact-cancel"
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {isEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  data-testid="contact-delete"
                >
                  Delete
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={create.isPending || update.isPending}
                data-testid="contact-submit"
              >
                {isEdit ? 'Save changes' : 'Create contact'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

function EnumField<T extends string>({
  label, value, options, onChange, testId,
}: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void; testId: string;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        data-testid={testId}
      >
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </Field>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
