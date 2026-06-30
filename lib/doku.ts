import crypto from "crypto";

export type DokuEnvironment = "sandbox" | "production";

export type DokuCheckoutCustomer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

export type DokuCheckoutProduct = {
  detail: string;
  description: string;
  amountCents: number;
};

export type DokuCheckoutResult = {
  paymentUrl: string;
  requestId: string;
  rawResponse: Record<string, unknown>;
};

const dokuClientId = process.env.DOKU_CLIENT_ID || "";
const dokuSecretKey = process.env.DOKU_SECRET_KEY || "";
const dokuApiKey = process.env.DOKU_API_KEY || "";

export const dokuEnvironment: DokuEnvironment =
  process.env.DOKU_ENV === "production" ? "production" : "sandbox";

export const dokuCurrency = process.env.DOKU_CURRENCY || "MYR";
export const isDokuConfigured = Boolean(dokuClientId && dokuSecretKey);

export function getDokuBaseUrl() {
  if (process.env.DOKU_BASE_URL) return process.env.DOKU_BASE_URL.replace(/\/$/, "");
  return dokuEnvironment === "production" ? "https://api.doku.com" : "https://api-sandbox.doku.com";
}

export function getPublicAppUrl(request: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function createDokuRequestId(orderNo: string) {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${orderNo}-${random}`;
}

export function formatDokuAmount(amountCents: number) {
  if (process.env.DOKU_AMOUNT_UNIT === "minor") return amountCents;

  const amount = amountCents / 100;
  return Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
}

export function createDokuDigest(rawBody: string) {
  return `SHA-256=${crypto.createHash("sha256").update(rawBody).digest("base64")}`;
}

export function createDokuSignature(input: {
  clientId?: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  digest: string;
}) {
  const clientId = input.clientId || dokuClientId;
  const signatureComponent = [
    `Client-Id:${clientId}`,
    `Request-Id:${input.requestId}`,
    `Request-Timestamp:${input.requestTimestamp}`,
    `Request-Target:${input.requestTarget}`,
    `Digest:${input.digest}`
  ].join("\n");

  const signature = crypto.createHmac("sha256", dokuSecretKey).update(signatureComponent).digest("base64");
  return `HMACSHA256=${signature}`;
}

export function verifyDokuSignature(input: {
  clientId: string;
  requestId: string;
  requestTimestamp: string;
  requestTarget: string;
  rawBody: string;
  signature: string;
}) {
  if (!isDokuConfigured) return false;
  if (input.clientId !== dokuClientId) return false;

  const digest = createDokuDigest(input.rawBody);
  const expected = createDokuSignature({
    clientId: input.clientId,
    requestId: input.requestId,
    requestTimestamp: input.requestTimestamp,
    requestTarget: input.requestTarget,
    digest
  });

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(input.signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function pickPaymentUrl(response: Record<string, unknown>) {
  const payment = response.payment as Record<string, unknown> | undefined;
  const responsePayment = (response.response as Record<string, unknown> | undefined)?.payment as Record<string, unknown> | undefined;

  return (
    (payment?.checkout_url as string | undefined) ||
    (payment?.url as string | undefined) ||
    (responsePayment?.url as string | undefined) ||
    (response.checkout_url as string | undefined) ||
    (response.payment_url as string | undefined)
  );
}

export async function createDokuCheckoutPayment(input: {
  orderNo: string;
  product: DokuCheckoutProduct;
  customer: DokuCheckoutCustomer;
  appUrl: string;
}): Promise<DokuCheckoutResult> {
  if (!isDokuConfigured) {
    throw new Error("DOKU is not configured.");
  }

  const requestTarget = "/v3/checkouts";
  const requestId = createDokuRequestId(input.orderNo);
  const requestTimestamp = new Date().toISOString();
  const amount = formatDokuAmount(input.product.amountCents);
  const expiredAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const payload = {
    id: requestId,
    order: {
      amount,
      invoice_number: input.orderNo,
      currency: dokuCurrency,
      expired_at: expiredAt
    },
    checkout_experience: {
      channels: ["INTERNET_BANKING_FPX", "EWALLET_TNG", "EWALLET_GRABPAY", "CREDIT_CARD"],
      language: "EN",
      auto_redirect: true,
      retry_payment: {
        enabled: true
      }
    },
    payment: {
      payment_due_date: 60
    },
    customer: {
      id: input.customer.id,
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone || undefined,
      country: "MY"
    },
    metadata: {
      product_detail: input.product.detail,
      product_description: input.product.description,
      return_url: `${input.appUrl}/dashboard?payment=pending&order=${encodeURIComponent(input.orderNo)}`,
      notification_url: `${input.appUrl}/api/payments/doku/callback`
    }
  };

  const rawBody = JSON.stringify(payload);
  const digest = createDokuDigest(rawBody);
  const signature = createDokuSignature({ requestId, requestTimestamp, requestTarget, digest });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-Id": dokuClientId,
    "Request-Id": requestId,
    "Request-Timestamp": requestTimestamp,
    Signature: signature,
    Authorization: signature,
    Digest: digest
  };

  if (dokuApiKey) headers["API-Key"] = dokuApiKey;

  const response = await fetch(`${getDokuBaseUrl()}${requestTarget}`, {
    method: "POST",
    headers,
    body: rawBody
  });

  const rawResponse = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const paymentUrl = pickPaymentUrl(rawResponse);

  if (!response.ok || !paymentUrl) {
    const message =
      (rawResponse.message as string | undefined) ||
      (rawResponse.error as string | undefined) ||
      "DOKU payment URL was not returned.";
    throw new Error(message);
  }

  return { paymentUrl, requestId, rawResponse };
}
