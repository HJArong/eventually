import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { mockPayments } from "@/lib/db/schema";
import { MockPaymentProvider, type Deposit, type PaymentProvider } from "@/lib/domain/payments";

function dbDepositStore(db: DB) {
  const toDeposit = (r: typeof mockPayments.$inferSelect): Deposit => ({
    id: r.id,
    quoteId: r.quoteId,
    method: r.method,
    amountPhp: r.amountPhp,
    status: r.status,
    reference: r.reference,
  });
  return {
    async insert(d: Omit<Deposit, "id">) {
      const [row] = await db.insert(mockPayments).values(d).returning();
      return toDeposit(row!);
    },
    async get(id: string) {
      const [row] = await db.select().from(mockPayments).where(eq(mockPayments.id, id));
      return row ? toDeposit(row) : null;
    },
  };
}

/** Swap in a real adapter here (e.g. PAYMENTS_PROVIDER=paymongo) once payments leave demo mode. */
export function paymentProvider(db: DB): PaymentProvider {
  return new MockPaymentProvider(dbDepositStore(db));
}
