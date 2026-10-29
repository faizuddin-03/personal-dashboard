import { CsvImportService } from '../csv-import.service';

describe('CsvImportService', () => {
  let service: CsvImportService;
  let mockPrisma: {
    contact: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      contact: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new CsvImportService(mockPrisma as any);
  });

  it('imports a single valid row', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from(
      'phone,name,ethnicity,languagePreference\n0123456789,Ahmad,MALAY,MS\n',
    );
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phoneE164: '+60123456789',
          name: 'Ahmad',
          ethnicity: 'MALAY',
          languagePreference: 'MS',
          optInSource: 'csv:test.csv',
          optInStatus: 'OPTED_IN',
        }),
      }),
    );
  });

  it('skips duplicate phone numbers', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ id: 'existing' });

    const csv = Buffer.from('phone,name\n0123456789,Ahmad\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.contact.create).not.toHaveBeenCalled();
  });

  it('reports row-level errors for invalid phone numbers', async () => {
    const csv = Buffer.from('phone,name\nnot-a-phone,Ahmad\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 2, message: expect.stringContaining('invalid phone') });
  });

  it('reports row-level errors for invalid enum values', async () => {
    const csv = Buffer.from('phone,ethnicity\n0123456789,NOT_A_REAL_ETHNICITY\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/invalid ethnicity/i);
  });

  it('handles a missing phone column gracefully', async () => {
    const csv = Buffer.from('name,ethnicity\nAhmad,MALAY\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.errors[0].message).toMatch(/phone/i);
  });

  it('normalizes a recognized free-text state to the enum value', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,state\n0123456789,Pulau Pinang\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: 'PENANG' }),
      }),
    );
  });

  it('sets state to undefined for an unrecognized free-text state', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,state\n0123456789,Atlantis\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(result.unrecognizedStates).toBe(1);
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: undefined }),
      }),
    );
  });

  it('does not count an empty state as unrecognized', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,state\n0123456789,\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.unrecognizedStates).toBe(0);
  });

  it('continues processing after row-level errors', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,name\nbad-phone,Bad\n0123456789,Good\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
  });

  it('imports a mobile number as PHONE + OPTED_IN', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,name\n0123456789,Mobile User\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ numberType: 'PHONE', optInStatus: 'OPTED_IN' }),
      }),
    );
  });

  it('imports a fixed-line/fax number as LANE + OPTED_OUT (and stamps optOutAt)', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c2' });

    const csv = Buffer.from('phone,name\n03-1234 5678,Office Line\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    const arg = mockPrisma.contact.create.mock.calls[0][0];
    expect(arg.data).toEqual(
      expect.objectContaining({ numberType: 'LANE', optInStatus: 'OPTED_OUT' }),
    );
    expect(arg.data.optOutAt).toBeInstanceOf(Date);
    expect(arg.data.optInAt).toBeUndefined();
  });
});
