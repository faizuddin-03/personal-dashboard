import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string, fallback: string): Promise<string> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
