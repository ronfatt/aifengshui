import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreditBody = {
  delta?: number;
  source?: string;
  description?: string;
};

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,credit_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "找不到会员资料。" }, { status: 404 });
  }

  const nextBalance = profile.credit_balance + delta;

  if (nextBalance < 0) {
    return NextResponse.json({ error: "点数不足。" }, { status: 400 });
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("credit_balance")
    .single();

  if (updateError || !updatedProfile) {
    return NextResponse.json({ error: "点数更新失败。" }, { status: 500 });
  }

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: delta,
    source: body.source || "member_usage",
    description: body.description || "会员端功能点数变化"
  });

  return NextResponse.json({ creditBalance: updatedProfile.credit_balance });
}
