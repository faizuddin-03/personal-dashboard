import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ContactFilter } from '../../segments/dto/contact-filter.dto';

export class PreviewStateLanguagesDto {
  @IsString() @MinLength(1) @MaxLength(64)
  templateName!: string;

  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  defaultLanguage!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsOptional() @IsUUID()
  segmentId?: string;

  /** Inline dealer audience filter. When provided (and no segmentId), recipients are resolved from
   *  this filter + blast-eligibility enforced: optInStatus=OPTED_IN AND numberType=PHONE. */
  @IsOptional()
  @IsObject()
  audienceFilter?: ContactFilter;
}
