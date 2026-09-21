import { api } from './client';
import type { MalaysianState } from './stateLanguageMappings';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type Ethnicity = 'MALAY' | 'CHINESE' | 'INDIAN' | 'OTHER' | 'UNKNOWN';
export type Religion = 'ISLAM' | 'BUDDHISM' | 'HINDUISM' | 'CHRISTIANITY' | 'OTHER' | 'UNKNOWN';
export type Occupation = 'STUDENT' | 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED' | 'OTHER' | 'UNKNOWN';
export type LanguagePreference = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';
export type OptInStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';

// Dealer-specific enums (canonical — match Prisma)
export type DealerTier = 'GOLD' | 'SILVER' | 'BRONZE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING' | 'LAPSED';
export type VehicleSpecialization =
  | 'NATIONAL'
  | 'CONTINENTAL_LUXURY'
  | 'SUV_MPV'
  | 'COMMERCIAL_PICKUP'
  | 'EV_HYBRID'
  | 'MOTORCYCLE'
  | 'MULTI_BRAND';
export type NumberType = 'PHONE' | 'LANE';
export type PicRole = 'OWNER' | 'SALES_MANAGER' | 'ADMIN';

export interface Contact {
  id: string;
  phoneE164: string;
  name: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  ethnicity: Ethnicity;
  religion: Religion;
  occupation: Occupation;
  languagePreference: LanguagePreference;
  city: string | null;
  state: MalaysianState | null;
  attributes: Record<string, unknown>;
  optInStatus: OptInStatus;
  optInSource: string | null;
  optInAt: string | null;
  optOutAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Dealer-specific fields (optional — present when contact is a dealer)
  tier?: DealerTier | null;
  subscriptionStatus?: SubscriptionStatus | null;
  vehicleSpecialization?: VehicleSpecialization | null;
  historyCheckCredits?: number | null;
  transfers30d?: number | null;
  lifetimeSpend?: number | null;
  picName?: string | null;
  picRole?: string | null;
  numberType?: NumberType | null;
  lastSeenAt?: string | null;
}

export interface ContactFilter {
  search?: string;
  ethnicity?: Ethnicity[];
  gender?: Gender[];
  religion?: Religion[];
  occupation?: Occupation[];
  languagePreference?: LanguagePreference[];
  state?: MalaysianState[];
  city?: string[];
  ageMin?: number;
  ageMax?: number;
  optInStatus?: OptInStatus[];
  contactIds?: string[];
  // Dealer-specific filter params
  tier?: DealerTier[];
  subscriptionStatus?: SubscriptionStatus[];
  vehicleSpecialization?: VehicleSpecialization[];
  numberType?: NumberType[];
}

export interface ListContactsResponse {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContactInput {
  phone: string;
  name?: string;
  dateOfBirth?: string;
  gender?: Gender;
  ethnicity?: Ethnicity;
  religion?: Religion;
  occupation?: Occupation;
  languagePreference?: LanguagePreference;
  city?: string;
  state?: MalaysianState;
  optInStatus?: OptInStatus;
  attributes?: Record<string, unknown>;
  // Dealer-specific fields
  numberType?: NumberType;
  tier?: DealerTier;
  vehicleSpecialization?: VehicleSpecialization;
  picName?: string;
  picRole?: PicRole;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function listContacts(
  filter: ContactFilter & { page?: number; pageSize?: number },
): Promise<ListContactsResponse> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    params[key] = value;
  }
  const { data } = await api.get<ListContactsResponse>('/contacts', {
    params,
    paramsSerializer: { indexes: null }, // ?ethnicity=MALAY&ethnicity=CHINESE
  });
  return data;
}

export async function getContact(id: string): Promise<Contact> {
  const { data } = await api.get<Contact>(`/contacts/${id}`);
  return data;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const { data } = await api.post<Contact>('/contacts', input);
  return data;
}

export async function updateContact(id: string, input: Partial<CreateContactInput>): Promise<Contact> {
  const { data } = await api.patch<Contact>(`/contacts/${id}`, input);
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/contacts/${id}`);
}

export async function importContactsCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ImportResult>('/contacts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
