import type {
  ContactFilter,
  DealerTier,
  Ethnicity,
  Gender,
  LanguagePreference,
  NumberType,
  Occupation,
  OptInStatus,
  Religion,
  SubscriptionStatus,
  VehicleSpecialization,
} from '../api/contacts';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';

const TIER_OPTIONS: DealerTier[] = ['BRONZE', 'SILVER', 'GOLD'];
const TIER_LABELS: Record<DealerTier, string> = { BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold' };
const SUBSCRIPTION_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'EXPIRING', 'LAPSED'];
const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = { ACTIVE: 'Active', EXPIRING: 'Expiring', LAPSED: 'Lapsed' };
const VEHICLE_OPTIONS: VehicleSpecialization[] = ['NATIONAL', 'CONTINENTAL_LUXURY', 'SUV_MPV', 'COMMERCIAL_PICKUP', 'EV_HYBRID', 'MOTORCYCLE', 'MULTI_BRAND'];
const VEHICLE_LABELS: Record<VehicleSpecialization, string> = { NATIONAL: 'National', CONTINENTAL_LUXURY: 'Continental/Luxury', SUV_MPV: 'SUV/MPV', COMMERCIAL_PICKUP: 'Commercial/Pickup', EV_HYBRID: 'EV/Hybrid', MOTORCYCLE: 'Motorcycle', MULTI_BRAND: 'Multi-brand' };
const NUMBER_TYPE_OPTIONS: NumberType[] = ['PHONE', 'LANE'];
const NUMBER_TYPE_LABELS: Record<NumberType, string> = { PHONE: 'Phone', LANE: 'Lane' };
const STATE_LABELS: Record<MalaysianState, string> = Object.fromEntries(
  ALL_STATES.map((s) => [s, stateLabel(s)]),
) as Record<MalaysianState, string>;

const ETHNICITY_OPTIONS: Ethnicity[] = ['MALAY', 'CHINESE', 'INDIAN', 'OTHER', 'UNKNOWN'];
const GENDER_OPTIONS: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const RELIGION_OPTIONS: Religion[] = ['ISLAM', 'BUDDHISM', 'HINDUISM', 'CHRISTIANITY', 'OTHER', 'UNKNOWN'];
const OCCUPATION_OPTIONS: Occupation[] = ['STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHER', 'UNKNOWN'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const OPT_IN_OPTIONS: OptInStatus[] = ['OPTED_IN', 'OPTED_OUT', 'PENDING'];

interface Props {
  value: ContactFilter;
  onChange: (next: ContactFilter) => void;
}

function MultiSelectChips<T extends string>({
  label,
  options,
  labels,
  selected,
  onChange,
  testIdPrefix,
}: {
  label: string;
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  selected: T[] | undefined;
  onChange: (next: T[]) => void;
  testIdPrefix: string;
}) {
  function toggle(value: T) {
    const current = selected ?? [];
    if (current.includes(value)) onChange(current.filter((v) => v !== value));
    else onChange([...current, value]);
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase text-foreground-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5" data-testid={`filter-${testIdPrefix}`}>
        {options.map((opt) => {
          const isSelected = selected?.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              aria-pressed={!!isSelected}
              className={
                isSelected
                  ? 'rounded-full border border-accent bg-accent px-2.5 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-border-strong bg-background px-2.5 py-1 text-xs text-foreground hover:bg-background-hover'
              }
              data-testid={`filter-${testIdPrefix}-${opt}`}
            >
              {labels?.[opt] ?? opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBuilder({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-background-subtle p-4 md:grid-cols-2">
      <MultiSelectChips
        label="Ethnicity"
        options={ETHNICITY_OPTIONS}
        selected={value.ethnicity}
        onChange={(next) => onChange({ ...value, ethnicity: next.length ? next : undefined })}
        testIdPrefix="ethnicity"
      />
      <MultiSelectChips
        label="Gender"
        options={GENDER_OPTIONS}
        selected={value.gender}
        onChange={(next) => onChange({ ...value, gender: next.length ? next : undefined })}
        testIdPrefix="gender"
      />
      <MultiSelectChips
        label="Religion"
        options={RELIGION_OPTIONS}
        selected={value.religion}
        onChange={(next) => onChange({ ...value, religion: next.length ? next : undefined })}
        testIdPrefix="religion"
      />
      <MultiSelectChips
        label="Occupation"
        options={OCCUPATION_OPTIONS}
        selected={value.occupation}
        onChange={(next) => onChange({ ...value, occupation: next.length ? next : undefined })}
        testIdPrefix="occupation"
      />
      <MultiSelectChips
        label="Language"
        options={LANGUAGE_OPTIONS}
        selected={value.languagePreference}
        onChange={(next) => onChange({ ...value, languagePreference: next.length ? next : undefined })}
        testIdPrefix="language"
      />
      <MultiSelectChips
        label="Opt-in"
        options={OPT_IN_OPTIONS}
        selected={value.optInStatus}
        onChange={(next) => onChange({ ...value, optInStatus: next.length ? next : undefined })}
        testIdPrefix="optin"
      />
      <MultiSelectChips label="Tier" options={TIER_OPTIONS} labels={TIER_LABELS}
        selected={value.tier}
        onChange={(next) => onChange({ ...value, tier: next.length ? next : undefined })}
        testIdPrefix="tier" />
      <MultiSelectChips label="Subscription" options={SUBSCRIPTION_OPTIONS} labels={SUBSCRIPTION_LABELS}
        selected={value.subscriptionStatus}
        onChange={(next) => onChange({ ...value, subscriptionStatus: next.length ? next : undefined })}
        testIdPrefix="subscription" />
      <MultiSelectChips label="Specialization" options={VEHICLE_OPTIONS} labels={VEHICLE_LABELS}
        selected={value.vehicleSpecialization}
        onChange={(next) => onChange({ ...value, vehicleSpecialization: next.length ? next : undefined })}
        testIdPrefix="specialization" />
      <MultiSelectChips label="Number type" options={NUMBER_TYPE_OPTIONS} labels={NUMBER_TYPE_LABELS}
        selected={value.numberType}
        onChange={(next) => onChange({ ...value, numberType: next.length ? next : undefined })}
        testIdPrefix="numbertype" />
      <MultiSelectChips label="State" options={ALL_STATES} labels={STATE_LABELS}
        selected={value.state}
        onChange={(next) => onChange({ ...value, state: next.length ? next : undefined })}
        testIdPrefix="state" />
      <div>
        <div className="text-xs font-medium uppercase text-foreground-muted mb-1">City</div>
        <input
          type="text"
          placeholder="Kuala Lumpur, Penang"
          value={value.city?.join(', ') ?? ''}
          onChange={(e) => {
            const cities = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange({ ...value, city: cities.length ? cities : undefined });
          }}
          className="w-full rounded-md border border-border-strong bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          data-testid="filter-city"
        />
      </div>
      <div>
        <div className="text-xs font-medium uppercase text-foreground-muted mb-1">Age range</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Min"
            value={value.ageMin ?? ''}
            onChange={(e) => onChange({ ...value, ageMin: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-24 rounded-md border border-border-strong bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
            data-testid="filter-age-min"
          />
          <span className="text-foreground-muted text-sm">to</span>
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Max"
            value={value.ageMax ?? ''}
            onChange={(e) => onChange({ ...value, ageMax: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-24 rounded-md border border-border-strong bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
            data-testid="filter-age-max"
          />
        </div>
      </div>
    </div>
  );
}
