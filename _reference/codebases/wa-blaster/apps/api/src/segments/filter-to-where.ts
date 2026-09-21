import { Prisma } from '@prisma/client';
import { ContactFilter } from './dto/contact-filter.dto';

function yearsAgo(now: Date, years: number): Date {
  const d = new Date(now);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
}

export function filterToWhere(
  filter: ContactFilter,
  now: Date = new Date(),
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {};

  if (filter.contactIds?.length) where.id = { in: filter.contactIds };
  if (filter.ethnicity?.length) where.ethnicity = { in: filter.ethnicity };
  if (filter.gender?.length) where.gender = { in: filter.gender };
  if (filter.religion?.length) where.religion = { in: filter.religion };
  if (filter.occupation?.length) where.occupation = { in: filter.occupation };
  if (filter.languagePreference?.length) where.languagePreference = { in: filter.languagePreference };
  if (filter.state?.length) where.state = { in: filter.state };
  if (filter.city?.length) where.city = { in: filter.city };
  if (filter.optInStatus?.length) where.optInStatus = { in: filter.optInStatus };
  if (filter.tier?.length) where.tier = { in: filter.tier };
  if (filter.subscriptionStatus?.length) where.subscriptionStatus = { in: filter.subscriptionStatus };
  if (filter.vehicleSpecialization?.length) where.vehicleSpecialization = { in: filter.vehicleSpecialization };
  if (filter.numberType?.length) where.numberType = { in: filter.numberType };

  const dobConstraint: { lte?: Date; gte?: Date } = {};
  if (filter.ageMin !== undefined) {
    dobConstraint.lte = yearsAgo(now, filter.ageMin);
  }
  if (filter.ageMax !== undefined) {
    // Older than ageMax means born before (today - (ageMax+1) years) + 1 day
    const cutoff = yearsAgo(now, filter.ageMax + 1);
    cutoff.setUTCDate(cutoff.getUTCDate() + 1);
    dobConstraint.gte = cutoff;
  }
  if (dobConstraint.lte || dobConstraint.gte) {
    where.dateOfBirth = dobConstraint;
  }

  return where;
}
