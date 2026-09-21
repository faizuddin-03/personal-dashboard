import { Test } from '@nestjs/testing';
import { TemplatesController } from '../templates.controller';
import { TemplatesService } from '../templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    findGroup: jest.Mock;
    createDraft: jest.Mock;
    updateDraftGroup: jest.Mock;
    submitGroup: jest.Mock;
    remove: jest.Mock;
    generateDrafts: jest.Mock;
    syncFromMeta: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      findGroup: jest.fn(),
      createDraft: jest.fn(),
      updateDraftGroup: jest.fn(),
      submitGroup: jest.fn(),
      remove: jest.fn(),
      generateDrafts: jest.fn(),
      syncFromMeta: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [{ provide: TemplatesService, useValue: service }],
    }).compile();
    controller = module.get(TemplatesController);
  });

  it('GET /templates lists', async () => {
    service.list.mockResolvedValue([{ id: 't1' }]);
    const result = await controller.list({} as any);
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('GET /templates/group/:name returns latest version group', async () => {
    service.findGroup.mockResolvedValue([{ id: 't1', language: 'EN' }, { id: 't2', language: 'MS' }]);
    const result = await controller.findGroup('raya_promo');
    expect(result).toHaveLength(2);
  });

  it('POST /templates creates draft variants', async () => {
    service.createDraft.mockResolvedValue([{ id: 't1' }]);
    const dto = { name: 'x', category: 'MARKETING', variants: [] } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.createDraft).toHaveBeenCalledWith(dto, 'u1');
  });

  it('PATCH /templates/group/:name updates a draft group', async () => {
    service.updateDraftGroup.mockResolvedValue([{ id: 't1' }]);
    const dto = { category: 'MARKETING', variants: [] } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.updateGroup('raya_promo', dto, req);
    expect(service.updateDraftGroup).toHaveBeenCalledWith('raya_promo', dto, 'u1');
  });

  it('POST /templates/:name/:version/submit submits to Meta', async () => {
    service.submitGroup.mockResolvedValue([{ id: 't1', status: 'PENDING' }]);
    const result = await controller.submit('raya_promo', '1');
    expect(service.submitGroup).toHaveBeenCalledWith('raya_promo', 1);
    expect(result[0].status).toBe('PENDING');
  });

  it('DELETE /templates/:id removes', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('t1');
    expect(service.remove).toHaveBeenCalledWith('t1');
  });

  it('POST /templates/generate delegates to service.generateDrafts', async () => {
    const drafts = [{ language: 'EN', name: 'promo_en', category: 'MARKETING', body: 'Hello', variables: [], approvalLikelihood: 'HIGH', rationale: 'ok' }];
    service.generateDrafts.mockResolvedValue(drafts);
    const dto = { brief: 'Test brief for raya', languages: ['EN', 'MS'], tone: 'friendly' as const };
    const result = await controller.generate(dto as any);
    expect(service.generateDrafts).toHaveBeenCalledWith(dto);
    expect(result).toEqual(drafts);
  });

  it('POST /templates/sync triggers a full Meta sync as the acting user', async () => {
    service.syncFromMeta.mockResolvedValue({ checked: 3, imported: 1, updated: 2, categoryChanged: 1, skipped: 0 });
    const req = { user: { id: 'u1' } } as any;
    const result = await controller.sync(req);
    expect(service.syncFromMeta).toHaveBeenCalledWith('u1');
    expect(result.imported).toBe(1);
  });
});
