import { Controller, Post, Body, Param } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CalculateBillDto } from './dto/calculate-bill.dto';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('currencies')
  addCurrency(@Body() createCurrencyDto: CreateCurrencyDto) {
    return this.billingService.addCurrency(createCurrencyDto);
  }

  @Post('accounts')
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.billingService.createAccount(createAccountDto);
  }

  @Post('accounts/:accountId/bill')
  calculateBill(
    @Param('accountId') accountId: string,
    @Body() calculateBillDto: CalculateBillDto,
  ) {
    return this.billingService.calculateBill(accountId, calculateBillDto);
  }
}