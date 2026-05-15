import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser(request: Request) {
  const supabase = createServerSupabaseClient();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!supabase || !isSupabaseServiceConfigured || !token) {
    return {
      supabase,
      user: null,
      errorResponse: NextResponse.json({ error: "请先登录会员账号。" }, { status: 401 })
    };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      supabase,
      user: null,
      errorResponse: NextResponse.json({ error: "会员登录已过期，请重新登录。" }, { status: 401 })
    };
  }

  return { supabase, user, errorResponse: null };
}
