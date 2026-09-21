import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { Button } from './ui/Button';
import { useToast } from './toast/ToastProvider';
import {
  createContact,
  type DealerTier,
  type VehicleSpecialization,
  type NumberType,
  type OptInStatus,
  type PicRole,
} from '../api/contacts';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';
import { TIER_LABELS, VEHICLE_LABELS, ALL_VEHICLE_SPECS } from '../lib/dealerLabels';

const ALL_TIERS: DealerTier[] = ['GOLD', 'SILVER', 'BRONZE'];

const PIC_ROLE_LABELS: Record<PicRole, string> = {
  OWNER: 'Owner',
  SALES_MANAGER: 'Sales Manager',
  ADMIN: 'Admin',
};
const ALL_PIC_ROLES: PicRole[] = ['OWNER', 'SALES_MANAGER', 'ADMIN'];

// Same shape as the helper in Dealers.tsx — duplicated here (6 lines) rather
// than shared, to keep this change surface minimal.
function extractMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string | string[] } } };
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m[0] ?? 'Something went wrong';
  return m ?? 'Something went wrong';
}

const inputCls =
  'h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent';
const selectCls =
  'h-9 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent';

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="mb-1 block text-[12px] font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

export default function AddDealerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [numberType, setNumberType] = useState<NumberType>('PHONE');
  const [state, setState] = useState<MalaysianState | ''>('');
  const [language, setLanguage] = useState<'EN' | 'MS' | 'ZH'>('EN');
  const [optInStatus, setOptInStatus] = useState<OptInStatus>('PENDING');
  const [tier, setTier] = useState<DealerTier | ''>('');
  const [veh, setVeh] = useState<VehicleSpecialization | ''>('');
  const [picName, setPicName] = useState('');
  const [picRole, setPicRole] = useState<PicRole | ''>('');
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setPhone('');
    setNumberType('PHONE');
    setState('');
    setLanguage('EN');
    setOptInStatus('PENDING');
    setTier('');
    setVeh('');
    setPicName('');
    setPicRole('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // Reset on every open: a request still in flight when the modal was closed
  // can reject afterwards and set a stale error on this (still-mounted) component.
  useEffect(() => {
    if (open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mut = useMutation({
    mutationFn: createContact,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast(`Dealer "${vars.name}" added`);
      resetForm();
      onClose();
    },
    onError: (e) => setError(extractMessage(e)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || mut.isPending) return;
    setError(null);
    mut.mutate({
      name: name.trim(),
      phone: phone.trim(),
      numberType,
      languagePreference: language,
      optInStatus,
      state: state || undefined,
      tier: tier || undefined,
      vehicleSpecialization: veh || undefined,
      picName: picName.trim() || undefined,
      picRole: picRole || undefined,
    });
  }

  return (
    <Modal open={open} title="Add dealer" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <Field label="Dealership name" full>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weng Heng Motor"
            className={inputCls}
            data-testid="add-dealer-name"
          />
        </Field>

        <Field label="Phone" full>
          <input
            required
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null); }}
            placeholder="012-345 6789 or +60123456789"
            className={inputCls}
            data-testid="add-dealer-phone"
          />
        </Field>

        <Field label="Number type">
          <select
            value={numberType}
            onChange={(e) => setNumberType(e.target.value as NumberType)}
            className={selectCls}
            data-testid="add-dealer-numberType"
          >
            <option value="PHONE">Phone (mobile)</option>
            <option value="LANE">Lane (office/fax)</option>
          </select>
        </Field>

        <Field label="State">
          <select
            value={state}
            onChange={(e) => setState(e.target.value as MalaysianState | '')}
            className={selectCls}
            data-testid="add-dealer-state"
          >
            <option value="">—</option>
            {ALL_STATES.map((s) => (
              <option key={s} value={s}>{stateLabel(s)}</option>
            ))}
          </select>
        </Field>

        <Field label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'EN' | 'MS' | 'ZH')}
            className={selectCls}
            data-testid="add-dealer-language"
          >
            <option value="EN">EN</option>
            <option value="MS">MS</option>
            <option value="ZH">ZH</option>
          </select>
        </Field>

        <Field label="Opt-in status">
          <select
            value={optInStatus}
            onChange={(e) => setOptInStatus(e.target.value as OptInStatus)}
            className={selectCls}
            data-testid="add-dealer-optInStatus"
          >
            <option value="PENDING">Pending</option>
            <option value="OPTED_IN">Opted in</option>
            <option value="OPTED_OUT">Opted out</option>
          </select>
        </Field>

        <Field label="Tier">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as DealerTier | '')}
            className={selectCls}
            data-testid="add-dealer-tier"
          >
            <option value="">—</option>
            {ALL_TIERS.map((t) => (
              <option key={t} value={t}>{TIER_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <Field label="Vehicle specialization">
          <select
            value={veh}
            onChange={(e) => setVeh(e.target.value as VehicleSpecialization | '')}
            className={selectCls}
            data-testid="add-dealer-vehicleSpecialization"
          >
            <option value="">—</option>
            {ALL_VEHICLE_SPECS.map((v) => (
              <option key={v} value={v}>{VEHICLE_LABELS[v]}</option>
            ))}
          </select>
        </Field>

        <Field label="PIC name">
          <input
            value={picName}
            onChange={(e) => setPicName(e.target.value)}
            placeholder="Person in charge"
            className={inputCls}
            data-testid="add-dealer-picName"
          />
        </Field>

        <Field label="PIC role">
          <select
            value={picRole}
            onChange={(e) => setPicRole(e.target.value as PicRole | '')}
            className={selectCls}
            data-testid="add-dealer-picRole"
          >
            <option value="">—</option>
            {ALL_PIC_ROLES.map((r) => (
              <option key={r} value={r}>{PIC_ROLE_LABELS[r]}</option>
            ))}
          </select>
        </Field>

        {error && (
          <p className="col-span-2 text-[13px] text-red-500" data-testid="add-dealer-error">
            {error}
          </p>
        )}

        <div className="col-span-2 mt-1 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!name.trim() || !phone.trim() || mut.isPending}
            data-testid="add-dealer-submit"
          >
            {mut.isPending ? 'Adding…' : 'Add dealer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
