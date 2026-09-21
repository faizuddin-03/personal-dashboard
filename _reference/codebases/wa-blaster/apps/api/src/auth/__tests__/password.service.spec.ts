import { PasswordService } from '../password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes a password to a non-matching string', async () => {
    const hash = await service.hash('hunter2');
    expect(hash).not.toEqual('hunter2');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('hunter2');
    await expect(service.verify('hunter2', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('hunter2');
    await expect(service.verify('wrong', hash)).resolves.toBe(false);
  });
});
