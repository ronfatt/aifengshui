import crypto from "crypto";

export type SenangPayEnvironment = "sandbox" | "production";

export type SenangPayPaymentInput = {
  detail: string;
  amount: string;
  orderId: string;
  name: string;
  email: string;
  phone?: string | null;
};

export type SenangPayCallbackInput = {
  statusId: string;
  orderId: string;
  transactionId: string;
  message: string;
  hash: string;
};

export const senangPayEnvironment: SenangPayEnvironment =
  process.env.SENANGPAY_ENV === "production" ? "production" : "sandbox";

export const senangPayMerchantId = process.env.SENANGPAY_MERCHANT_ID || "";
export const senangPaySecretKey = process.env.SENANGPAY_SECRET_KEY || "";

export const isSenangPayConfigured = Boolean(senangPayMerchantId && senangPaySecretKey);

export function getSenangPayBaseUrl() {
  if (process.env.SENANGPAY_BASE_URL) return process.env.SENANGPAY_BASE_URL;
  return senangPayEnvironment === "production" ? "https://app.senangpay.my" : "https://sandbox.senangpay.my";
}

export function getPublicAppUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || new URL(request.url).origin;
}

export function formatSenangPayAmount(amountCents: number) {
  return (Math.round(amountCents) / 100).toFixed(2);
}

function md5(value: string) {
  return crypto.createHash("md5").update(value).digest("hex");
}

export function createSenangPayPaymentHash(input: Pick<SenangPayPaymentInput, "detail" | "amount" | "orderId">) {
  return md5(`${senangPaySecretKey}${input.detail}${input.amount}${input.orderId}`);
}

export function createSenangPayCallbackHash(input: Omit<SenangPayCallbackInput, "hash">) {
  return md5(`${senangPaySecretKey}${input.statusId}${input.orderId}${input.transactionId}${input.message}`);
}

export function verifySenangPayCallback(input: SenangPayCallbackInput) {
  if (!isSenangPayConfigured || !input.hash) return false;
  const expected = createSenangPayCallbackHash(input);
  return expected.toLowerCase() === input.hash.toLowerCase();
}

export function buildSenangPayPaymentUrl(input: SenangPayPaymentInput) {
  const url = new URL(`/payment/${senangPayMerchantId}`, getSenangPayBaseUrl());
  url.searchParams.set("detail", input.detail);
  url.searchParams.set("amount", input.amount);
  url.searchParams.set("order_id", input.orderId);
  url.searchParams.set("name", input.name);
  url.searchParams.set("email", input.email);
  if (input.phone) url.searchParams.set("phone", input.phone);
  url.searchParams.set("hash", createSenangPayPaymentHash(input));
  return url.toString();
}
