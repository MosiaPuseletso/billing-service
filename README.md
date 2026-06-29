# 💸 NestJS Billing Engine

A lightweight, in-memory billing microservice built with NestJS and TypeScript. This service calculates prorated monthly bills, handles dynamic transaction fees, and applies time-bound promotional discounts.

## 🚀 Features

* **In-Memory Datastore:** Fast, O(1) lookups using ES6 Maps (No database setup required).
* **Robust Validation:** Automatic input validation and error handling using `class-validator` and `class-transformer`.
* **Dynamic Configuration:** Business rules (like transaction fees) are injected via `.env` files using `@nestjs/config`.
* **Prorated Math:** Accurately calculates partial-month base fees and exact overlap for promotional discount periods.
* **Tested Logic:** Comprehensive Jest unit tests with time-mocking for reliable financial calculations.

---

## 🛠️ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/)
* **Language:** TypeScript
* **Validation:** `class-validator`
* **Testing:** Jest

---

## ⚙️ Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Configuration
Create a `.env` file in the root directory of the project. This controls the global business rules for the billing engine:

```env
# .env
TRANSACTION_FEE_GBP=0.50
DAYS_IN_MONTH=30
```

### 4. Running the Application

```bash
# development
npm run start

# watch mode (restarts automatically on save)
npm run start:dev

# production mode
npm run start:prod
```

The server will start on `http://localhost:3000`.

---

## 🧪 Testing

The core billing logic is fully covered by unit tests. To verify the math and error handling, run:

```bash
npm run test
```

---

## 📖 API Documentation & Usage

### 1. Add a Currency Tier
Registers a new currency and its associated monthly base fee.

**Endpoint:** `POST /currencies`

**Payload:**
```json
{
  "currency": "GBP",
  "monthlyFeeGbp": 30
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/currencies \
-H "Content-Type: application/json" \
-d '{"currency": "GBP", "monthlyFeeGbp": 30}'
```

---

### 2. Create a Customer Account
Creates a new account. The `discountDays` start ticking from the exact moment the account is created.

**Endpoint:** `POST /accounts`

**Payload:**
```json
{
  "accountId": "acc_123",
  "currency": "GBP",
  "transactionThreshold": 100,
  "discountDays": 30,
  "discountRate": 0.5
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/accounts \
-H "Content-Type: application/json" \
-d '{"accountId": "acc_123", "currency": "GBP", "transactionThreshold": 100, "discountDays": 30, "discountRate": 0.5}'
```

---

### 3. Calculate Bill
Calculates the final bill for a specific period. The service automatically handles prorating the base fee and discount based on the exact overlap with the `billingPeriodStart` and `billingPeriodEnd`.

**Endpoint:** `POST /accounts/:accountId/bill`

**Payload:**
```json
{
  "billingPeriodStart": "2026-07-01T00:00:00Z",
  "billingPeriodEnd": "2026-07-31T00:00:00Z",
  "transactionCount": 150
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/accounts/acc_123/bill \
-H "Content-Type: application/json" \
-d '{"billingPeriodStart": "2026-07-01T00:00:00Z", "billingPeriodEnd": "2026-07-31T00:00:00Z", "transactionCount": 150}'
```

**Success Response:**
```json
{
  "totalDueGbp": 27.5,
  "breakdown": {
    "baseFee": 30,
    "transactionFees": 25,
    "subtotal": 55,
    "discountApplied": 27.5
  }
}
```

---

## 📂 Project Structure

```text
src/
├── app.module.ts           # Root module
├── main.ts                 # App entry point (Global Pipes enabled)
└── billing/
    ├── billing.controller.ts # REST API definitions
    ├── billing.service.ts  # Core business and financial logic
    ├── billing.service.spec.ts # Jest unit tests
    └── dto/
        ├── create-currency.dto.ts
        ├── create-account.dto.ts
        └── calculate-bill.dto.ts
```