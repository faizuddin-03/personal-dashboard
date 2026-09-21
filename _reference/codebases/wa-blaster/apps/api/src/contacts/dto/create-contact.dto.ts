import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DealerTier,
  Ethnicity,
  Gender,
  LanguagePreference,
  MalaysianState,
  NumberType,
  Occupation,
  OptInStatus,
  PicRole,
  Religion,
  VehicleSpecialization,
} from '@prisma/client';

export class CreateContactDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  phone!: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  optInSource?: string;

  @IsOptional()
  @IsEnum(NumberType)
  numberType?: NumberType;

  @IsOptional()
  @IsEnum(DealerTier)
  tier?: DealerTier;

  @IsOptional()
  @IsEnum(VehicleSpecialization)
  vehicleSpecialization?: VehicleSpecialization;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  picName?: string;

  @IsOptional()
  @IsEnum(PicRole)
  picRole?: PicRole;
}
