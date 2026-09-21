import { filterToWhere } from '../filter-to-where';

describe('filterToWhere', () => {
  const fixedNow = new Date('2026-05-25T00:00:00.000Z');

  // Dealer attribute filters
  it('translates tier array to `in` clause', () => {
    expect(filterToWhere({ tier: ['GOLD', 'SILVER'] }, fixedNow)).toEqual({
      tier: { in: ['GOLD', 'SILVER'] },
    });
  });

  it('translates subscriptionStatus array to `in` clause', () => {
    expect(filterToWhere({ subscriptionStatus: ['ACTIVE'] }, fixedNow)).toEqual({
      subscriptionStatus: { in: ['ACTIVE'] },
    });
  });

  it('translates vehicleSpecialization array to `in` clause', () => {
    expect(
      filterToWhere({ vehicleSpecialization: ['EV_HYBRID', 'NATIONAL'] }, fixedNow),
    ).toEqual({
      vehicleSpecialization: { in: ['EV_HYBRID', 'NATIONAL'] },
    });
  });

  it('translates numberType array to `in` clause', () => {
    expect(filterToWhere({ numberType: ['LANE'] }, fixedNow)).toEqual({
      numberType: { in: ['LANE'] },
    });
  });

  it('ignores empty dealer attribute arrays', () => {
    expect(
      filterToWhere({ tier: [], subscriptionStatus: [], vehicleSpecialization: [], numberType: [] }, fixedNow),
    ).toEqual({});
  });

  it('combines dealer attributes with demographic filters', () => {
    const result = filterToWhere(
      {
        ethnicity: ['MALAY'],
        tier: ['GOLD'],
        subscriptionStatus: ['ACTIVE'],
        vehicleSpecialization: ['EV_HYBRID'],
        numberType: ['PHONE'],
      },
      fixedNow,
    );
    expect(result).toEqual({
      ethnicity: { in: ['MALAY'] },
      tier: { in: ['GOLD'] },
      subscriptionStatus: { in: ['ACTIVE'] },
      vehicleSpecialization: { in: ['EV_HYBRID'] },
      numberType: { in: ['PHONE'] },
    });
  });

  it('returns empty object for empty filter', () => {
    expect(filterToWhere({}, fixedNow)).toEqual({});
  });

  it('translates ethnicity array to `in` clause', () => {
    expect(filterToWhere({ ethnicity: ['MALAY', 'CHINESE'] }, fixedNow)).toEqual({
      ethnicity: { in: ['MALAY', 'CHINESE'] },
    });
  });

  it('translates gender + state together with AND', () => {
    expect(
      filterToWhere({ gender: ['FEMALE'], state: ['SELANGOR'] }, fixedNow),
    ).toEqual({
      gender: { in: ['FEMALE'] },
      state: { in: ['SELANGOR'] },
    });
  });

  it('translates ageMin to dateOfBirth lte (today - ageMin years)', () => {
    // ageMin=25 on 2026-05-25 means dob <= 2001-05-25
    expect(filterToWhere({ ageMin: 25 }, fixedNow)).toEqual({
      dateOfBirth: { lte: new Date('2001-05-25T00:00:00.000Z') },
    });
  });

  it('translates ageMax to dateOfBirth gte (today - (ageMax+1) years + 1 day)', () => {
    // ageMax=45 on 2026-05-25 means dob >= 1980-05-26 (must be < 46 yrs old)
    expect(filterToWhere({ ageMax: 45 }, fixedNow)).toEqual({
      dateOfBirth: { gte: new Date('1980-05-26T00:00:00.000Z') },
    });
  });

  it('combines ageMin and ageMax into a single dateOfBirth range', () => {
    expect(filterToWhere({ ageMin: 25, ageMax: 45 }, fixedNow)).toEqual({
      dateOfBirth: {
        lte: new Date('2001-05-25T00:00:00.000Z'),
        gte: new Date('1980-05-26T00:00:00.000Z'),
      },
    });
  });

  it('ignores empty arrays', () => {
    expect(filterToWhere({ ethnicity: [], state: [] }, fixedNow)).toEqual({});
  });

  it('combines all filter dimensions', () => {
    const result = filterToWhere(
      {
        ethnicity: ['MALAY'],
        languagePreference: ['MS'],
        state: ['SELANGOR', 'KUALA_LUMPUR'],
        ageMin: 25,
        ageMax: 45,
        optInStatus: ['OPTED_IN'],
      },
      fixedNow,
    );
    expect(result).toEqual({
      ethnicity: { in: ['MALAY'] },
      languagePreference: { in: ['MS'] },
      state: { in: ['SELANGOR', 'KUALA_LUMPUR'] },
      dateOfBirth: {
        lte: new Date('2001-05-25T00:00:00.000Z'),
        gte: new Date('1980-05-26T00:00:00.000Z'),
      },
      optInStatus: { in: ['OPTED_IN'] },
    });
  });
});

describe('filterToWhere — contactIds', () => {
  it('maps contactIds to an id "in" clause', () => {
    expect(filterToWhere({ contactIds: ['a', 'b'] })).toEqual({ id: { in: ['a', 'b'] } });
  });

  it('omits the id clause when contactIds is empty or absent', () => {
    expect(filterToWhere({ contactIds: [] }).id).toBeUndefined();
    expect(filterToWhere({}).id).toBeUndefined();
  });

  it('combines contactIds with other filters', () => {
    const where = filterToWhere({ contactIds: ['a'], tier: ['GOLD'] });
    expect(where.id).toEqual({ in: ['a'] });
    expect(where.tier).toEqual({ in: ['GOLD'] });
  });
});
