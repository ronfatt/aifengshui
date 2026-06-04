import type { CreditAmount, ISODateTimeString, MoneyCents, PaymentMethod } from "@/lib/types/primitives";

export type CreditSource =
  | "registration_bonus"
  | "admin_adjustment"
  | "purchase_topup"
  | "product_bonus"
  | "course_bonus"
  | "referral_reward"
  | "report_generation"
  | "ai_chat"
  | "daily_fortune"
  | "divination"
  | "sigil"
  | "hexagram64"
  | "refund"
  | "member_usage"
  | "member_reward";

export type CreditLedgerEntry = {
  id: string;
  userId: string;
  amount: CreditAmount;
  balanceAfter?: CreditAmount;
  source: CreditSource | string;
  description?: string | null;
  relatedOrderId?: string | null;
  relatedReportId?: string | null;
  expiresAt?: ISODateTimeString | null;
  createdAt: ISODateTimeString;
};

export type CreditTopupPackage = {
  id: string;
  title: string;
  credits: CreditAmount;
  bonusCredits: CreditAmount;
  priceCents: MoneyCents;
  paymentMethod?: PaymentMethod;
  isActive: boolean;
};

