import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  MalaysianState,
  Occupation,
  OptInStatus,
  Religion,
} from '@prisma/client';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Ethnicity)
  ethnicity?: Ethnicity;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @IsOptional()
  @IsEnum(Occupation)
  occupation?: Occupation;

  @IsOptional()
  @IsEnum(LanguagePreference)
  languagePreference?: LanguagePreference;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsEnum(MalaysianState)
  state?: MalaysianState;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(OptInStatus)
  optInStatus?: OptInStatus;
}
