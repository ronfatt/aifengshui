import type { CurrencyCode, ISODateTimeString, MoneyCents, PaymentMethod } from "@/lib/types/primitives";

export type OrderType = "product" | "course" | "credit_topup" | "subscription" | "ai_report" | "agent_package" | "service";

export type OrderStatus = "pending" | "paid" | "processing" | "completed" | "refunded" | "cancelled";

export type PaymentStatus = "unpaid" | "pending_review" | "paid" | "failed" | "refunded" | "partially_refunded";

export type OrderLine = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitAmountCents: MoneyCents;
  totalAmountCents: MoneyCents;
};

export type OrderRecord = {
  id: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  currency: CurrencyCode;
  subtotalCents: MoneyCents;
  discountCents: MoneyCents;
  shippingCents: MoneyCents;
  taxCents: MoneyCents;
  totalCents: MoneyCents;
  lines: OrderLine[];
  sponsorUserId?: string | null;
  createdAt: ISODateTimeString;
  paidAt?: ISODateTimeString | null;
  completedAt?: ISODateTimeString | null;
};

