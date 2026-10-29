import { Test } from '@nestjs/testing';
import { ContactsController } from '../contacts.controller';
import { ContactsService } from '../contacts.service';
import { CsvImportService } from '../csv-import.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findOne: jest.Mock;
  };
  let csvService: { import: jest.Mock };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn(),
    };

    csvService = { import: jest.fn() };

    const module = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        { provide: ContactsService, useValue: service },
        { provide: CsvImportService, useValue: csvService },
      ],
    }).compile();

    controller = module.get(ContactsController);
  });

  it('GET /contacts returns paginated list', async () => {
    service.list.mockResolvedValue({
      items: [{ id: 'c1', phoneE164: '+60123456789', name: 'Ahmad' }],
      total: 1,
      page: 1,
      pageSize: 50,
    });
    const result = await controller.list({ page: 1, pageSize: 50 } as any);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(service.list).toHaveBeenCalledWith({ page: 1, pageSize: 50 });
  });

  it('GET /contacts/:id returns one contact', async () => {
    service.findOne.mockResolvedValue({ id: 'c1', phoneE164: '+60123456789' });
    const result = await controller.findOne('c1');
    expect(result).toEqual({ id: 'c1', phoneE164: '+60123456789' });
  });

  it('POST /contacts creates contact', async () => {
    service.create.mockResolvedValue({ id: 'c2', phoneE164: '+60198765432' });
    const dto = { phone: '0198765432', name: 'Tan' } as any;
    const req = { user: { id: 'u1' } } as any;
    const result = await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
    expect(result.id).toBe('c2');
  });

  it('PATCH /contacts/:id updates contact', async () => {
    service.update.mockResolvedValue({ id: 'c1', name: 'New' });
    const result = await controller.update('c1', { name: 'New' } as any);
    expect(service.update).toHaveBeenCalledWith('c1', { name: 'New' });
    expect(result.name).toBe('New');
  });

  it('DELETE /contacts/:id removes contact', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('c1');
    expect(service.remove).toHaveBeenCalledWith('c1');
  });

  it('POST /contacts/import returns import result', async () => {
    csvService.import.mockResolvedValue({ imported: 5, skipped: 1, errors: [] });
    const file = {
      buffer: Buffer.from('phone\n0123456789\n'),
      originalname: 'list.csv',
      mimetype: 'text/csv',
    } as any;
    const req = { user: { id: 'u1' } } as any;
    const result = await controller.import(file, req);
    expect(result.imported).toBe(5);
    expect(csvService.import).toHaveBeenCalledWith(file.buffer, 'csv:list.csv', 'u1');
  });
});
