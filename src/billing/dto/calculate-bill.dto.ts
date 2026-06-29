import { IsNumber, IsISO8601, Min } from 'class-validator';

export class CalculateBillDto {
  @IsISO8601()
  billingPeriodStart: string;

  @IsISO8601()
  billingPeriodEnd: string;

  @IsNumber()
  @Min(0)
  transactionCount: number;
}