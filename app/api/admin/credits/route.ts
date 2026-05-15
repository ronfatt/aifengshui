import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CreditPatchBody = {
  email?: string;
  creditBalance?: number;
  delta?: number;
  source?: string;
  description?: string;
};

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "ronfatt@gmail.com,charles.leongch@gmail.com,calven1313@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function assertAdmin(request: Request) {
  const supabase = createServerSupabaseClient();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!supabase || !isSupabaseServiceConfigured || !token) {
    return { supabase, error: "请先以管理员身份登录。" };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !adminEmails().includes(user.email.toLowerCase())) {
    return { supabase, error: "没有后台操作权限。" };
  }

  return { supabase, error: "" };
}

export async function GET(request: Request) {
  const { supabase, error: adminError } = await assertAdmin(request);

  if (!supabase || adminError) {
    return NextResponse.json({ error: adminError || "后台服务暂时不可用。" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const emails = searchParams
    .get("emails")
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!emails?.length) {
    return NextResponse.json({ error: "请提供 emails 参数。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,credit_balance,membership_tier,full_name,phone,gender,birth_date,birth_time")
    .in("email", emails);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const profiles = (data || []).map((profile) => {
    const authUser = authUsers.users.find((user) => user.id === profile.id);
    return {
      ...profile,
      referral_code: authUser?.user_metadata?.referral_code || "",
      sponsor_code: authUser?.user_metadata?.sponsor_code || "HQ001",
      referral_source: authUser?.user_metadata?.referral_source || "organic_hq"
    };
  });

  return NextResponse.json({ profiles });
}

export async function PATCH(request: Request) {
  const { supabase, error: adminError } = await assertAdmin(request);

  if (!supabase || adminError) {
    return NextResponse.json({ error: adminError || "后台服务暂时不可用。" }, { status: 403 });
  }

  const body = (await request.json()) as CreditPatchBody;
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "请提供会员 email。" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,credit_balance")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message || "找不到会员资料。" }, { status: 404 });
  }

  const nextBalance =
    typeof body.creditBalance === "number"
      ? body.creditBalance
      : profile.credit_balance + (typeof body.delta === "number" ? body.delta : 0);

  if (!Number.isFinite(nextBalance) || nextBalance < 0) {
    return NextResponse.json({ error: "点数余额不合法。" }, { status: 400 });
  }

  const amount = nextBalance - profile.credit_balance;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .select("id,email,credit_balance")
    .single();

  if (updateError || !updatedProfile) {
    return NextResponse.json({ error: updateError?.message || "点数更新失败。" }, { status: 500 });
  }

  if (amount !== 0) {
    await supabase.from("credit_transactions").insert({
      user_id: profile.id,
      amount,
      source: body.source || "admin_adjustment",
      description: body.description || "Admin 后台调整点数"
    });
  }

  return NextResponse.json({ profile: updatedProfile, amount });
}
