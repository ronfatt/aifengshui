import type { CurrencyCode, ISODateTimeString, MoneyCents, PaymentMethod } from "@/lib/types/primitives";

export type RevenueSource = "subscription" | "credit_topup" | "product_sales" | "course_sales" | "ai_reports" | "agent_packages" | "services";

export type FinanceTransaction = {
  id: string;
  userId?: string | null;
  orderId?: string | null;
  amountCents: MoneyCents;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  status: "pending" | "paid" | "failed" | "refunded" | "manual_review";
  sourceModule: RevenueSource | string;
  timestamp: ISODateTimeString;
};

export type AiUsageCostEntry = {
  id: string;
  userId: string;
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costCents: MoneyCents;
  sourceModule: "chat" | "report" | "daily_fortune" | "divination";
  createdAt: ISODateTimeString;
};

export type ProfitSnapshot = {
  period: string;
  totalRevenueCents: MoneyCents;
  aiCostCents: MoneyCents;
  hostingCostCents: MoneyCents;
  commissionCostCents: MoneyCents;
  poolShareCostCents: MoneyCents;
  productCostCents: MoneyCents;
  netProfitCents: MoneyCents;
};

export type WithdrawalRequest = {
  id: string;
  userId: string;
  amountCents: MoneyCents;
  status: "pending" | "approved" | "paid" | "rejected";
  bankName?: string | null;
  bankAccountLast4?: string | null;
  approvedBy?: string | null;
  createdAt: ISODateTimeString;
  paidAt?: ISODateTimeString | null;
};

