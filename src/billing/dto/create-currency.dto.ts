import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @Min(0)
  monthlyFeeGbp: number;
}