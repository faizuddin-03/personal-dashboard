import {
  DealerTier,
  Ethnicity,
  Gender,
  LanguagePreference,
  MalaysianState,
  NumberType,
  Occupation,
  OptInStatus,
  Religion,
  SubscriptionStatus,
  VehicleSpecialization,
} from '@prisma/client';

export interface ContactFilter {
  contactIds?: string[];
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
  tier?: DealerTier[];
  subscriptionStatus?: SubscriptionStatus[];
  vehicleSpecialization?: VehicleSpecialization[];
  numberType?: NumberType[];
}
