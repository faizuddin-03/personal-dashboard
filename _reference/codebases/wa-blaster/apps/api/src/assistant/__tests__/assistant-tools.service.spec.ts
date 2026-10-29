import { AssistantToolsService } from '../assistant-tools.service';

function make() {
  const prisma: any = {
    template: {
      findMany: jest.fn().mockResolvedValue([
        { name: 'car_a_promo', language: 'EN', variables: ['1'], status: 'APPROVED' },
        { name: 'car_a_promo', language: 'MS', variables: ['1'], status: 'APPROVED' },
        { name: 'old_draft', language: 'EN', variables: [], status: 'DRAFT' },
      ]),
    },
  };
  const segments: any = {
    list: jest.fn().mockResolvedValue([
      { id: 's1', name: 'Dealers' },
      { id: 's2', name: 'Lapsed customers' },
    ]),
    preview: jest.fn().mockResolvedValue({ count: 42, sample: [] }),
  };
  return { svc: new AssistantToolsService(prisma, segments), prisma, segments };
}

describe('AssistantToolsService', () => {
  it('search_templates returns only APPROVED families grouped by name', async () => {
    const { svc } = make();
    const out: any = await svc.run('search_templates', { query: 'car' });
    expect(out.templates).toHaveLength(1);
    expect(out.templates[0]).toMatchObject({ name: 'car_a_promo', languages: expect.arrayContaining(['EN', 'MS']) });
  });

  it('search_audience returns matching segments with counts', async () => {
    const { svc } = make();
    const out: any = await svc.run('search_audience', { query: 'dealer' });
    expect(out.segments).toEqual([{ segmentId: 's1', name: 'Dealers', count: 42 }]);
  });

  it('resolve_datetime delegates to the parser', async () => {
    const { svc } = make();
    const out: any = await svc.run('resolve_datetime', { phrase: 'tomorrow morning' });
    expect(out).toHaveProperty('sendAt');
  });

  it('returns an error object for an unknown tool', async () => {
    const { svc } = make();
    const out: any = await svc.run('delete_everything', {});
    expect(out).toHaveProperty('error');
  });
});
