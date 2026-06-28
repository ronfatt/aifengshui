import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreditBody = {
  delta?: number;
  source?: string;
  description?: string;
};

const memberRewardRules: Record<string, number> = {
  divination_checkin_reward: 18
};

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!supabase || !isSupabaseServiceConfigured || !token) {
    return NextResponse.json({ error: "请先登录会员账号。" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "会员登录已过期，请重新登录。" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || 40);
  const limit = Math.min(100, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 40));

  const { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .single();

  const { data: transactions, error } = await supabase
    .from("credit_transactions")
    .select("id,user_id,amount,source,description,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "点数流水读取失败。" }, { status: 500 });
  }

  return NextResponse.json({
    creditBalance: profile?.credit_balance,
    transactions: transactions || []
  });
}

export async function PATCH(request: Request) {
  const supabase = createServerSupabaseClient();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!supabase || !isSupabaseServiceConfigured || !token) {
    return NextResponse.json({ error: "请先登录会员账号。" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "会员登录已过期，请重新登录。" }, { status: 401 });
  }

  const body = (await request.json()) as CreditBody;
  const delta = Number(body.delta || 0);

  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ error: "点数变化不合法。" }, { status: 400 });
  }

  const source = body.source || "member_usage";
  const allowedRewardAmount = memberRewardRules[source];

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,credit_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "找不到会员资料。" }, { status: 404 });
  }

  if (delta > 0) {
    if (delta !== allowedRewardAmount) {
      return NextResponse.json(
        { error: "会员端不允许自行增加点数。请通过支付、推荐奖励或后台审核发放。" },
        { status: 403 }
      );
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: existingReward } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("source", source)
      .gte("created_at", todayStart.toISOString())
      .limit(1);

    if (existingReward?.length) {
      return NextResponse.json({ creditBalance: profile.credit_balance, alreadyRewarded: true });
    }

    const nextBalance = profile.credit_balance + delta;
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("credit_balance")
      .single();

    if (updateError || !updatedProfile) {
      return NextResponse.json({ error: "点数奖励发放失败。" }, { status: 500 });
    }

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: delta,
      source,
      description: body.description || "会员端每日打卡奖励"
    });

    return NextResponse.json({ creditBalance: updatedProfile.credit_balance });
  }

  const spendAmount = Math.abs(delta);
  const nextBalance = profile.credit_balance - spendAmount;

  if (nextBalance < 0) {
    return NextResponse.json({ error: "点数不足。" }, { status: 400 });
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .gte("credit_balance", spendAmount)
    .select("credit_balance")
    .single();

  if (updateError || !updatedProfile) {
    return NextResponse.json({ error: "点数不足或更新失败。" }, { status: 400 });
  }

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: delta,
    source,
    description: body.description || "会员端功能点数变化"
  });

  return NextResponse.json({ creditBalance: updatedProfile.credit_balance });
}
