import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import {
  buildSenangPayPaymentUrl,
  formatSenangPayAmount,
  getPublicAppUrl,
  isSenangPayConfigured,
  senangPayEnvironment
} from "@/lib/senangpay";
import type { MembershipTier, PartnerPackage } from "@/lib/types";

type CheckoutBody = {
  orderType?: "subscription" | "agent_package" | "credit_topup";
  membershipTier?: MembershipTier;
  partnerPackage?: PartnerPackage;
  productId?: string;
};

type CheckoutProduct = {
  productId: string;
  orderType: "subscription" | "agent_package" | "credit_topup";
  amountCents: number;
  creditAmount: number;
  membershipTier?: MembershipTier;
  partnerPackage?: PartnerPackage;
  detail: string;
  description: string;
};

const checkoutProducts: Record<string, CheckoutProduct> = {
  subscription_tactical: {
    productId: "subscription_tactical",
    orderType: "subscription",
    amountCents: 2900,
    creditAmount: 7000,
    membershipTier: "tactical",
    detail: "AI Feng Shui Master - Tactical Membership",
    description: "进阶会员版 RM29 / 月，含 7,000 点"
  },
  subscription_strategic: {
    productId: "subscription_strategic",
    orderType: "subscription",
    amountCents: 4900,
    creditAmount: 15000,
    membershipTier: "strategic",
    detail: "AI Feng Shui Master - Strategic Membership",
    description: "高阶战略版 RM49 / 月，含 15,000 点"
  },
  package_startup_8888: {
    productId: "package_startup_8888",
    orderType: "agent_package",
    amountCents: 980000,
    creditAmount: 9800,
    partnerPackage: "startup_8888",
    detail: "AI Feng Shui Master - Startup Partner Package",
    description: "RM9,800 创业启动配套"
  },
  package_partner_16888: {
    productId: "package_partner_16888",
    orderType: "agent_package",
    amountCents: 1680000,
    creditAmount: 16800,
    partnerPackage: "partner_16888",
    detail: "AI Feng Shui Master - Business Partner Package",
    description: "RM16,800 事业合伙人配套"
  },
  package_regional_38888: {
    productId: "package_regional_38888",
    orderType: "agent_package",
    amountCents: 3800000,
    creditAmount: 38000,
    partnerPackage: "regional_38888",
    detail: "AI Feng Shui Master - Regional Partner Package",
    description: "RM38,000 区域代理配套"
  }
};

function resolveCheckoutProduct(body: CheckoutBody) {
  if (body.productId && checkoutProducts[body.productId]) return checkoutProducts[body.productId];

  if (body.orderType === "subscription" && body.membershipTier === "tactical") {
    return checkoutProducts.subscription_tactical;
  }

  if (body.orderType === "subscription" && body.membershipTier === "strategic") {
    return checkoutProducts.subscription_strategic;
  }

  if (body.orderType === "agent_package" && body.partnerPackage === "startup_8888") {
    return checkoutProducts.package_startup_8888;
  }

  if (body.orderType === "agent_package" && body.partnerPackage === "partner_16888") {
    return checkoutProducts.package_partner_16888;
  }

  if (body.orderType === "agent_package" && body.partnerPackage === "regional_38888") {
    return checkoutProducts.package_regional_38888;
  }

  return null;
}

function createOrderNo() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SP${Date.now()}${random}`;
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireAuthenticatedUser(request);
  if (errorResponse) return errorResponse;

  if (!supabase || !user) {
    return NextResponse.json({ error: "付款服务暂时无法读取会员资料。" }, { status: 500 });
  }

  if (!isSenangPayConfigured) {
    return NextResponse.json(
      { error: "SenangPay 尚未配置。请在 Vercel 环境变量加入 SENANGPAY_MERCHANT_ID 与 SENANGPAY_SECRET_KEY。" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutBody;
  const product = resolveCheckoutProduct(body);

  if (!product) {
    return NextResponse.json({ error: "付款项目不存在或暂未开放。" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "找不到会员资料，请先完成注册资料。" }, { status: 404 });
  }

  const orderNo = createOrderNo();
  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .insert({
      order_no: orderNo,
      user_id: user.id,
      order_type: product.orderType,
      status: "pending",
      payment_status: "pending",
      payment_method: "senangpay",
      currency: "MYR",
      amount_cents: product.amountCents,
      credit_amount: product.creditAmount,
      membership_tier: product.membershipTier || null,
      partner_package: product.partnerPackage || null,
      description: product.description,
      metadata: {
        productId: product.productId,
        checkoutEnvironment: senangPayEnvironment,
        returnUrl: `${getPublicAppUrl(request)}/dashboard`
      }
    })
    .select("id,order_no")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "创建付款订单失败。请确认 Supabase 已执行最新 payment_orders SQL。", detail: orderError?.message },
      { status: 500 }
    );
  }

  const amount = formatSenangPayAmount(product.amountCents);
  const paymentUrl = buildSenangPayPaymentUrl({
    detail: product.detail,
    amount,
    orderId: order.order_no,
    name: profile.full_name || user.email || "AI Feng Shui Member",
    email: profile.email || user.email || "",
    phone: profile.phone
  });

  return NextResponse.json({
    orderId: order.id,
    orderNo: order.order_no,
    amount,
    currency: "MYR",
    environment: senangPayEnvironment,
    paymentUrl
  });
}
