import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { ContactFilter } from './dto/contact-filter.dto';
import { filterToWhere } from './filter-to-where';

const PREVIEW_SAMPLE_SIZE = 10;

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.contactSegment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const segment = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!segment) throw new NotFoundException();
    return segment;
  }

  async create(dto: CreateSegmentDto, actorUserId: string) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Segment name already in use');

    return this.prisma.contactSegment.create({
      data: {
        name: dto.name,
        description: dto.description,
        filterJson: dto.filter as Prisma.InputJsonValue,
        createdById: actorUserId,
      },
    });
  }

  async update(id: string, dto: UpdateSegmentDto) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.contactSegment.findUnique({ where: { name: dto.name } });
      if (conflict) throw new ConflictException('Segment name already in use');
    }

    return this.prisma.contactSegment.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        filterJson: dto.filter !== undefined ? (dto.filter as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.contactSegment.delete({ where: { id } });
  }

  async preview(id: string) {
    const segment = await this.findOne(id);
    const filter = segment.filterJson as unknown as ContactFilter;
    const where = filterToWhere(filter);

    const [count, sample] = await this.prisma.$transaction([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({ where, take: PREVIEW_SAMPLE_SIZE, orderBy: { createdAt: 'desc' } }),
    ]);

    return { count, sample };
  }
}
