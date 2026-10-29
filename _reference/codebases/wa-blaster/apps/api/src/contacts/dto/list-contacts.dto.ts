import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  DealerTier,
  Ethnicity,
  Gender,
  LanguagePreference,
  MalaysianState,
  NumberType,
  Occupation,
  OptInStatus,
  Religion,
  SubscriptionStatus,
  VehicleSpecialization,
} from '@prisma/client';

// Single-occurrence query params (?state=JOHOR) arrive as plain strings, not
// arrays — same pattern as ListTemplatesDto / ListBlastsDto / ListTicketsDto.
const toArray = Transform(({ value }) => (Array.isArray(value) ? value : [value]));

export class ListContactsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(Ethnicity, { each: true })
  ethnicity?: Ethnicity[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(Gender, { each: true })
  gender?: Gender[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(Religion, { each: true })
  religion?: Religion[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(Occupation, { each: true })
  occupation?: Occupation[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(LanguagePreference, { each: true })
  languagePreference?: LanguagePreference[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(MalaysianState, { each: true })
  state?: MalaysianState[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsString({ each: true })
  city?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageMax?: number;

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(OptInStatus, { each: true })
  optInStatus?: OptInStatus[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(DealerTier, { each: true })
  tier?: DealerTier[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(SubscriptionStatus, { each: true })
  subscriptionStatus?: SubscriptionStatus[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(VehicleSpecialization, { each: true })
  vehicleSpecialization?: VehicleSpecialization[];

  @IsOptional()
  @toArray
  @IsArray()
  @IsEnum(NumberType, { each: true })
  numberType?: NumberType[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
