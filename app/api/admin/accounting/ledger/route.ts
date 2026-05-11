import { NextResponse } from "next/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type JournalLineInput = {
  accountCode?: string;
  accountName?: string;
  debit?: number;
  credit?: number;
  memo?: string;
  entityType?: string;
  entityId?: string;
};

type JournalPostBody = {
  journalNo?: string;
  sourceModule?: string;
  sourceId?: string;
  period?: string;
  journalDate?: string;
  description?: string;
  lines?: JournalLineInput[];
};

const demoAccounts = [
  { code: "1000", name: "Cash / Bank", type: "asset", normal_balance: "debit" },
  { code: "1100", name: "Payment Gateway Clearing", type: "asset", normal_balance: "debit" },
  { code: "2000", name: "Commission Payable", type: "liability", normal_balance: "credit" },
  { code: "2100", name: "Partner Pool Payable", type: "liability", normal_balance: "credit" },
  { code: "4400", name: "AI Reports Revenue", type: "revenue", normal_balance: "credit" },
  { code: "5200", name: "Commission Expense", type: "expense", normal_balance: "debit" },
  { code: "5300", name: "Partner Pool Expense", type: "expense", normal_balance: "debit" }
];

function adminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ronfatt@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function assertAdmin(request: Request) {
  const supabase = createServerSupabaseClient();
  const token = request.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!supabase || !isSupabaseServiceConfigured || !token) {
    return { supabase, user: null, error: "请先以管理员身份登录。" };
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user?.email || !adminEmails().includes(user.email.toLowerCase())) {
    return { supabase, user: null, error: "没有后台账务权限。" };
  }

  return { supabase, user, error: "" };
}

function monthPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function money(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function isMissingAccountingTable(errorMessage = "") {
  return /accounting_|relation .* does not exist|Could not find the table/i.test(errorMessage);
}

export async function GET(request: Request) {
  const { supabase, error: adminError } = await assertAdmin(request);

  if (!supabase || adminError) {
    return NextResponse.json({ error: adminError || "后台服务暂时不可用。" }, { status: 403 });
  }

  const [accountsResult, journalsResult, linesResult, auditResult] = await Promise.all([
    supabase.from("accounting_accounts").select("*").order("code", { ascending: true }),
    supabase.from("accounting_journals").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("accounting_journal_lines").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("accounting_audit_logs").select("*").order("created_at", { ascending: false }).limit(30)
  ]);

  const firstError = accountsResult.error || journalsResult.error || linesResult.error || auditResult.error;

  if (firstError) {
    if (isMissingAccountingTable(firstError.message)) {
      return NextResponse.json({
        configured: false,
        message: "Accounting ledger 表还没部署。请在 Supabase SQL Editor 执行 supabase/schema.sql 最新内容。",
        accounts: demoAccounts,
        journals: [],
        lines: [],
        auditLogs: []
      });
    }

    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    accounts: accountsResult.data || [],
    journals: journalsResult.data || [],
    lines: linesResult.data || [],
    auditLogs: auditResult.data || []
  });
}

export async function POST(request: Request) {
  const { supabase, user, error: adminError } = await assertAdmin(request);

  if (!supabase || !user || adminError) {
    return NextResponse.json({ error: adminError || "后台服务暂时不可用。" }, { status: 403 });
  }

  const body = (await request.json()) as JournalPostBody;
  const rawLines = Array.isArray(body.lines) ? body.lines : [];

  if (rawLines.length < 2) {
    return NextResponse.json({ error: "至少需要两条 journal lines。" }, { status: 400 });
  }

  const totalDebit = money(rawLines.reduce((sum, line) => sum + money(line.debit), 0));
  const totalCredit = money(rawLines.reduce((sum, line) => sum + money(line.credit), 0));

  if (totalDebit <= 0 || totalDebit !== totalCredit) {
    return NextResponse.json({ error: "Debit / Credit 必须相等，并且金额必须大于 0。" }, { status: 400 });
  }

  const period = body.period || monthPeriod();
  const journalNo = body.journalNo || `JE-${Date.now()}`;
  const sourceModule = body.sourceModule || "manual_admin";
  const sourceId = body.sourceId || journalNo;
  const description = body.description || "Admin manual accounting journal";

  const { data: journal, error: journalError } = await supabase
    .from("accounting_journals")
    .insert({
      journal_no: journalNo,
      source_module: sourceModule,
      source_id: sourceId,
      period,
      journal_date: body.journalDate || new Date().toISOString().slice(0, 10),
      description,
      status: "posted",
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: user.id,
      posted_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (journalError || !journal) {
    if (isMissingAccountingTable(journalError?.message)) {
      return NextResponse.json({ error: "Accounting ledger 表还没部署。请先执行最新 Supabase SQL。" }, { status: 409 });
    }

    return NextResponse.json({ error: journalError?.message || "Journal 建立失败。" }, { status: 500 });
  }

  const lines = rawLines.map((line, index) => ({
    journal_id: journal.id,
    line_no: index + 1,
    account_code: line.accountCode || "",
    account_name: line.accountName || line.accountCode || "",
    debit: money(line.debit),
    credit: money(line.credit),
    memo: line.memo || description,
    entity_type: line.entityType || sourceModule,
    entity_id: line.entityId || sourceId
  }));

  const { data: insertedLines, error: linesError } = await supabase.from("accounting_journal_lines").insert(lines).select("*");

  if (linesError) {
    await supabase.from("accounting_journals").update({ status: "void", updated_at: new Date().toISOString() }).eq("id", journal.id);
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  await supabase.from("accounting_audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email || null,
    action: "posted_journal",
    entity_type: "accounting_journal",
    entity_id: journal.id,
    before_data: null,
    after_data: { journal_no: journalNo, source_module: sourceModule, total_debit: totalDebit, total_credit: totalCredit }
  });

  return NextResponse.json({ journal, lines: insertedLines || [] });
}
