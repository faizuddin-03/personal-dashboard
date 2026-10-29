import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { TemplateLanguageVariantDto } from './template-component.dto';

export class UpdateTemplateDto {
  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category!: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateLanguageVariantDto)
  variants!: TemplateLanguageVariantDto[];
}
