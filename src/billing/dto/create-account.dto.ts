import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @Min(0)
  transactionThreshold: number;

  @IsNumber()
  @Min(0)
  discountDays: number;

  @IsNumber()
  @Min(0)
  @Max(1) // Assuming discount is a decimal (e.g., 0.2 for 20%)
  discountRate: number;
}