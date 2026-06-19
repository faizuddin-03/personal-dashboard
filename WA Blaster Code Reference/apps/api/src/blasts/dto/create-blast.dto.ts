import { IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { BlastLanguageMode } from '@prisma/client';
import { ContactFilter } from '../../segments/dto/contact-filter.dto';

export class CreateBlastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  templateName!: string;

  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  defaultLanguage!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsOptional()
  @IsUUID()
  segmentId?: string;

  /** Inline dealer audience filter (state + specialization chips). Mutually exclusive with segmentId.
   *  When provided, recipients are resolved from this filter + blast-eligibility enforced:
   *  optInStatus=OPTED_IN AND numberType=PHONE. */
  @IsOptional()
  @IsObject()
  audienceFilter?: ContactFilter;

  @IsObject()
  variableMapping!: Record<string, string>; // { "1": "contact.name" }

  @IsDateString()
  scheduledAt!: string; // ISO string

  @IsOptional()
  @IsEnum(BlastLanguageMode)
  languageMode?: BlastLanguageMode;
}
