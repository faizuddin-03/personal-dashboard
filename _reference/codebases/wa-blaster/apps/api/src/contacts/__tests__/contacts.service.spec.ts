import { BadRequestException, ConflictException } from '@nestjs/common';
import { ContactsService } from '../contacts.service';

describe('ContactsService', () => {
  let service: ContactsService;
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
    service = new ContactsService(mockPrisma as any);
  });

  describe('create', () => {
    it('passes dealer fields through to prisma create', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);
      mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

      const dto = {
        phone: '0123456789',
        name: 'Ah Seng Motors',
        numberType: 'LANE',
        tier: 'GOLD',
        vehicleSpecialization: 'EV_HYBRID',
        picName: 'Ah Seng',
        picRole: 'OWNER',
      } as any;

      await service.create(dto, 'u1');

      expect(mockPrisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phoneE164: '+60123456789',
            name: 'Ah Seng Motors',
            numberType: 'LANE',
            tier: 'GOLD',
            vehicleSpecialization: 'EV_HYBRID',
            picName: 'Ah Seng',
            picRole: 'OWNER',
          }),
        }),
      );
    });

    it('creates without dealer fields, passing them as undefined (legacy callers)', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue(null);
      mockPrisma.contact.create.mockResolvedValue({ id: 'c2' });

      const dto = { phone: '0198765432', name: 'Tan' } as any;

      const result = await service.create(dto, 'u1');

      expect(result.id).toBe('c2');
      const data = mockPrisma.contact.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        phoneE164: '+60198765432',
        name: 'Tan',
        optInStatus: 'PENDING',
        optInSource: 'manual:u1',
      });
      expect(data.numberType).toBeUndefined();
      expect(data.tier).toBeUndefined();
      expect(data.vehicleSpecialization).toBeUndefined();
      expect(data.picName).toBeUndefined();
      expect(data.picRole).toBeUndefined();
    });

    it('rejects an invalid phone with BadRequestException (400)', async () => {
      await expect(service.create({ phone: 'abc' } as any, 'u1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockPrisma.contact.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate phone with ConflictException (409)', async () => {
      mockPrisma.contact.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ phone: '0123456789' } as any, 'u1'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockPrisma.contact.create).not.toHaveBeenCalled();
    });
  });
});
