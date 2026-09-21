import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCannedReplyDto {
  @IsString() @MinLength(1) @MaxLength(120)
  title!: string;

  @IsString() @MinLength(1) @MaxLength(4000)
  body!: string;

  @IsOptional() @IsString() @MaxLength(60)
  category?: string;
}
