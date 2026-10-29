import { BadRequestException, Injectable } from '@nestjs/common';
import { LanguagePreference, MalaysianState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ALL_STATES: MalaysianState[] = [
  'JOHOR', 'KEDAH', 'KELANTAN', 'MELAKA', 'NEGERI_SEMBILAN', 'PAHANG',
  'PENANG', 'PERAK', 'PERLIS', 'SABAH', 'SARAWAK', 'SELANGOR',
  'TERENGGANU', 'KUALA_LUMPUR', 'LABUAN', 'PUTRAJAYA',
];

export interface StateMappingRow {
  state: MalaysianState;
  languages: LanguagePreference[];
}

@Injectable()
export class StateLanguageMappingService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<StateMappingRow[]> {
    const rows = await this.prisma.stateLanguageMapping.findMany();
    const byState = new Map(rows.map((r) => [r.state, r.languages]));
    return ALL_STATES.map((state) => ({ state, languages: byState.get(state) ?? [] }));
  }

  async upsert(state: MalaysianState, languages: LanguagePreference[]): Promise<void> {
    if (!languages || languages.length === 0) {
      throw new BadRequestException('languages must be a non-empty array; use DELETE to clear a mapping');
    }
    await this.prisma.stateLanguageMapping.upsert({
      where: { state },
      create: { state, languages },
      update: { languages },
    });
  }

  async clear(state: MalaysianState): Promise<void> {
    try {
      await this.prisma.stateLanguageMapping.delete({ where: { state } });
    } catch (err: any) {
      if (err?.code === 'P2025') return;
      throw err;
    }
  }

  async asMap(): Promise<Map<MalaysianState, LanguagePreference[]>> {
    const rows = await this.prisma.stateLanguageMapping.findMany();
    return new Map(rows.filter((r) => r.languages.length > 0).map((r) => [r.state, r.languages]));
  }
}
