import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ResolutionCaptureService } from '../knowledge/resolution-capture.service';
import { CaptureAdminService } from './capture-admin.service';
import { CapturesController } from './captures.controller';

describe('CapturesController', () => {
  let controller: CapturesController;
  let resolutionCapture: { preview: jest.Mock };
  let admin: { list: jest.Mock; get: jest.Mock; promote: jest.Mock; discard: jest.Mock };

  beforeEach(async () => {
    resolutionCapture = { preview: jest.fn() };
    admin = { list: jest.fn(), get: jest.fn(), promote: jest.fn(), discard: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [CapturesController],
      providers: [
        { provide: ResolutionCaptureService, useValue: resolutionCapture },
        { provide: CaptureAdminService, useValue: admin },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(CapturesController);
  });

  it('POST /preview delegates to ResolutionCaptureService.preview with the conversationId', async () => {
    const preview = { proposedTitle: 'T', proposedContentMd: '# T', duplicates: [] };
    resolutionCapture.preview.mockResolvedValue(preview);

    const result = await controller.preview({ conversationId: 'conv-1' });

    expect(resolutionCapture.preview).toHaveBeenCalledWith({ conversationId: 'conv-1' });
    expect(result).toBe(preview);
  });

  it('GET / delegates the query to CaptureAdminService.list', async () => {
    const page = { items: [], total: 0, page: 1, limit: 20 };
    admin.list.mockResolvedValue(page);
    const q = { status: 'captured_draft', page: 1, limit: 20 };

    const result = await controller.list(q);

    expect(admin.list).toHaveBeenCalledWith(q);
    expect(result).toBe(page);
  });

  it('GET /:id delegates to CaptureAdminService.get', async () => {
    const row = { id: 'c1' };
    admin.get.mockResolvedValue(row);

    const result = await controller.get('c1');

    expect(admin.get).toHaveBeenCalledWith('c1');
    expect(result).toBe(row);
  });

  it('POST /:id/promote passes forcedDespiteDuplicate from the body', async () => {
    const out = { capture: { id: 'c1' }, document: { id: 'd1' } };
    admin.promote.mockResolvedValue(out);

    const result = await controller.promote('c1', { forcedDespiteDuplicate: true });

    expect(admin.promote).toHaveBeenCalledWith('c1', { forcedDespiteDuplicate: true });
    expect(result).toBe(out);
  });

  it('POST /:id/discard passes the reason from the body', async () => {
    const out = { id: 'c1', status: 'discarded' };
    admin.discard.mockResolvedValue(out);

    const result = await controller.discard('c1', { reason: 'dupe' });

    expect(admin.discard).toHaveBeenCalledWith('c1', 'dupe');
    expect(result).toBe(out);
  });
});
