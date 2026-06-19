import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { filterToWhere } from '../segments/filter-to-where';
import { ContactFilter } from '../segments/dto/contact-filter.dto';
import { normalizePhoneE164 } from './phone.util';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListContactsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;

    const filter: ContactFilter = {
      ethnicity: q.ethnicity,
      gender: q.gender,
      religion: q.religion,
      occupation: q.occupation,
      languagePreference: q.languagePreference,
      state: q.state,
      city: q.city,
      ageMin: q.ageMin,
      ageMax: q.ageMax,
      optInStatus: q.optInStatus,
      tier: q.tier,
      subscriptionStatus: q.subscriptionStatus,
      vehicleSpecialization: q.vehicleSpecialization,
      numberType: q.numberType,
    };
    const where: Prisma.ContactWhereInput = filterToWhere(filter);

    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phoneE164: { contains: q.search } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException();
    return contact;
  }

  async create(dto: CreateContactDto, actorUserId: string) {
    let phoneE164: string;
    try {
      phoneE164 = normalizePhoneE164(dto.phone);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    const existing = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (existing) throw new ConflictException('Contact with that phone already exists');

    const optInStatus = dto.optInStatus ?? 'PENDING';
    const data: Prisma.ContactCreateInput = {
      phoneE164,
      name: dto.name,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      ethnicity: dto.ethnicity,
      religion: dto.religion,
      occupation: dto.occupation,
      languagePreference: dto.languagePreference,
      city: dto.city,
      state: dto.state,
      numberType: dto.numberType,
      tier: dto.tier,
      vehicleSpecialization: dto.vehicleSpecialization,
      picName: dto.picName,
      picRole: dto.picRole,
      attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
      optInStatus,
      optInSource: dto.optInSource ?? `manual:${actorUserId}`,
      optInAt: optInStatus === 'OPTED_IN' ? new Date() : undefined,
    };
    return this.prisma.contact.create({ data });
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    const data: Prisma.ContactUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.ethnicity !== undefined) data.ethnicity = dto.ethnicity;
    if (dto.religion !== undefined) data.religion = dto.religion;
    if (dto.occupation !== undefined) data.occupation = dto.occupation;
    if (dto.languagePreference !== undefined) data.languagePreference = dto.languagePreference;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.attributes !== undefined) data.attributes = dto.attributes as Prisma.InputJsonValue;
    if (dto.optInStatus !== undefined) {
      data.optInStatus = dto.optInStatus;
      if (dto.optInStatus === 'OPTED_OUT' && !existing.optOutAt) data.optOutAt = new Date();
      if (dto.optInStatus === 'OPTED_IN' && !existing.optInAt) data.optInAt = new Date();
    }

    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.contact.delete({ where: { id } });
  }
}
