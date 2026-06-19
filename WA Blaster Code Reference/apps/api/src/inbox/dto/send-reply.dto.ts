import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendReplyDto {
  @IsString()
  @MinLength(1, { message: 'Reply body cannot be empty' })
  @MaxLength(1024, { message: 'Reply body cannot exceed 1024 characters' })
  body!: string;
}
