import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";

type ProfilePayload = {
  userId?: string;
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  email?: string;
  phone?: string;
  region?: string;
  referralCode?: string;
};

const companySponsorCode = "HQ001";
const referralReward = 30;

function normalizeReferralCode(code?: string) {
  return code?.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 24) || "";
}

function generateReferralCode(name: string, userId: string) {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
  return `YIXI-${cleanName || "USER"}${userId.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireAuthenticatedUser(request);

  if (!supabase) {
    return NextResponse.json(
      { error: "会员系统暂时维护中，请稍后再试。" },
      { status: 503 }
    );
  }

  if (errorResponse || !user) {
    return errorResponse;
  }

  if (!isSupabaseServiceConfigured) {
    return NextResponse.json(
      { error: "会员资料服务暂时维护中，请稍后再试。" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as ProfilePayload;
  const requestedSponsorCode = normalizeReferralCode(body.referralCode);
  const sponsorCode = requestedSponsorCode || companySponsorCode;
  const referralSource = requestedSponsorCode ? "member_referral" : "organic_hq";

  if (!body.userId || !body.name || !body.birthDate || !body.gender || !body.email) {
    return NextResponse.json({ error: "姓名、生日、性别、Email 与 userId 为必填。" }, { status: 400 });
  }

  if (body.userId !== user.id) {
    return NextResponse.json({ error: "不能替其他会员建立或修改资料。" }, { status: 403 });
  }

  const verifiedEmail = user.email || body.email;
  const referralCode = generateReferralCode(body.name, body.userId);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: body.userId,
      full_name: body.name,
      birth_date: body.birthDate,
      birth_time: body.birthTime || null,
      gender: body.gender,
      email: verifiedEmail,
      phone: body.phone || null,
      region: body.region || "Malaysia / Kuala Lumpur",
      membership_tier: "free",
      credit_balance: referralReward,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "会员资料保存失败，请稍后再试。" }, { status: 500 });
  }

  await supabase.auth.admin.updateUserById(body.userId, {
    user_metadata: {
      full_name: body.name,
      referral_code: referralCode,
      sponsor_code: sponsorCode,
      referral_source: referralSource
    }
  });

  await supabase.from("credit_transactions").insert({
    user_id: body.userId,
    amount: referralReward,
    source: "registration_bonus",
    description: "完成会员注册赠送点数"
  });

  if (requestedSponsorCode && requestedSponsorCode !== companySponsorCode && requestedSponsorCode !== referralCode) {
    const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const sponsorUser = authUsers.users.find(
      (user) => normalizeReferralCode(user.user_metadata?.referral_code as string | undefined) === requestedSponsorCode
    );

    if (sponsorUser) {
      const { data: sponsorProfile } = await supabase
        .from("profiles")
        .select("id,credit_balance")
        .eq("id", sponsorUser.id)
        .single();

      if (sponsorProfile) {
        await supabase
          .from("profiles")
          .update({
            credit_balance: sponsorProfile.credit_balance + referralReward,
            updated_at: new Date().toISOString()
          })
          .eq("id", sponsorProfile.id);

        await supabase.from("credit_transactions").insert({
          user_id: sponsorProfile.id,
          amount: referralReward,
          source: "referral_signup_reward",
          description: `${verifiedEmail} 完成注册推荐奖励`
        });
      }
    }
  }

  return NextResponse.json({ profile: data });
}
