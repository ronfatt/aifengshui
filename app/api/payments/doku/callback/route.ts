import { NextResponse } from "next/server";
import { getPublicAppUrl, verifyDokuSignature } from "@/lib/doku";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PaymentOrderRow, ProfileRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type DokuCallbackPayload = Record<string, unknown>;

const revenueAccountByOrderType: Record<PaymentOrderRow["order_type"], { code: string; name: string }> = {
  subscription: { code: "4000", name: "Subscription Revenue" },
  credit_topup: { code: "4100", name: "Credit Top-up Revenue" },
  product: { code: "4200", name: "Product Sales Revenue" },
  course: { code: "4300", name: "Course Sales Revenue" },
  ai_report: { code: "4400", name: "AI Reports Revenue" },
  agent_package: { code: "4500", name: "Agent Package Revenue" },
  service: { code: "4500", name: "Agent Package Revenue" }
};

function nestedString(payload: DokuCallbackPayload, path: string[]) {
  let current: unknown = payload;
  for (const key of path) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" || typeof current === "number" ? String(current) : "";
}

function extractOrderNo(payload: DokuCallbackPayload) {
  return (
    nestedString(payload, ["order", "invoice_number"]) ||
    nestedString(payload, ["order", "id"]) ||
    nestedString(payload, ["invoice_number"]) ||
    nestedString(payload, ["order_id"])
  );
}

function extractTransactionId(payload: DokuCallbackPayload) {
  return (
    nestedString(payload, ["transaction", "id"]) ||
    nestedString(payload, ["transaction", "original_request_id"]) ||
    nestedString(payload, ["payment", "id"]) ||
    nestedString(payload, ["payment", "transaction_id"]) ||
    nestedString(payload, ["id"])
  );
}

function extractStatus(payload: DokuCallbackPayload) {
  return (
    nestedString(payload, ["transaction", "status"]) ||
    nestedString(payload, ["payment", "status"]) ||
    nestedString(payload, ["payment", "state"]) ||
    nestedString(payload, ["order", "status"]) ||
    nestedString(payload, ["status"])
  ).toUpperCase();
}

function extractMessage(payload: DokuCallbackPayload) {
  return (
    nestedString(payload, ["message"]) ||
    nestedString(payload, ["transaction", "status"]) ||
    nestedString(payload, ["payment", "status"]) ||
    extractStatus(payload)
  );
}

function isPaidStatus(status: string) {
  return ["SUCCESS", "PAID", "SETTLEMENT", "CAPTURE", "COMPLETED", "CAPTURED"].includes(status.toUpperCase());
}

function isFailedStatus(status: string) {
  return ["FAILED", "CANCELLED", "CANCELED", "EXPIRED", "DENY", "VOID", "REFUND"].includes(status.toUpperCase());
}

function dashboardRedirect(request: Request, status: "success" | "failed" | "invalid", orderNo?: string) {
  const url = new URL("/dashboard", getPublicAppUrl(request));
  url.searchParams.set("payment", status);
  if (orderNo) url.searchParams.set("order", orderNo);
  return NextResponse.redirect(url);
}

async function insertAccountingJournal(
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>,
  order: PaymentOrderRow
) {
  const amount = order.amount_cents / 100;
  const revenueAccount = revenueAccountByOrderType[order.order_type] || revenueAccountByOrderType.service;
  const now = new Date();
  const journalNo = `DOKU-JE-${order.order_no}`;
  const period = now.toISOString().slice(0, 7);

  const { data: existingJournal } = await supabase
    .from("accounting_journals")
    .select("id")
    .eq("journal_no", journalNo)
    .maybeSingle();

  if (existingJournal) return;

  const { data: journal, error: journalError } = await supabase
    .from("accounting_journals")
    .insert({
      journal_no: journalNo,
      source_module: "doku",
      source_id: order.id,
      period,
      journal_date: now.toISOString().slice(0, 10),
      description: `DOKU paid order ${order.order_no} - ${order.description}`,
      status: "posted",
      total_debit: amount,
      total_credit: amount,
      posted_at: now.toISOString()
    })
    .select("id")
    .single();

  if (journalError || !journal) return;

  await supabase.from("accounting_journal_lines").insert([
    {
      journal_id: journal.id,
      line_no: 1,
      account_code: "1100",
      account_name: "Payment Gateway Clearing",
      debit: amount,
      credit: 0,
      memo: `DOKU clearing ${order.order_no}`,
      entity_type: "payment_order",
      entity_id: order.id
    },
    {
      journal_id: journal.id,
      line_no: 2,
      account_code: revenueAccount.code,
      account_name: revenueAccount.name,
      debit: 0,
      credit: amount,
      memo: order.description,
      entity_type: "payment_order",
      entity_id: order.id
    }
  ]);
}

async function fulfillPaidOrder(
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>,
  order: PaymentOrderRow,
  transactionId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", order.user_id)
    .single();

  const profileUpdate: Partial<Pick<ProfileRow, "credit_balance" | "membership_tier" | "partner_package" | "updated_at">> = {
    updated_at: new Date().toISOString()
  };

  if (typeof profile?.credit_balance === "number" && order.credit_amount > 0) {
    profileUpdate.credit_balance = profile.credit_balance + order.credit_amount;
  }

  if (order.membership_tier) profileUpdate.membership_tier = order.membership_tier;
  if (order.partner_package) profileUpdate.partner_package = order.partner_package;

  await supabase.from("profiles").update(profileUpdate).eq("id", order.user_id);

  if (order.credit_amount > 0) {
    await supabase.from("credit_transactions").insert({
      user_id: order.user_id,
      amount: order.credit_amount,
      source: "purchase_topup",
      description: `DOKU 付款成功发放点数：${order.description} (${order.order_no})`
    });
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
      payment_status: "paid",
      gateway_transaction_id: transactionId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id);

  await insertAccountingJournal(supabase, order);
}

async function handleCallback(request: Request) {
  const supabase = createServerSupabaseClient();

  if (request.method === "GET") {
    const url = new URL(request.url);
    const orderNo = url.searchParams.get("order") || url.searchParams.get("invoice_number") || undefined;
    return dashboardRedirect(request, "success", orderNo);
  }

  const rawBody = await request.text();
  const payload = (JSON.parse(rawBody || "{}") || {}) as DokuCallbackPayload;
  const orderNo = extractOrderNo(payload);
  const transactionId = extractTransactionId(payload);
  const status = extractStatus(payload);
  const message = extractMessage(payload);

  if (!supabase || !orderNo) {
    return NextResponse.json({ ok: false, error: "Invalid DOKU callback payload." }, { status: 400 });
  }

  const requestUrl = new URL(request.url);
  const verified = verifyDokuSignature({
    clientId: request.headers.get("Client-Id") || request.headers.get("client-id") || "",
    requestId: request.headers.get("Request-Id") || request.headers.get("request-id") || "",
    requestTimestamp: request.headers.get("Request-Timestamp") || request.headers.get("request-timestamp") || "",
    requestTarget: requestUrl.pathname,
    rawBody,
    signature: request.headers.get("Signature") || request.headers.get("signature") || ""
  });

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_no", orderNo)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  await supabase.from("payment_transactions").insert({
    order_id: order.id,
    gateway: "doku",
    gateway_order_id: orderNo,
    transaction_id: transactionId || null,
    amount_cents: order.amount_cents,
    status: status || "UNKNOWN",
    message,
    raw_payload: payload,
    verified
  });

  if (!verified) {
    await supabase
      .from("payment_orders")
      .update({ payment_status: "failed", status: "failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json({ ok: false, error: "Invalid DOKU signature." }, { status: 400 });
  }

  if (isPaidStatus(status)) {
    if (order.payment_status !== "paid") {
      await fulfillPaidOrder(supabase, order, transactionId || orderNo);
    }

    return NextResponse.json({ ok: true, status: "paid" });
  }

  if (isFailedStatus(status)) {
    await supabase
      .from("payment_orders")
      .update({ payment_status: "failed", status: "failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);
  }

  return NextResponse.json({ ok: true, status: status || "pending" });
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}
