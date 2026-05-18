import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DownlineMember } from "@/lib/data";
import { companySponsorCode, generateShortReferralCode, normalizeReferralCode } from "@/lib/referral-code";

type ReferralUser = {
  id: string;
  email: string;
  name: string;
  referralCode: string;
  sponsorCode: string;
  referralSource: string;
  createdAt: string;
  tier: "free" | "tactical" | "strategic";
  points: number;
};

const commissionRate = {
  1: 0.2,
  2: 0.1,
  3: 0.05
} as const;

function fallbackReferralCode(userId: string, name: string) {
  return generateShortReferralCode(`${userId}:${name}`);
}

function tierToLevel(tier: ReferralUser["tier"]): DownlineMember["level"] {
  if (tier === "strategic") return "Master";
  if (tier === "tactical") return "Pro";
  return "Free";
}

function statusFor(user: ReferralUser): DownlineMember["status"] {
  if (user.points > 100) return "活跃";
  if (user.points > 0) return "跟进中";
  return "沉睡";
}

function estimateSales(user: ReferralUser, relationLevel: 0 | 1 | 2 | 3) {
  return 0;
}

function formatRM(amount: number) {
  return `RM${amount.toLocaleString("en-US", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function buildTree(users: ReferralUser[], root: ReferralUser, relationLevel: 0 | 1 | 2 | 3): DownlineMember {
  const sales = estimateSales(root, relationLevel);
  const commission = relationLevel === 0 ? 0 : sales * commissionRate[relationLevel];
  const children =
    relationLevel >= 3
      ? []
      : users
          .filter((user) => normalizeReferralCode(user.sponsorCode) === normalizeReferralCode(root.referralCode))
          .map((child) => buildTree(users, child, (relationLevel + 1) as 1 | 2 | 3));

  return {
    id: root.id,
    name: root.name,
    code: root.referralCode,
    level: tierToLevel(root.tier),
    relationLevel,
    status: statusFor(root),
    joinedAt: root.createdAt.slice(0, 10),
    sales: formatRM(sales),
    commission: formatRM(commission),
    points: root.points.toLocaleString("en-US"),
    children
  };
}

function flattenTree(member: DownlineMember): DownlineMember[] {
  return [member, ...(member.children || []).flatMap(flattenTree)];
}

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

  const [{ data: authUsers }, { data: profiles, error: profileError }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("profiles").select("id,full_name,email,membership_tier,credit_balance,created_at")
  ]);

  if (profileError) {
    return NextResponse.json({ error: "推荐关系读取失败。" }, { status: 500 });
  }

  const users: ReferralUser[] = (profiles || []).map((profile) => {
    const authUser = authUsers.users.find((item) => item.id === profile.id);
    const name = profile.full_name || authUser?.email?.split("@")[0] || "Member";
    return {
      id: profile.id,
      email: profile.email,
      name,
      referralCode: normalizeReferralCode(authUser?.user_metadata?.referral_code as string | undefined) || fallbackReferralCode(profile.id, name),
      sponsorCode: normalizeReferralCode(authUser?.user_metadata?.sponsor_code as string | undefined) || companySponsorCode,
      referralSource: (authUser?.user_metadata?.referral_source as string | undefined) || "organic_hq",
      createdAt: profile.created_at,
      tier: profile.membership_tier,
      points: profile.credit_balance
    };
  });

  const current = users.find((item) => item.id === user.id);

  if (!current) {
    return NextResponse.json({ error: "找不到会员资料。" }, { status: 404 });
  }

  const tree = buildTree(users, current, 0);
  const members = flattenTree(tree).filter((member) => member.relationLevel > 0);
  const totalSales = members.reduce((sum, member) => sum + Number(member.sales.replace(/[^\d.]/g, "")), 0);
  const totalCommission = members.reduce((sum, member) => sum + Number(member.commission.replace(/[^\d.]/g, "")), 0);
  const directCount = tree.children?.length || 0;

  const commissions = members
    .filter((member) => member.relationLevel <= 3)
    .map((member, index) => ({
      id: `COM-${member.id.slice(0, 6)}-${index + 1}`,
      date: member.joinedAt,
      from: member.name,
      level: member.relationLevel,
      source: member.sales === "RM0" ? "注册奖励" : "首单预估佣金",
      amount: member.sales === "RM0" ? "+30 点" : member.commission,
      status: member.sales === "RM0" ? "Points issued" : "Pending"
    }));

  return NextResponse.json({
    tree,
    summary: [
      { label: "直属下线", value: String(directCount), helper: "第一代 20%" },
      { label: "团队总人数", value: String(members.length), helper: "含二代、三代" },
      { label: "团队销售", value: formatRM(totalSales), helper: "按会员订单估算" },
      { label: "预计佣金", value: formatRM(totalCommission), helper: "20% / 10% / 5%" }
    ],
    commissions,
    referral: {
      referralCode: current.referralCode,
      sponsorCode: current.sponsorCode,
      referralSource: current.referralSource
    }
  });
}
