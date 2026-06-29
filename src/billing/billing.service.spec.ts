import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    // 1. Mock the ConfigService so our tests have stable environment variables
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'TRANSACTION_FEE_GBP') return 0.50;
        if (key === 'DAYS_IN_MONTH') return 30;
        return null;
      }),
    };

    // 2. Initialize the Testing Module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: ConfigService, useValue: mockConfigService }, // Inject the mock
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  // Ensure the service loads correctly
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateBill', () => {
    it('should calculate the exact bill, including transaction fees and discounts', () => {
      // Step 1: Add Currency
      service.addCurrency({ currency: 'GBP', monthlyFeeGbp: 30 });

      // Step 2: Freeze time to Jan 1, 2024, so the account's "createdAt" date is perfectly predictable
      const fakeCreationDate = new Date('2024-01-01T00:00:00Z');
      jest.useFakeTimers().setSystemTime(fakeCreationDate);

      // Create the account
      service.createAccount({
        accountId: 'acc_123',
        currency: 'GBP',
        transactionThreshold: 100,
        discountDays: 30, // Discount applies for exactly 30 days
        discountRate: 0.5, // 50% off
      });

      // Restore normal time so Jest doesn't act weird later
      jest.useRealTimers();

      // Step 3: Run the calculation for exactly the 30-day discount window
      const result = service.calculateBill('acc_123', {
        billingPeriodStart: '2024-01-01T00:00:00Z',
        billingPeriodEnd: '2024-01-31T00:00:00Z', // 30 days difference
        transactionCount: 150, // 50 transactions over the threshold
      });

      // Step 4: Assert the math is absolutely correct
      expect(result.totalDueGbp).toBe(27.5);
      expect(result.breakdown.baseFee).toBe(30); 
      expect(result.breakdown.transactionFees).toBe(25); // 50 * 0.50
      expect(result.breakdown.subtotal).toBe(55);
      expect(result.breakdown.discountApplied).toBe(27.5); // 50% of 55
    });

    it('should throw an error if the account does not exist', () => {
      // Wrap the function call in an arrow function so Jest can catch the error
      expect(() => {
        service.calculateBill('ghost_account', {
          billingPeriodStart: '2024-01-01T00:00:00Z',
          billingPeriodEnd: '2024-01-31T00:00:00Z',
          transactionCount: 10,
        });
      }).toThrow(NotFoundException);
    });

    it('should throw an error if the end date is before the start date', () => {
      service.addCurrency({ currency: 'GBP', monthlyFeeGbp: 30 });
      service.createAccount({
        accountId: 'acc_error',
        currency: 'GBP',
        transactionThreshold: 100,
        discountDays: 0,
        discountRate: 0,
      });

      expect(() => {
        service.calculateBill('acc_error', {
          billingPeriodStart: '2024-01-31T00:00:00Z', // Start is AFTER end
          billingPeriodEnd: '2024-01-01T00:00:00Z',
          transactionCount: 50,
        });
      }).toThrow(BadRequestException);
    });
  });
});