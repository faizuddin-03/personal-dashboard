import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { TemplateLanguageVariantDto } from './template-component.dto';

export class CreateTemplateDto {
  // Meta requires lowercase letters, digits, and underscores
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'name must be lowercase letters, digits, underscores; start with a letter' })
  name!: string;

  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category!: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateLanguageVariantDto)
  variants!: TemplateLanguageVariantDto[];

}
