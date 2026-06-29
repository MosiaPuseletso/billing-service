import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [BillingController],
  providers: [BillingService],
})
export class AppModule {}