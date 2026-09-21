import { CaptureProcessor } from '../capture.processor';
import type { CaptureJobPayload } from '../capture.queue';

/**
 * Unit test for the resolution-capture processor (mirrors blasts/__tests__/blast.processor.spec.ts:
 * mocked deps + direct `new`, no Nest/DB/Redis).
 *
 * The producer (ConversationService.close) enqueues only `{ captureId, conversationId }` — the full
 * disposition lives on the ResolutionCapture row — so the processor loads the row to reconstruct the
 * CaptureInput before delegating to ResolutionCaptureService.capture().
 */
describe('CaptureProcessor', () => {
  let prisma: any;
  let captureService: { capture: jest.Mock };
  let processor: CaptureProcessor;

  const pendingRow = {
    id: 'cap-1',
    conversationId: 'conv-1',
    closedByUserId: 'user-1',
    disposition: 'IMPORT_LIVE',
    editedAnswer: null as string | null,
    forcedDespiteDuplicate: false,
    status: 'pending',
  };

  const job = (data: CaptureJobPayload) => ({ data, attemptsMade: 0 }) as any;

  beforeEach(() => {
    prisma = {
      resolutionCapture: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...pendingRow }),
      },
    };
    captureService = { capture: jest.fn() };
    processor = new CaptureProcessor(prisma, captureService as any);
  });

  it('loads the capture row by id and calls capture() with the reconstructed CaptureInput', async () => {
    captureService.capture.mockResolvedValue({ status: 'captured_live', documentId: 'doc-1' });

    await processor.process(job({ captureId: 'cap-1', conversationId: 'conv-1' }));

    expect(prisma.resolutionCapture.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'cap-1' } });
    expect(captureService.capture).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      closedByUserId: 'user-1',
      disposition: 'IMPORT_LIVE',
      editedAnswer: undefined,
      forcedDespiteDuplicate: false,
    });
  });

  it('passes editedAnswer and forcedDespiteDuplicate through from the row', async () => {
    prisma.resolutionCapture.findUniqueOrThrow.mockResolvedValue({
      ...pendingRow,
      disposition: 'SAVE_DRAFT',
      editedAnswer: 'cleaned-up answer',
      forcedDespiteDuplicate: true,
    });
    captureService.capture.mockResolvedValue({ status: 'captured_draft', documentId: 'doc-2' });

    await processor.process(job({ captureId: 'cap-1', conversationId: 'conv-1' }));

    expect(captureService.capture).toHaveBeenCalledWith(
      expect.objectContaining({
        disposition: 'SAVE_DRAFT',
        editedAnswer: 'cleaned-up answer',
        forcedDespiteDuplicate: true,
      }),
    );
  });

  it('completes without throwing for a SKIP disposition (service marks skipped_by_operator)', async () => {
    prisma.resolutionCapture.findUniqueOrThrow.mockResolvedValue({ ...pendingRow, disposition: 'SKIP' });
    captureService.capture.mockResolvedValue({ status: 'skipped_by_operator', documentId: null });

    await expect(processor.process(job({ captureId: 'cap-1', conversationId: 'conv-1' }))).resolves.toBeUndefined();
    expect(captureService.capture).toHaveBeenCalledWith(expect.objectContaining({ disposition: 'SKIP' }));
  });

  it('completes without throwing when the service marks skipped_duplicate', async () => {
    captureService.capture.mockResolvedValue({ status: 'skipped_duplicate', documentId: null, duplicateOfId: 'doc-x' });

    await expect(processor.process(job({ captureId: 'cap-1', conversationId: 'conv-1' }))).resolves.toBeUndefined();
    expect(captureService.capture).toHaveBeenCalledTimes(1);
  });

  it('throws when the service returns status=failed, so BullMQ retries (failureReason surfaced)', async () => {
    captureService.capture.mockResolvedValue({ status: 'failed', failureReason: 'embeddings exhausted', documentId: null });

    await expect(processor.process(job({ captureId: 'cap-1', conversationId: 'conv-1' }))).rejects.toThrow(
      /embeddings exhausted/,
    );
  });

  it('propagates (and does not call capture) when the capture row is missing', async () => {
    prisma.resolutionCapture.findUniqueOrThrow.mockRejectedValue(new Error('No ResolutionCapture found'));

    await expect(processor.process(job({ captureId: 'missing', conversationId: 'conv-1' }))).rejects.toThrow();
    expect(captureService.capture).not.toHaveBeenCalled();
  });
});
