import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SimulatorGuard } from '../simulator.guard';

function guardWith(env: Record<string, string>): SimulatorGuard {
  const config = { get: (k: string, d?: string) => env[k] ?? d } as unknown as ConfigService;
  return new SimulatorGuard(config);
}
const ctx = {} as any; // guard ignores the execution context

describe('SimulatorGuard', () => {
  it('throws 404 when SIMULATOR_ENABLED is not "true"', () => {
    expect(() => guardWith({ WHATSAPP_MOCK_MODE: 'true' }).canActivate(ctx)).toThrow(NotFoundException);
  });

  it('throws 412 when enabled but WHATSAPP_MOCK_MODE is not "true"', () => {
    const g = guardWith({ SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'false' });
    expect(() => g.canActivate(ctx)).toThrow(PreconditionFailedException);
  });

  it('returns true when enabled and in mock mode', () => {
    const g = guardWith({ SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'true' });
    expect(g.canActivate(ctx)).toBe(true);
  });
});
