import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gates every /api/sim/* route. Two independent server-side checks, evaluated at request time
 * (not boot) so flipping env can never silently arm a live send:
 *   - SIMULATOR_ENABLED !== 'true'  → 404 (route looks absent in production).
 *   - WHATSAPP_MOCK_MODE !== 'true' → 412 (the chatbot's send would otherwise hit real Meta).
 */
@Injectable()
export class SimulatorGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('SIMULATOR_ENABLED', 'false') !== 'true') {
      throw new NotFoundException('Simulator is disabled');
    }
    if (this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') !== 'true') {
      throw new PreconditionFailedException('Simulator requires WHATSAPP_MOCK_MODE=true');
    }
    return true;
  }
}
