import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ProfilePayload = {
  userId?: string;
  name?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string;
  email?: string;
  phone?: string;
  region?: string;
};

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase 尚未配置。请先设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。" },
      { status: 503 }
    );
  }

  if (!isSupabaseServiceConfigured) {
    return NextResponse.json(
      { error: "请在 .env.local 设置 SUPABASE_SERVICE_ROLE_KEY，服务端才可以安全保存会员 profile。" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as ProfilePayload;

  if (!body.userId || !body.name || !body.birthDate || !body.gender || !body.email) {
    return NextResponse.json({ error: "姓名、生日、性别、Email 与 userId 为必填。" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: body.userId,
      full_name: body.name,
      birth_date: body.birthDate,
      birth_time: body.birthTime || null,
      gender: body.gender,
      email: body.email,
      phone: body.phone || null,
      region: body.region || "Malaysia / Kuala Lumpur",
      membership_tier: "free",
      credit_balance: 0,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
