import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

type ReportSection = {
  title: string;
  content: string;
};

type ReportPayload = {
  title?: string;
  tag?: string;
  points?: number;
  summary?: string;
  sections?: ReportSection[];
  metadata?: Record<string, unknown>;
};

type PersistReportBody = {
  report?: ReportPayload;
  source?: string;
  description?: string;
};

function visibleSections(report: ReportPayload) {
  const sections = Array.isArray(report.sections) ? report.sections : [];

  if (!report.metadata) {
    return sections;
  }

  return [{ title: "__metadata", content: JSON.stringify(report.metadata) }, ...sections];
}

export async function POST(request: Request) {
  const limited = rateLimitRequest(request, { scope: "reports", limit: 10, windowMs: 60_000 });

  if (limited) {
    return limited;
  }

  const { supabase, user, errorResponse } = await requireAuthenticatedUser(request);

  if (errorResponse) {
    return errorResponse;
  }

  if (!supabase || !user) {
    return NextResponse.json({ error: "请先登录会员账号。" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as PersistReportBody;
  const report = body.report || {};
  const cost = Math.max(0, Math.trunc(Number(report.points || 0)));

  if (!report.title || !report.summary || !Array.isArray(report.sections)) {
    return NextResponse.json({ error: "报告资料不完整，无法保存。" }, { status: 400 });
  }

  if (cost <= 0) {
    return NextResponse.json({ error: "报告点数不合法。" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,credit_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "找不到会员资料。" }, { status: 404 });
  }

  if (profile.credit_balance < cost) {
    return NextResponse.json({ error: "点数不足。", creditBalance: profile.credit_balance }, { status: 400 });
  }

  const nextBalance = profile.credit_balance - cost;
  const { data: updatedProfile, error: debitError } = await supabase
    .from("profiles")
    .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .gte("credit_balance", cost)
    .select("credit_balance")
    .single();

  if (debitError || !updatedProfile) {
    return NextResponse.json({ error: "点数不足或扣点失败。" }, { status: 400 });
  }

  const source = body.source || "report_generation";
  const description = body.description || `生成${report.title}`;

  const { error: transactionError } = await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: -cost,
    source,
    description
  });

  if (transactionError) {
    await supabase
      .from("profiles")
      .update({ credit_balance: updatedProfile.credit_balance + cost, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ error: "点数流水写入失败，已取消本次扣点。" }, { status: 500 });
  }

  const { data: savedReport, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      title: report.title,
      tag: report.tag || "报告",
      points: cost,
      summary: report.summary,
      sections: visibleSections(report)
    })
    .select("*")
    .single();

  if (reportError || !savedReport) {
    await supabase
      .from("profiles")
      .update({ credit_balance: updatedProfile.credit_balance + cost, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: cost,
      source: "report_generation_refund",
      description: `${description} 保存失败自动退回`
    });

    return NextResponse.json({ error: "报告保存失败，点数已自动退回。" }, { status: 500 });
  }

  return NextResponse.json({
    creditBalance: updatedProfile.credit_balance,
    report: savedReport
  });
}
