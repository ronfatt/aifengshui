export type ISODateString = string;
export type ISODateTimeString = string;
export type CurrencyCode = "MYR" | "USD";
export type MoneyCents = number;
export type CreditAmount = number;

export type PaymentMethod =
  | "stripe"
  | "billplz"
  | "toyyibpay"
  | "senangpay"
  | "doku"
  | "fpx"
  | "credit_card"
  | "e_wallet"
  | "bank_transfer"
  | "manual"
  | "unknown";

export type LifecycleStatus = "draft" | "pending" | "approved" | "rejected" | "paid" | "cancelled" | "void";
