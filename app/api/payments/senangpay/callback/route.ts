import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  formatSenangPayAmount,
  getPublicAppUrl,
  verifySenangPayCallback
} from "@/lib/senangpay";
import type { PaymentOrderRow, ProfileRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type CallbackPayload = {
  status_id?: string;
  order_id?: string;
  transaction_id?: string;
  msg?: string;
  hash?: string;
  amount?: string;
};

const revenueAccountByOrderType: Record<PaymentOrderRow["order_type"], { code: string; name: string }> = {
  subscription: { code: "4000", name: "Subscription Revenue" },
  credit_topup: { code: "4100", name: "Credit Top-up Revenue" },
  product: { code: "4200", name: "Product Sales Revenue" },
  course: { code: "4300", name: "Course Sales Revenue" },
  ai_report: { code: "4400", name: "AI Reports Revenue" },
  agent_package: { code: "4500", name: "Agent Package Revenue" },
  service: { code: "4500", name: "Agent Package Revenue" }
};

function payloadToRecord(payload: CallbackPayload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value ?? ""])
  ) as Record<string, unknown>;
}

async function readCallbackPayload(request: Request): Promise<CallbackPayload> {
  const url = new URL(request.url);
  const searchPayload: CallbackPayload = {
    status_id: url.searchParams.get("status_id") || undefined,
    order_id: url.searchParams.get("order_id") || undefined,
    transaction_id: url.searchParams.get("transaction_id") || undefined,
    msg: url.searchParams.get("msg") || undefined,
    hash: url.searchParams.get("hash") || undefined,
    amount: url.searchParams.get("amount") || undefined
  };

  if (request.method === "GET") return searchPayload;

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as CallbackPayload;
    return { ...searchPayload, ...json };
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return searchPayload;

  return {
    ...searchPayload,
    status_id: String(formData.get("status_id") || searchPayload.status_id || ""),
    order_id: String(formData.get("order_id") || searchPayload.order_id || ""),
    transaction_id: String(formData.get("transaction_id") || searchPayload.transaction_id || ""),
    msg: String(formData.get("msg") || searchPayload.msg || ""),
    hash: String(formData.get("hash") || searchPayload.hash || ""),
    amount: String(formData.get("amount") || searchPayload.amount || "")
  };
}

function isPaidStatus(statusId: string) {
  return statusId === "1";
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
  const amount = Number(formatSenangPayAmount(order.amount_cents));
  const revenueAccount = revenueAccountByOrderType[order.order_type] || revenueAccountByOrderType.service;
  const now = new Date();
  const journalNo = `SP-JE-${order.order_no}`;
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
      source_module: "senangpay",
      source_id: order.id,
      period,
      journal_date: now.toISOString().slice(0, 10),
      description: `SenangPay paid order ${order.order_no} - ${order.description}`,
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
      memo: `SenangPay clearing ${order.order_no}`,
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
      description: `SenangPay 付款成功发放点数：${order.description} (${order.order_no})`
    });
  }

  await supabase
    .from("payment_orders")
    .update({
      status: "completed",
      payment_status: "paid",
      senangpay_transaction_id: transactionId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", order.id);

  await insertAccountingJournal(supabase, order);
}

async function handleCallback(request: Request) {
  const supabase = createServerSupabaseClient();
  const payload = await readCallbackPayload(request);
  const statusId = payload.status_id || "";
  const orderNo = payload.order_id || "";
  const transactionId = payload.transaction_id || "";
  const message = payload.msg || "";
  const hash = payload.hash || "";

  if (!supabase || !orderNo) {
    return request.method === "GET"
      ? dashboardRedirect(request, "invalid", orderNo)
      : NextResponse.json({ ok: false, error: "Invalid callback payload." }, { status: 400 });
  }

  const verified = verifySenangPayCallback({
    statusId,
    orderId: orderNo,
    transactionId,
    message,
    hash
  });

  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_no", orderNo)
    .single();

  if (orderError || !order) {
    return request.method === "GET"
      ? dashboardRedirect(request, "invalid", orderNo)
      : NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  await supabase.from("payment_transactions").insert({
    order_id: order.id,
    gateway: "senangpay",
    gateway_order_id: orderNo,
    transaction_id: transactionId || null,
    amount_cents: order.amount_cents,
    status: statusId,
    message,
    raw_payload: payloadToRecord(payload),
    verified
  });

  if (!verified) {
    await supabase
      .from("payment_orders")
      .update({ payment_status: "failed", status: "failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return request.method === "GET"
      ? dashboardRedirect(request, "invalid", orderNo)
      : NextResponse.json({ ok: false, error: "Invalid hash." }, { status: 400 });
  }

  if (isPaidStatus(statusId)) {
    if (order.payment_status !== "paid") {
      await fulfillPaidOrder(supabase, order, transactionId);
    }

    return request.method === "GET"
      ? dashboardRedirect(request, "success", orderNo)
      : NextResponse.json({ ok: true, status: "paid" });
  }

  await supabase
    .from("payment_orders")
    .update({ payment_status: "failed", status: "failed", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  return request.method === "GET"
    ? dashboardRedirect(request, "failed", orderNo)
    : NextResponse.json({ ok: true, status: "failed" });
}

export async function GET(request: Request) {
  return handleCallback(request);
}

export async function POST(request: Request) {
  return handleCallback(request);
}
