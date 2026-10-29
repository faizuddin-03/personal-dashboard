import { ArrayMinSize, IsArray, IsEnum, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class GenerateTemplateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  brief!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['EN', 'MS', 'ZH', 'TA', 'OTHER'], { each: true })
  languages!: string[];

  @IsEnum(['friendly', 'formal'])
  tone!: 'friendly' | 'formal';
}
