import { ArrayMinSize, IsArray, IsEnum } from 'class-validator';
import { LanguagePreference } from '@prisma/client';

export class UpsertMappingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(LanguagePreference, { each: true })
  languages!: LanguagePreference[];
}
