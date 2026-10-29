import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SimulateInboundDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text!: string;
}
