import { IsEnum, IsOptional } from 'class-validator';
import { Range } from '../analytics.util';

export class RangeDto {
  @IsOptional() @IsEnum(['7d', '30d', '90d'] satisfies Range[])
  range: Range = '30d';
}
