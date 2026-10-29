import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export type ButtonType = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';

export class TemplateButtonDto {
  @IsEnum(['URL', 'QUICK_REPLY', 'PHONE_NUMBER'])
  type!: ButtonType;

  @IsString()
  @MinLength(1)
  @MaxLength(25)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}

export class TemplateHeaderDto {
  @IsEnum(['TEXT'])
  type!: 'TEXT';

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  text!: string;
}

export class TemplateLanguageVariantDto {
  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  language!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  bodyText!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateHeaderDto)
  header?: TemplateHeaderDto;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  footerText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  buttons?: TemplateButtonDto[];

  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  variables!: string[];
}
