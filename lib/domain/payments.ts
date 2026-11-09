import { randomBytes } from "node:crypto";

export type PaymentMethod = "gcash" | "card";
export type PaymentStatus = "pending" | "succeeded" | "failed";

export type Deposit = {
  id: string;
  quoteId: string;
  method: PaymentMethod;
  amountPhp: number;
  status: PaymentStatus;
  reference: string;
};

/**
 * Seam for real payments. A PayMongo/Xendit adapter (GCash, Maya, cards) would create a payment
 * intent in `createDeposit` and resolve it via webhook; the app only depends on this interface.
 */
export interface PaymentProvider {
  readonly name: string;
  createDeposit(input: { quoteId: string; amountPhp: number; method: PaymentMethod }): Promise<Deposit>;
  getStatus(depositId: string): Promise<PaymentStatus | null>;
}

export interface DepositStore {
  insert(deposit: Omit<Deposit, "id">): Promise<Deposit>;
  get(id: string): Promise<Deposit | null>;
}

/** Demo provider: no money moves, every deposit succeeds immediately. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  constructor(private readonly store: DepositStore) {}

  async createDeposit(input: { quoteId: string; amountPhp: number; method: PaymentMethod }): Promise<Deposit> {
    if (!Number.isInteger(input.amountPhp) || input.amountPhp <= 0) {
      throw new Error("Deposit amount must be a positive whole peso amount");
    }
    const prefix = input.method === "gcash" ? "GC" : "CC";
    return this.store.insert({
      quoteId: input.quoteId,
      method: input.method,
      amountPhp: input.amountPhp,
      status: "succeeded",
      reference: `DEMO-${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`,
    });
  }

  async getStatus(depositId: string): Promise<PaymentStatus | null> {
    return (await this.store.get(depositId))?.status ?? null;
  }
}
