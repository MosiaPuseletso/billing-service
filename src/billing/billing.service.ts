import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CalculateBillDto } from './dto/calculate-bill.dto';

interface Account extends CreateAccountDto {
  createdAt: Date;
}

@Injectable()
export class BillingService {
  // In-memory data stores
  private currencies = new Map<string, number>();
  private accounts = new Map<string, Account>();

  private readonly TRANSACTION_FEE_GBP: number;
  private readonly DAYS_IN_MONTH: number;
  private readonly MS_PER_DAY = 1000 * 60 * 60 * 24;

  constructor(private configService: ConfigService) {
    this.TRANSACTION_FEE_GBP = this.configService.get<number>('TRANSACTION_FEE_GBP') || 0.50;
    this.DAYS_IN_MONTH = this.configService.get<number>('DAYS_IN_MONTH') || 30;
  }

  addCurrency(dto: CreateCurrencyDto) {
    this.currencies.set(dto.currency, dto.monthlyFeeGbp);
    return { message: `Currency ${dto.currency} added successfully.` };
  }

  createAccount(dto: CreateAccountDto) {
    if (!this.currencies.has(dto.currency)) {
      throw new BadRequestException(`Currency ${dto.currency} is not supported.`);
    }
    
    if (this.accounts.has(dto.accountId)) {
        throw new BadRequestException(`Account ${dto.accountId} already exists.`);
    }

    const newAccount: Account = {
      ...dto,
      createdAt: new Date(), // Storing creation time for discount logic
    };

    this.accounts.set(dto.accountId, newAccount);
    return { message: `Account ${dto.accountId} created successfully.` };
  }

  calculateBill(accountId: string, dto: CalculateBillDto) {
    const account = this.accounts.get(accountId);
    if (!account) throw new NotFoundException('Account not found.');

    const monthlyFeeGbp = this.currencies.get(account.currency);
    if (monthlyFeeGbp === undefined) throw new NotFoundException('Currency configuration missing.');

    const startDate = new Date(dto.billingPeriodStart);
    const endDate = new Date(dto.billingPeriodEnd);

    if (startDate >= endDate) {
      throw new BadRequestException('billingPeriodEnd must be after billingPeriodStart.');
    }

    // 1. Calculate Base Fee (Prorated)
    const billingDays = (endDate.getTime() - startDate.getTime()) / this.MS_PER_DAY;
    const dailyBaseFee = monthlyFeeGbp / this.DAYS_IN_MONTH;
    const baseFeeTotal = billingDays * dailyBaseFee;

    // 2. Calculate Transaction Fees
    const excessTx = Math.max(0, dto.transactionCount - account.transactionThreshold);
    const txFeeTotal = excessTx * this.TRANSACTION_FEE_GBP;

    const subtotal = baseFeeTotal + txFeeTotal;

    // 3. Calculate Discount (Prorated based on overlap)
    const discountEndDate = new Date(account.createdAt.getTime() + account.discountDays * this.MS_PER_DAY);
    
    // Find overlap window between billing period and discount validity period
    const overlapStart = new Date(Math.max(startDate.getTime(), account.createdAt.getTime()));
    const overlapEnd = new Date(Math.min(endDate.getTime(), discountEndDate.getTime()));

    let discountAmount = 0;
    if (overlapStart < overlapEnd) {
      const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / this.MS_PER_DAY;
      const discountRatio = overlapDays / billingDays; // Percentage of the billing period that gets the discount
      discountAmount = subtotal * account.discountRate * discountRatio;
    }

    const totalDue = subtotal - discountAmount;

    // Return payload with clean formatting
    return {
      totalDueGbp: this.round(totalDue),
      breakdown: {
        baseFee: this.round(baseFeeTotal),
        transactionFees: this.round(txFeeTotal),
        subtotal: this.round(subtotal),
        discountApplied: this.round(discountAmount),
      },
    };
  }

  // Utility to round to 2 decimal places (financials)
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}