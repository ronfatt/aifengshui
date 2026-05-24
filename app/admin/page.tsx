"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  AlertTriangle,
  Award,
  Banknote,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  HandCoins,
  ImageIcon,
  Landmark,
  LayoutGrid,
  PackageCheck,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
  Warehouse
} from "lucide-react";
import {
  adminModules,
  adminStats,
  aiCostRecords,
  aiMarginRows,
  commissionRecords,
  costCenter,
  financeExecutiveKpis,
  financeReports,
  financeRevenue,
  inventoryProducts,
  inventoryReports,
  orderExceptions,
  orderKpis,
  orderPipeline,
  orders,
  productProfitRows,
  profitSummary,
  paymentReconciliation,
  revenueBreakdown,
  stockMovements,
  transactionRecords,
  withdrawalRiskChecks,
  withdrawalRequests
} from "@/lib/data";
import { AppShell, MetricCard, StatusPill } from "@/components/shell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const moduleTabs = [
  {
    id: "ceo",
    title: "CEO 总览",
    desc: "现金、异常、风控、待办",
    icon: ShieldCheck,
    stat: "Live"
  },
  {
    id: "users",
    title: "用户管理",
    desc: "会员资料、等级、点数、冻结、团队",
    icon: UsersRound,
    stat: "0 users"
  },
  {
    id: "credits",
    title: "点数管理",
    desc: "充值套餐、赠送规则、扣点规则",
    icon: WalletCards,
    stat: "4 packs"
  },
  {
    id: "ai",
    title: "AI 控制",
    desc: "Prompt、扣点、权限、敏感词",
    icon: Sparkles,
    stat: "6 funcs"
  },
  {
    id: "finance",
    title: "Finance",
    desc: "收入、成本、利润、佣金、提现",
    icon: CircleDollarSign,
    stat: "RM0"
  },
  {
    id: "accounting",
    title: "Accounting Export",
    desc: "销售、佣金、库存、AI 成本导出",
    icon: Download,
    stat: "CSV"
  },
  {
    id: "pool",
    title: "Pool Share",
    desc: "5% 业绩奖励池、审批、发放、审计",
    icon: HandCoins,
    stat: "5% pool"
  },
  {
    id: "stock",
    title: "Stock Keeper",
    desc: "SKU、库存流水、低库存、产品利润",
    icon: Warehouse,
    stat: "0 SKU"
  },
  {
    id: "courses",
    title: "课程管理",
    desc: "课程、价格、报名、签到、证书",
    icon: BookOpenCheck,
    stat: "0 courses"
  },
  {
    id: "orders",
    title: "Orders",
    desc: "订单状态、支付审核、履约跟踪",
    icon: Banknote,
    stat: "0 orders"
  },
  {
    id: "agents",
    title: "代理配套",
    desc: "8888/16888/38888 产品包管理",
    icon: Award,
    stat: "3 packs"
  },
  {
    id: "payments",
    title: "支付审核",
    desc: "银行转账、网关对账、人工审核",
    icon: Landmark,
    stat: "0 reviews"
  },
  {
    id: "system",
    title: "System",
    desc: "功能地图、AI 控制、分润规则",
    icon: LayoutGrid,
    stat: "11 modules"
  }
] as const;

type ActiveModule = (typeof moduleTabs)[number]["id"];
const financeTabs = [
  { id: "revenue", title: "Revenue", desc: "收入分析与利润摘要", icon: CircleDollarSign },
  { id: "reconciliation", title: "Reconciliation", desc: "支付网关对账", icon: Banknote },
  { id: "cost", title: "Cost Center", desc: "成本中心", icon: TrendingUp },
  { id: "ai", title: "AI Margin", desc: "AI 成本与毛利", icon: Bot },
  { id: "payout", title: "Payout Control", desc: "佣金与提现风控", icon: HandCoins },
  { id: "reports", title: "Reports", desc: "财务报表导出", icon: Download }
] as const;

type FinanceTab = (typeof financeTabs)[number]["id"];
const orderTabs = ["All", "Product Orders", "Course Orders", "Credit Top-up", "Subscription", "AI Reports", "Agent Packages"] as const;
type OrderTab = (typeof orderTabs)[number];
type OrderRecord = (typeof orders)[number];
type InventoryProduct = (typeof inventoryProducts)[number];
type ProductDraft = {
  sku: string;
  product: string;
  category: string;
  image: string;
  description: string;
  stock: string;
  cost: string;
  price: string;
  threshold: string;
};

const emptyProductDraft: ProductDraft = {
  sku: "",
  product: "",
  category: "",
  image: "",
  description: "",
  stock: "",
  cost: "",
  price: "",
  threshold: ""
};

type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: string;
  status: "Active" | "Frozen";
  points: number;
  birth: string;
  gender: string;
  team: string;
  aiUsage: string;
  referralCode: string;
  sponsorCode: string;
  referralSource: string;
};

const userSeed: AdminUserRecord[] = [];

type AdminProfilePayload = {
  id: string;
  email: string;
  credit_balance: number;
  membership_tier: "free" | "tactical" | "strategic" | string;
  full_name: string;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_time: string | null;
  referral_code?: string;
  sponsor_code?: string;
  referral_source?: string;
};

function membershipLabel(tier: string) {
  if (tier === "strategic") return "高阶战略版";
  if (tier === "tactical") return "进阶会员版";
  return tier && tier !== "free" ? tier : "Free";
}

function profileToAdminUser(profile: AdminProfilePayload): AdminUserRecord {
  return {
    id: profile.id,
    name: profile.full_name || profile.email.split("@")[0] || "未命名会员",
    email: profile.email,
    phone: profile.phone || "-",
    tier: membershipLabel(profile.membership_tier),
    status: "Active",
    points: profile.credit_balance || 0,
    birth: profile.birth_date ? `${profile.birth_date}${profile.birth_time ? ` ${profile.birth_time}` : ""}` : "未填写",
    gender: profile.gender || "未填写",
    team: "读取推荐关系中",
    aiUsage: "待接入 AI usage ledger",
    referralCode: profile.referral_code || "-",
    sponsorCode: profile.sponsor_code || "HQ001",
    referralSource: profile.referral_source || "organic_hq"
  };
}

const creditPackageSeed = [
  { name: "入门补充包", price: "RM30", points: 300, bonus: 0, status: "Active" },
  { name: "报告生成包", price: "RM88", points: 900, bonus: 80, status: "Active" },
  { name: "顾问高频包", price: "RM188", points: 2100, bonus: 300, status: "Active" }
];

const aiFeatureSeed = [
  { name: "普通 AI 问答", points: 1, tier: "Free+", status: "Enabled" },
  { name: "紫微 + 梅花深度分析", points: 12, tier: "进阶会员版", status: "Enabled" },
  { name: "三数起卦决策", points: 36, tier: "进阶会员版", status: "Enabled" },
  { name: "八字命理测算完整报告", points: 380, tier: "付费报告", status: "Enabled" },
  { name: "梅花易数测算完整报告", points: 260, tier: "付费报告", status: "Enabled" },
  { name: "紫微斗数命盘详细解析报告", points: 420, tier: "付费报告", status: "Enabled" },
  { name: "数字命理测算完整报告", points: 220, tier: "付费报告", status: "Enabled" },
  { name: "生成完整 PDF 报告", points: 120, tier: "高阶战略版", status: "Enabled" },
  { name: "生成意图符印", points: 88, tier: "进阶会员版", status: "Enabled" }
];

const courseSeed = [
  { id: "CRS-001", title: "八字基础入门课", type: "线上课程", price: "RM399", seats: 120, enrolled: 68, status: "Published", points: 200 },
  { id: "CRS-002", title: "家居风水实战营", type: "直播课", price: "RM1,288", seats: 60, enrolled: 42, status: "Published", points: 800 },
  { id: "CRS-003", title: "高阶导师认证班", type: "线下课程", price: "RM8,888", seats: 24, enrolled: 11, status: "Draft", points: 5000 }
];

const agentPackageSeed = [
  { name: "8888 创业启动包", price: "RM8,888", points: 8888, tier: "AI Pro", commission: "20% / 10% / 5%", poolShare: "15% 池", status: "Active" },
  { name: "16888 事业合伙人", price: "RM16,888", points: 18888, tier: "AI Master", commission: "25% / 10% / 5%", poolShare: "35% 池", status: "Active" },
  { name: "38888 区域导师", price: "RM38,888", points: 48888, tier: "Regional", commission: "30% / 12% / 6%", poolShare: "50% 池", status: "Draft" }
];

const paymentReviewSeed: {
  id: string;
  user: string;
  order: string;
  amount: string;
  method: string;
  status: string;
  proof: string;
}[] = [];

const poolParticipantSeed: {
  id: string;
  name: string;
  email: string;
  packageName: string;
  status: string;
  joinedAt: string;
  activity: string;
}[] = [];

const poolTiers = [
  { packageName: "38888 区域导师", share: 50, label: "区域导师池" },
  { packageName: "16888 事业合伙人", share: 35, label: "事业合伙人池" },
  { packageName: "8888 创业启动包", share: 15, label: "创业启动包池" }
];

const ceoCashSnapshot = [
  { label: "今日实收现金", value: "RM0", note: "已入账 / 不含待审转账" },
  { label: "本月销售额", value: "RM0", note: "订阅、报告、课程、产品、配套" },
  { label: "AI 成本", value: "RM0", note: "本月 OpenAI / Gemini 估算" },
  { label: "Pool Share 总池", value: "RM0", note: "待月结审批" }
] as const;

const ceoRiskQueue: {
  title: string;
  count: string;
  module: string;
  priority: string;
  desc: string;
}[] = [];

const ceoOperatingChecklist = [
  { title: "确认今日收款与订单差异", module: "finance" },
  { title: "导出会计对账包给 accountant", module: "accounting" },
  { title: "处理支付审核与异常订单", module: "payments" },
  { title: "检查 AI 成本和报告生成失败", module: "ai" },
  { title: "审批佣金 / Pool Share 前先看退款", module: "pool" },
  { title: "查看创业配套成交和团队归属", module: "agents" }
] as const;

function formatRM(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "RM0";
  return trimmed.toUpperCase().startsWith("RM") ? trimmed : `RM${trimmed}`;
}

function parseMoney(value: string) {
  return Number(value.replace(/[^\d.]/g, "")) || 0;
}

function formatMoney(value: number) {
  return `RM${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function inventoryStatus(stock: number, threshold: number) {
  if (stock <= 0) return "Out of stock";
  if (stock <= threshold) return "Low stock";
  return "In stock";
}

function statusTone(status: string) {
  if (["Paid", "Completed", "Approved", "In stock", "Active", "Published", "Eligible", "Locked"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["Matched", "Enabled", "Required", "Points issued", "Course opened"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["Pending", "Pending Review", "Processing", "Low stock", "Generating report", "On hold", "Hold", "Reserved", "Packing", "Calculated"].includes(status)) {
    return "bg-amber-50 text-amber-700";
  }

  if (["Out of stock", "Mismatch", "Flagged", "Deduction failed", "High", "Frozen", "Rejected"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  if (["Medium"].includes(status)) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-cloud text-ink/70";
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}>{status}</span>;
}

function csvEscape(value: string | number) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function downloadCsv(fileName: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function ModuleCard({
  module,
  active,
  onClick
}: {
  module: (typeof moduleTabs)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group rounded border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft",
        active ? "border-[#C79A54] bg-[#063F4A] text-white" : "border-black/10 bg-white text-ink hover:border-[#C79A54]/60"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={active ? "grid size-11 place-items-center rounded bg-white/10 text-[#C79A54]" : "grid size-11 place-items-center rounded bg-[#DDEFF2] text-[#063F4A]"}>
          <Icon className="size-5" />
        </span>
        <ChevronRight className={active ? "size-5 text-[#C79A54]" : "size-5 text-ink/30 transition group-hover:translate-x-1 group-hover:text-[#063F4A]"} />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{module.stat}</p>
      <h3 className="mt-2 text-xl font-semibold">{module.title}</h3>
      <p className={active ? "mt-2 text-sm leading-6 text-white/68" : "mt-2 text-sm leading-6 text-ink/58"}>{module.desc}</p>
    </button>
  );
}

function SectionFrame({
  eyebrow,
  title,
  desc,
  action,
  children
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/58">{desc}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CeoOverviewModule({ onOpenModule }: { onOpenModule: (module: ActiveModule) => void }) {
  return (
    <div className="grid gap-5">
      <SectionFrame
        eyebrow="Executive Command"
        title="CEO 经营总览"
        desc="老板每天先看现金、异常、风控和待审批事项，再进入对应模块处理。"
        action={<StatusPill>今日必看</StatusPill>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ceoCashSnapshot.map((item) => (
            <article key={item.label} className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-5">
              <p className="text-sm text-ink/50">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#063F4A]">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-ink/55">{item.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-[#063F4A]">经营异常队列</h3>
                <p className="mt-1 text-sm text-ink/55">这里优先处理会影响现金、佣金和履约的事项。</p>
              </div>
              <AlertTriangle className="size-6 text-[#C79A54]" />
            </div>
            <div className="mt-4 grid gap-3">
              {ceoRiskQueue.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onOpenModule(item.module as ActiveModule)}
                  className="grid gap-3 rounded border border-black/10 bg-[#F5FAFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm sm:grid-cols-[auto_1fr_auto]"
                >
                  <span className="grid size-10 place-items-center rounded bg-white text-xl font-semibold text-[#063F4A]">{item.count}</span>
                  <span>
                    <span className="block font-semibold text-ink">{item.title}</span>
                    <span className="mt-1 block text-sm leading-5 text-ink/55">{item.desc}</span>
                  </span>
                  <StatusBadge status={item.priority} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Daily Control</p>
                <h3 className="mt-2 text-2xl font-semibold">今日管理动作</h3>
              </div>
              <ShieldCheck className="size-7 text-[#C79A54]" />
            </div>
            <div className="mt-5 grid gap-3">
              {ceoOperatingChecklist.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onOpenModule(item.module as ActiveModule)}
                  className="flex items-center gap-3 rounded border border-white/10 bg-white/8 p-3 text-left transition hover:border-[#C79A54]/60 hover:bg-white/12"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded bg-[#C79A54] text-sm font-semibold text-[#063F4A]">{index + 1}</span>
                  <span className="text-sm font-semibold leading-5 text-white/88">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionFrame>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Revenue Mix</p>
          <h3 className="mt-2 text-xl font-semibold text-[#063F4A]">收入结构</h3>
          <div className="mt-4 grid gap-3">
            {revenueBreakdown.slice(0, 5).map((item) => (
              <div key={item.source} className="rounded border border-black/10 bg-[#F5FAFA] p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">{item.source}</span>
                  <span className="text-[#063F4A]">{item.amount}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-[#1495A0]" style={{ width: item.pct }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Order Health</p>
          <h3 className="mt-2 text-xl font-semibold text-[#063F4A]">订单健康度</h3>
          <div className="mt-4 grid gap-3">
            {orderKpis.slice(0, 5).map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded border border-black/10 bg-[#F5FAFA] p-3">
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="text-xs text-ink/50">{item.note}</span>
                </span>
                <span className="font-semibold text-[#063F4A]">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Approval</p>
          <h3 className="mt-2 text-xl font-semibold text-[#063F4A]">待审批事项</h3>
          <div className="mt-4 grid gap-3">
            {[
              ["佣金待批", "RM0", "finance"],
              ["提现待批", "0 requests", "finance"],
              ["Pool Share", "RM0", "pool"],
              ["手动转账", "0 payments", "payments"]
            ].map(([label, value, module]) => (
              <button key={label} type="button" onClick={() => onOpenModule(module as ActiveModule)} className="flex items-center justify-between gap-3 rounded border border-black/10 bg-[#F5FAFA] p-3 text-left transition hover:border-[#C79A54]/60">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-sm font-semibold text-[#063F4A]">{value}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountingExportModule() {
  const chartOfAccountsRows = [
    { Code: "1000", Account: "Cash / Bank", Type: "Asset", Usage: "银行入账、FPX、Stripe 结算后现金" },
    { Code: "1100", Account: "Payment Gateway Clearing", Type: "Asset", Usage: "Stripe / FPX / e-wallet 未结算金额" },
    { Code: "1200", Account: "Accounts Receivable", Type: "Asset", Usage: "已开单但未收款订单" },
    { Code: "1300", Account: "Inventory", Type: "Asset", Usage: "产品库存成本" },
    { Code: "2000", Account: "Commission Payable", Type: "Liability", Usage: "待发放佣金" },
    { Code: "2100", Account: "Partner Pool Payable", Type: "Liability", Usage: "Pool Share 待发放金额" },
    { Code: "2200", Account: "Deferred Revenue", Type: "Liability", Usage: "课程、订阅、点数未履约部分" },
    { Code: "2300", Account: "SST / Tax Payable", Type: "Liability", Usage: "SST / 税务预留科目" },
    { Code: "4000", Account: "Subscription Revenue", Type: "Revenue", Usage: "会员订阅收入" },
    { Code: "4100", Account: "Credit Top-up Revenue", Type: "Revenue", Usage: "点数充值收入" },
    { Code: "4200", Account: "Product Sales Revenue", Type: "Revenue", Usage: "产品商城收入" },
    { Code: "4300", Account: "Course Sales Revenue", Type: "Revenue", Usage: "课程收入" },
    { Code: "4400", Account: "AI Reports Revenue", Type: "Revenue", Usage: "AI 报告收入" },
    { Code: "4500", Account: "Agent Package Revenue", Type: "Revenue", Usage: "创业配套收入" },
    { Code: "5000", Account: "Cost of Goods Sold", Type: "Expense", Usage: "产品销售成本" },
    { Code: "5100", Account: "AI API Cost", Type: "Expense", Usage: "OpenAI / Gemini API 成本" },
    { Code: "5200", Account: "Commission Expense", Type: "Expense", Usage: "三层佣金成本" },
    { Code: "5300", Account: "Partner Pool Expense", Type: "Expense", Usage: "业绩共享池成本" },
    { Code: "5400", Account: "Payment Gateway Fees", Type: "Expense", Usage: "Stripe / FPX / 本地网关手续费" }
  ];

  const salesJournalRows = orders.map((order) => ({
    Date: order.createdAt,
    OrderID: order.id,
    Customer: order.customer,
    Source: order.type,
    PaymentMethod: order.paymentMethod,
    Status: order.status,
    DebitAccount: order.paymentStatus === "Paid" ? "Bank / Payment Gateway Clearing" : "Accounts Receivable",
    CreditAccount: order.type === "Agent Packages" ? "Agent Package Revenue" : `${order.type} Revenue`,
    AmountMYR: order.amount.replace("RM", ""),
    TaxCode: "SST-TBC",
    EInvoiceStatus: order.paymentStatus === "Paid" ? "Ready for MyInvois" : "Hold"
  }));

  const commissionPayableRows = commissionRecords.map((record) => ({
    CommissionID: record.id,
    Agent: record.agent,
    Source: record.source,
    Status: record.status,
    DebitAccount: "Commission Expense",
    CreditAccount: "Commission Payable",
    AmountMYR: record.amount.replace("RM", ""),
    HoldPeriod: "14 days",
    Clawback: record.status === "Paid" ? "Closed" : "Enabled"
  }));

  const inventoryRows = inventoryProducts.map((product) => ({
    SKU: product.sku,
    Product: product.product,
    Category: product.category,
    StockQty: product.stock,
    CostMYR: product.cost,
    SellingPriceMYR: product.price,
    InventoryValueMYR: formatMoney(parseMoney(product.cost) * product.stock),
    DebitAccount: "Inventory",
    COGSAccount: "Cost of Goods Sold",
    Status: product.status
  }));

  const aiCostRows = aiCostRecords.map((record) => ({
    UserID: record.userId,
    Requests: record.requests,
    AvgCostMYR: record.avgCost.replace("RM", ""),
    DailyCostMYR: record.daily.replace("RM", ""),
    MonthlyCostMYR: record.monthly.replace("RM", ""),
    DebitAccount: "AI API Cost",
    CreditAccount: "Accrued Platform Cost"
  }));

  const poolShareRows: {
    Period: string;
    PoolName: string;
    PoolRate: string;
    PoolAmountMYR: string;
    DebitAccount: string;
    CreditAccount: string;
    Status: string;
    Note: string;
  }[] = [];

  const doubleEntryRows = [
    ...orders.flatMap((order) => {
      const amount = order.amount.replace("RM", "");
      const revenueAccount = order.type === "Agent Packages" ? "4500 Agent Package Revenue" : `${order.type} Revenue`;
      return [
        {
          Date: order.createdAt,
          JournalID: `JE-${order.id}-DR`,
          Source: order.id,
          Line: "Debit",
          Account: order.paymentStatus === "Paid" ? "1100 Payment Gateway Clearing" : "1200 Accounts Receivable",
          DebitMYR: amount,
          CreditMYR: "0",
          Memo: `${order.type} order from ${order.customer}`
        },
        {
          Date: order.createdAt,
          JournalID: `JE-${order.id}-CR`,
          Source: order.id,
          Line: "Credit",
          Account: revenueAccount,
          DebitMYR: "0",
          CreditMYR: amount,
          Memo: `${order.type} revenue recognition`
        }
      ];
    }),
    ...commissionRecords.flatMap((record) => {
      const amount = record.amount.replace("RM", "");
      return [
        {
          Date: "2026-05",
          JournalID: `JE-${record.id}-DR`,
          Source: record.id,
          Line: "Debit",
          Account: "5200 Commission Expense",
          DebitMYR: amount,
          CreditMYR: "0",
          Memo: `${record.agent} commission from ${record.source}`
        },
        {
          Date: "2026-05",
          JournalID: `JE-${record.id}-CR`,
          Source: record.id,
          Line: "Credit",
          Account: "2000 Commission Payable",
          DebitMYR: "0",
          CreditMYR: amount,
          Memo: "Commission payable pending approval / payout"
        }
      ];
    })
  ];

  const bankReconciliationRows = paymentReconciliation.map((row) => ({
    Gateway: row.gateway,
    PlatformOrdersMYR: row.orders.replace("RM", ""),
    GatewayReceivedMYR: row.received.replace("RM", ""),
    GatewayFeeMYR: row.fee.replace("RM", ""),
    NetSettledMYR: row.net.replace("RM", ""),
    SettlementDate: row.settlement,
    Status: row.status,
    Action: row.status === "Mismatch" ? "Investigate before revenue close" : "Ready to close"
  }));

  const eInvoiceRows = orders.map((order) => ({
    OrderID: order.id,
    Customer: order.customer,
    AmountMYR: order.amount.replace("RM", ""),
    Source: order.type,
    BuyerTIN: "Required before submission",
    IDType: "NRIC / Passport / BRN",
    SSTCode: "TBC",
    MyInvoisStatus: order.paymentStatus === "Paid" ? "Ready" : "Hold",
    SubmissionMode: "CSV now / API later"
  }));

  const auditTrailRows: {
    Time: string;
    Actor: string;
    Action: string;
    Entity: string;
    Before: string;
    After: string;
  }[] = [];

  const exportPacks: {
    title: string;
    desc: string;
    rows: Record<string, string | number>[];
    fileName: string;
    total: string;
  }[] = [
    {
      title: "Sales Journal",
      desc: "订单收入、支付方式、收入科目、e-Invoice 状态",
      rows: salesJournalRows,
      fileName: "sales-journal-export.csv",
      total: `${salesJournalRows.length} rows`
    },
    {
      title: "Chart of Accounts",
      desc: "系统建议会计科目表，后续可映射到 SQL Accounting / AutoCount / Xero",
      rows: chartOfAccountsRows,
      fileName: "chart-of-accounts-export.csv",
      total: `${chartOfAccountsRows.length} accounts`
    },
    {
      title: "Double Entry Journal",
      desc: "把订单、佣金、Pool Share 转成 Debit / Credit 预览",
      rows: doubleEntryRows,
      fileName: "double-entry-journal-export.csv",
      total: `${doubleEntryRows.length} journal lines`
    },
    {
      title: "Bank Reconciliation",
      desc: "平台订单、网关收款、手续费、净结算与差异检查",
      rows: bankReconciliationRows,
      fileName: "bank-reconciliation-export.csv",
      total: `${bankReconciliationRows.length} gateways`
    },
    {
      title: "SST / e-Invoice Mapping",
      desc: "MyInvois 前置字段、Buyer TIN、税码与提交状态",
      rows: eInvoiceRows,
      fileName: "einvoice-mapping-export.csv",
      total: `${eInvoiceRows.length} orders`
    },
    {
      title: "Audit Trail",
      desc: "关键财务动作的不可删除审计记录样板",
      rows: auditTrailRows,
      fileName: "audit-trail-export.csv",
      total: `${auditTrailRows.length} logs`
    },
    {
      title: "Commission Payable",
      desc: "佣金应付、hold period、退款追回状态",
      rows: commissionPayableRows,
      fileName: "commission-payable-export.csv",
      total: `${commissionPayableRows.length} rows`
    },
    {
      title: "Inventory & COGS",
      desc: "库存、成本价、销售价、库存价值与 COGS 科目",
      rows: inventoryRows,
      fileName: "inventory-cogs-export.csv",
      total: `${inventoryRows.length} SKU`
    },
    {
      title: "AI Cost Ledger",
      desc: "AI 请求成本、用户用量、平台成本科目",
      rows: aiCostRows,
      fileName: "ai-cost-ledger-export.csv",
      total: `${aiCostRows.length} users`
    },
    {
      title: "Pool Share Payable",
      desc: "业绩共享池总额、应付科目、审批状态",
      rows: poolShareRows,
      fileName: "pool-share-payable-export.csv",
      total: `${poolShareRows.length} pool`
    }
  ];

  const [ledgerStatus, setLedgerStatus] = useState<"checking" | "ready" | "missing" | "error">("checking");
  const [ledgerMessage, setLedgerMessage] = useState("正在检查 Supabase ledger 表。");
  const [ledgerSummary, setLedgerSummary] = useState({ accounts: 0, journals: 0, lines: 0, auditLogs: 0 });
  const [isPostingJournal, setIsPostingJournal] = useState(false);

  async function getAdminAccessToken() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session }
    } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    return session?.access_token || "";
  }

  async function refreshLedgerStatus() {
    const token = await getAdminAccessToken();

    if (!token) {
      setLedgerStatus("error");
      setLedgerMessage("请先用管理员账号登录，后台才能读取真实 ledger。");
      return;
    }

    setLedgerStatus("checking");

    try {
      const response = await fetch("/api/admin/accounting/ledger", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Ledger 检查失败。");
      }

      setLedgerSummary({
        accounts: payload.accounts?.length || 0,
        journals: payload.journals?.length || 0,
        lines: payload.lines?.length || 0,
        auditLogs: payload.auditLogs?.length || 0
      });
      setLedgerStatus(payload.configured === false ? "missing" : "ready");
      setLedgerMessage(
        payload.configured === false
          ? payload.message
          : "真实数据库 ledger 已可读取，可开始记录双分录、审计日志与后续会计软件同步。"
      );
    } catch (error) {
      setLedgerStatus("error");
      setLedgerMessage(error instanceof Error ? error.message : "Ledger 检查失败。");
    }
  }

  async function postRevenueJournal() {
    const token = await getAdminAccessToken();

    if (!token) {
      setLedgerStatus("error");
      setLedgerMessage("请先用管理员账号登录。");
      return;
    }

    setIsPostingJournal(true);
    setLedgerMessage("正在写入收入双分录凭证。");

    try {
      const response = await fetch("/api/admin/accounting/ledger", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sourceModule: "ai_report",
          sourceId: `DEMO-${Date.now()}`,
          description: "AI 深度报告收入凭证",
          lines: [
            {
              accountCode: "1100",
              accountName: "Payment Gateway Clearing",
              debit: 188,
              credit: 0,
              memo: "AI report paid via gateway"
            },
            {
              accountCode: "4400",
              accountName: "AI Reports Revenue",
              debit: 0,
              credit: 188,
              memo: "Recognize AI report revenue"
            }
          ]
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "收入凭证写入失败。");
      }

      setLedgerMessage(`已写入 ${payload.journal?.journal_no || "收入凭证"}，Debit/Credit 平衡。`);
      await refreshLedgerStatus();
    } catch (error) {
      setLedgerStatus("error");
      setLedgerMessage(error instanceof Error ? error.message : "收入凭证写入失败。");
    } finally {
      setIsPostingJournal(false);
    }
  }

  useEffect(() => {
    void refreshLedgerStatus();
  }, []);

  function exportAll() {
    exportPacks.forEach((pack) => downloadCsv(pack.fileName, pack.rows));
  }

  return (
    <SectionFrame
      eyebrow="Accounting Bridge"
      title="Accounting Export 会计导出中心"
      desc="这里不是完整会计软件，而是把业务系统数据整理成会计可导入的 journal / ledger / payable CSV，方便接 SQL Accounting、AutoCount、Xero、Bukku 或交给 accountant。"
      action={
        <button type="button" onClick={exportAll} className="inline-flex items-center gap-2 rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white">
          <Download className="size-4" /> Export all CSV
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">上市前建议口径</h3>
          <div className="mt-4 grid gap-3">
            {[
              ["业务系统", "订单、会员、点数、佣金、Pool、库存、AI 成本"],
              ["会计系统", "总账、双分录、税务、银行对账、审计报表"],
              ["同步方式", "CSV / Excel 导出，未来可做 API integration"],
              ["审计重点", "每笔金额都要有订单号、审批人、时间与来源"]
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-black/10 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C79A54]">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded border border-[#C79A54]/30 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C79A54]">Real Ledger</p>
                <h4 className="mt-1 text-lg font-semibold text-[#063F4A]">数据库账本状态</h4>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  ledgerStatus === "ready"
                    ? "bg-emerald-50 text-emerald-700"
                    : ledgerStatus === "missing"
                      ? "bg-amber-50 text-amber-800"
                      : ledgerStatus === "checking"
                        ? "bg-[#DDEFF2] text-[#063F4A]"
                        : "bg-red-50 text-red-700"
                }`}
              >
                {ledgerStatus === "ready" ? "Ready" : ledgerStatus === "missing" ? "SQL Required" : ledgerStatus === "checking" ? "Checking" : "Action Needed"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {[
                ["Accounts", ledgerSummary.accounts],
                ["Journals", ledgerSummary.journals],
                ["Lines", ledgerSummary.lines],
                ["Audit Logs", ledgerSummary.auditLogs]
              ].map(([label, value]) => (
                <div key={label} className="rounded bg-[#F5FAFA] p-3">
                  <p className="text-xs text-ink/50">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-[#063F4A]">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/65">{ledgerMessage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={postRevenueJournal}
                disabled={isPostingJournal || ledgerStatus === "missing"}
                className="rounded-full bg-[#1495A0] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/20"
              >
                {isPostingJournal ? "写入中..." : "生成收入凭证"}
              </button>
              <button
                type="button"
                onClick={refreshLedgerStatus}
                className="rounded-full border border-[#063F4A]/15 px-4 py-2 text-sm font-semibold text-[#063F4A]"
              >
                刷新状态
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {exportPacks.map((pack) => {
            const previewHeaders = pack.rows[0] ? Object.keys(pack.rows[0]).slice(0, 5) : [];

            return (
              <article key={pack.title} className="rounded border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C79A54]">{pack.total}</p>
                    <h3 className="mt-2 text-xl font-semibold text-[#063F4A]">{pack.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{pack.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCsv(pack.fileName, pack.rows)}
                    disabled={!pack.rows.length}
                    className="inline-flex items-center gap-2 rounded-full border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2 text-sm font-semibold text-[#063F4A] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="size-4" /> CSV
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto rounded border border-black/10 bg-[#F5FAFA]">
                  {previewHeaders.length ? (
                    <table className="w-full min-w-[760px] text-left text-xs">
                      <thead className="bg-white text-ink/50">
                        <tr>
                          {previewHeaders.map((header) => (
                            <th key={header} className="px-3 py-2 font-medium">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10">
                        {pack.rows.slice(0, 2).map((row, index) => (
                          <tr key={`${pack.title}-${index}`}>
                            {previewHeaders.map((header) => (
                              <td key={header} className="px-3 py-2 text-ink/65">{row[header]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-ink/50">
                      暂无可导出数据。正式订单、佣金、库存或 AI 成本产生后，这里会自动显示预览。
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        已建立基础会计导出口径：Chart of Accounts、Double Entry Journal、Bank Reconciliation、SST/e-Invoice mapping 与 Audit Trail。下一阶段可把这些 CSV 导出升级为真实数据库 ledger 与会计软件 API sync。
      </div>
    </SectionFrame>
  );
}

function UsersModule() {
  const [users, setUsers] = useState<AdminUserRecord[]>(userSeed);
  const [selectedId, setSelectedId] = useState(userSeed[0]?.id ?? "");
  const [saveMessage, setSaveMessage] = useState("正在读取真实会员资料...");
  const [isSavingUser, setIsSavingUser] = useState(false);
  const selectedUser = users.find((user) => user.id === selectedId) ?? users[0];

  async function getAccessToken() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session }
    } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    return session?.access_token || "";
  }

  function updateSelectedUser(patch: Partial<AdminUserRecord>) {
    if (!selectedUser) return;
    setUsers((current) => current.map((user) => (user.id === selectedUser.id ? { ...user, ...patch } : user)));
  }

  useEffect(() => {
    let mounted = true;
    const emails = userSeed.map((user) => user.email).join(",");

    async function loadSupabaseCredits() {
      try {
        const token = await getAccessToken();
        const url = emails ? `/api/admin/credits?emails=${encodeURIComponent(emails)}` : "/api/admin/credits";
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        const data = (await response.json()) as {
          error?: string;
          profiles?: AdminProfilePayload[];
        };

        if (!response.ok) {
          throw new Error(data.error || "读取会员资料失败。");
        }

        if (!mounted) return;

        if (!data.profiles?.length) {
          setUsers([]);
          setSelectedId("");
          setSaveMessage("目前还没有会员资料。新会员注册后会显示在这里。");
          return;
        }

        const loadedUsers = data.profiles.map(profileToAdminUser);

        setUsers(loadedUsers);
        setSelectedId((current) => (loadedUsers.some((user) => user.id === current) ? current : loadedUsers[0].id));
        setSaveMessage("点数保存后会同步到会员中心。");
      } catch {
        if (mounted) {
          setSaveMessage("目前读取不到真实点数资料，请确认你使用管理员账号登录。");
        }
      }
    }

    loadSupabaseCredits();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveSelectedUserCredits() {
    if (!selectedUser) {
      setSaveMessage("请选择一个会员后再保存点数。");
      return;
    }

    setIsSavingUser(true);
      setSaveMessage("正在保存点数...");

    try {
      const response = await fetch("/api/admin/credits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          email: selectedUser.email,
          creditBalance: selectedUser.points,
          source: "admin_user_module",
          description: `Admin 后台调整 ${selectedUser.name} 点数`
        })
      });
      const data = (await response.json()) as { error?: string; profile?: { credit_balance: number } };

      if (!response.ok) {
        throw new Error(data.error || "点数保存失败。");
      }

      if (data.profile) {
        updateSelectedUser({ points: data.profile.credit_balance });
      }
      setSaveMessage(`已保存：${selectedUser.email} 当前 ${data.profile?.credit_balance ?? selectedUser.points} 点。`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "点数保存失败。");
    } finally {
      setIsSavingUser(false);
    }
  }

  return (
    <SectionFrame
      eyebrow="User Operations"
      title="用户管理"
      desc="查看会员资料、生日时辰、等级、点数余额、团队和 AI 使用记录，并可直接调整会员状态。"
      action={<StatusPill>{users.length} 位会员</StatusPill>}
    >
      {!selectedUser ? (
        <div className="rounded border border-dashed border-black/15 bg-[#F5FAFA] p-8 text-center">
          <p className="text-lg font-semibold text-[#063F4A]">暂无会员资料</p>
          <p className="mt-2 text-sm text-ink/55">{saveMessage}</p>
        </div>
      ) : (
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border border-black/10 bg-[#F5FAFA] p-4">
          <div className="flex items-center gap-3">
            <Search className="size-5 text-[#063F4A]" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="搜索姓名 / Email / User ID" />
          </div>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={[
                  "w-full rounded border p-4 text-left transition",
                  selectedUser.id === user.id ? "border-[#C79A54] bg-[#063F4A] text-white" : "border-black/10 bg-white hover:border-[#C79A54]/60"
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className={selectedUser.id === user.id ? "mt-1 text-xs text-white/62" : "mt-1 text-xs text-ink/50"}>{user.email}</p>
                  </div>
                  <StatusBadge status={user.status} />
                </div>
                <p className={selectedUser.id === user.id ? "mt-3 text-sm text-[#C79A54]" : "mt-3 text-sm text-[#063F4A]"}>{user.tier} · {user.points} 点</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C79A54]">{selectedUser.id}</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#063F4A]">{selectedUser.name}</h3>
              <p className="mt-1 text-sm text-ink/55">{selectedUser.email} · {selectedUser.phone}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSelectedUser({ status: selectedUser.status === "Active" ? "Frozen" : "Active" })}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-[#063F4A]"
            >
              {selectedUser.status === "Active" ? "冻结账号" : "恢复账号"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["生日时辰", selectedUser.birth],
              ["性别", selectedUser.gender],
              ["团队结构", selectedUser.team],
              ["AI 使用", selectedUser.aiUsage],
              ["推荐码", selectedUser.referralCode],
              ["上级 Sponsor", selectedUser.sponsorCode],
              ["推荐来源", selectedUser.referralSource === "member_referral" ? "会员推荐" : selectedUser.referralSource === "organic_hq" ? "总部自然流量" : "无效推荐码归属 HQ001"]
            ].map(([label, value]) => (
              <div key={label} className="rounded bg-[#F5FAFA] p-4">
                <p className="text-xs text-ink/45">{label}</p>
                <p className="mt-1 font-semibold text-[#063F4A]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="rounded border border-black/10 p-3">
              <span className="text-xs text-ink/45">会员等级</span>
              <select value={selectedUser.tier} onChange={(event) => updateSelectedUser({ tier: event.target.value })} className="mt-2 w-full bg-transparent font-semibold outline-none">
                {["Free", "进阶会员版", "高阶战略版", "8888 创业启动包", "16888 事业合伙人", "38888 区域导师"].map((tier) => (
                  <option key={tier}>{tier}</option>
                ))}
              </select>
            </label>
            <label className="rounded border border-black/10 p-3">
              <span className="text-xs text-ink/45">点数余额</span>
              <input
                type="number"
                value={selectedUser.points}
                onChange={(event) => updateSelectedUser({ points: Number(event.target.value) })}
                className="mt-2 w-full bg-transparent text-xl font-semibold text-[#063F4A] outline-none"
              />
            </label>
            <button
              type="button"
              onClick={saveSelectedUserCredits}
              disabled={isSavingUser}
              className="rounded bg-[#063F4A] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingUser ? "保存中..." : "保存点数"}
            </button>
          </div>
          <p className="mt-4 rounded bg-[#F5FAFA] px-4 py-3 text-sm text-ink/58">{saveMessage}</p>
        </div>
      </div>
      )}
    </SectionFrame>
  );
}

function CreditsModule() {
  const [packages, setPackages] = useState(creditPackageSeed);
  const [draft, setDraft] = useState({ name: "", price: "", points: "", bonus: "" });

  function addPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setPackages((current) => [
      ...current,
      { name: draft.name, price: formatRM(draft.price), points: Number(draft.points) || 0, bonus: Number(draft.bonus) || 0, status: "Active" }
    ]);
    setDraft({ name: "", price: "", points: "", bonus: "" });
  }

  return (
    <SectionFrame
      eyebrow="Credit Wallet Control"
      title="点数管理"
      desc="配置充值套餐、注册奖励、推荐奖励、产品/课程赠点和功能扣点规则。点数只用于平台功能，不能提现。"
      action={<StatusPill>Wallet rules</StatusPill>}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">充值套餐</h3>
          <div className="mt-4 space-y-3">
            {packages.map((item, index) => (
              <div key={`${item.name}-${index}`} className="grid gap-3 rounded border border-black/10 p-4 md:grid-cols-[1fr_0.8fr_0.8fr_0.6fr]">
                <input value={item.name} onChange={(event) => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="font-semibold outline-none" />
                <input value={item.price} onChange={(event) => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} className="text-[#063F4A] outline-none" />
                <input type="number" value={item.points} onChange={(event) => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, points: Number(event.target.value) } : row))} className="outline-none" />
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
          <form onSubmit={addPackage} className="mt-5 grid gap-3 rounded bg-[#F5FAFA] p-4 md:grid-cols-5">
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="套餐名" className="rounded border border-black/10 px-3 py-2 outline-none md:col-span-2" />
            <input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="价格" className="rounded border border-black/10 px-3 py-2 outline-none" />
            <input value={draft.points} onChange={(event) => setDraft({ ...draft, points: event.target.value })} placeholder="点数" className="rounded border border-black/10 px-3 py-2 outline-none" />
            <button className="rounded bg-[#1495A0] px-4 py-2 font-semibold text-white">新增</button>
          </form>
        </div>

        <div className="space-y-4">
          {[
            ["注册奖励", "新会员完成资料后赠 80 点"],
            ["每日赠送", "Free 每日 3 点，Plus 每日 12 点"],
            ["推荐奖励", "直接推荐注册赠 30 点，成交再按订单规则发放"],
            ["点数有效期", "充值点数 365 天，赠送点数 90 天"],
            ["扣点失败", "余额不足时引导充值，不执行 AI 请求"]
          ].map(([title, desc]) => (
            <div key={title} className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-4">
              <p className="font-semibold text-[#063F4A]">{title}</p>
              <p className="mt-1 text-sm text-ink/58">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

function AiControlModule() {
  const [features, setFeatures] = useState(aiFeatureSeed);
  const [prompt, setPrompt] = useState("你是易玺老师的 AI 风水师助理。先用结构化命理数据判断，再用温和、实战、可执行的口吻输出建议。禁止制造恐惧，必须加入免责声明与行动建议。");
  const [baziPrompt, setBaziPrompt] = useState("你是易玺老师的八字命理报告助理。根据用户姓名、性别、公历/农历生日、出生时辰、出生地与问题重点，生成中文专业八字报告。输出必须包含四柱、藏干、十神、纳音、空亡、五行比例、喜用神、忌神、性格、事业财运、感情婚姻、健康倾向、大运、流年、评分与行动建议。语气稳重、文化参考、避免恐吓或绝对承诺，并固定加入免责声明。");
  const [meihuaPrompt, setMeihuaPrompt] = useState("你是易玺老师的梅花易数报告助理。根据用户资料、问题类别、具体问题、起卦时间、数字或时间起卦模式，生成中文专业梅花易数测算报告。必须解释起卦方式、本卦、变卦、动爻、体用关系、五行生克、时机预测、方位颜色与行动建议。不可制造恐惧，不可给绝对承诺，必须加入文化参考与非专业建议免责声明。");
  const [ziweiPrompt, setZiweiPrompt] = useState("你是易玺老师的紫微斗数命盘报告助理。根据用户姓名、性别、公历/农历生日、出生时辰、出生地与重点问题，生成中文专业紫微斗数报告。必须覆盖命宫、身宫、五行局、命主身主、十二宫、主星辅星、四化、大限、流年、重点星曜、评分与实际建议。不可声称绝对准确，不可制造恐惧，并固定加入文化参考与非专业建议免责声明。");
  const [numerologyPrompt, setNumerologyPrompt] = useState("你是易玺老师的数字命理报告助理。根据用户姓名、性别、出生日期、出生时间与问题重点，生成中文现代数字命理报告。必须解释生命路径数、命运数、灵魂渴望数、人格数、生日数、成熟数、个人年数、1-9 能量分布、人生周期、年度趋势、幸运指南和行动建议。不可绝对化，并固定加入文化参考与非专业建议免责声明。");
  const [sensitiveWords, setSensitiveWords] = useState("保证发财、百分百改命、医疗诊断、投资承诺");

  return (
    <SectionFrame
      eyebrow="AI Function Control"
      title="AI 功能管理"
      desc="集中管理每个 AI 功能的扣点、等级权限、Prompt 模板、敏感词和免责声明。"
      action={<button className="inline-flex items-center gap-2 rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white"><Save className="size-4" />保存配置</button>}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">功能扣点与权限</h3>
          <div className="mt-4 space-y-3">
            {features.map((feature, index) => (
              <div key={feature.name} className="grid gap-3 rounded border border-black/10 p-4 md:grid-cols-[1.2fr_0.5fr_0.8fr_0.6fr]">
                <input value={feature.name} onChange={(event) => setFeatures((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="font-semibold outline-none" />
                <input type="number" value={feature.points} onChange={(event) => setFeatures((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, points: Number(event.target.value) } : row))} className="text-[#063F4A] outline-none" />
                <input value={feature.tier} onChange={(event) => setFeatures((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, tier: event.target.value } : row))} className="outline-none" />
                <StatusBadge status={feature.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block rounded border border-black/10 bg-[#F5FAFA] p-4">
            <span className="font-semibold text-[#063F4A]">核心 Prompt 模板</span>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={7} className="mt-3 w-full rounded border border-black/10 bg-white p-3 text-sm leading-6 outline-none" />
          </label>
          <label className="block rounded border border-[#C79A54]/25 bg-white p-4">
            <span className="font-semibold text-[#063F4A]">八字付费报告 Prompt 模板</span>
            <p className="mt-1 text-xs leading-5 text-ink/50">后台可编辑报告生成口吻与结构；当前扣点在左侧功能表配置。</p>
            <textarea value={baziPrompt} onChange={(event) => setBaziPrompt(event.target.value)} rows={8} className="mt-3 w-full rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm leading-6 outline-none" />
          </label>
          <label className="block rounded border border-[#C79A54]/25 bg-white p-4">
            <span className="font-semibold text-[#063F4A]">梅花易数付费报告 Prompt 模板</span>
            <p className="mt-1 text-xs leading-5 text-ink/50">用于控制起卦解释、体用生克、动爻、时机与行动建议。</p>
            <textarea value={meihuaPrompt} onChange={(event) => setMeihuaPrompt(event.target.value)} rows={8} className="mt-3 w-full rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm leading-6 outline-none" />
          </label>
          <label className="block rounded border border-[#C79A54]/25 bg-white p-4">
            <span className="font-semibold text-[#063F4A]">紫微斗数付费报告 Prompt 模板</span>
            <p className="mt-1 text-xs leading-5 text-ink/50">用于控制十二宫、四化、大限、流年、星曜解释与建议口吻。</p>
            <textarea value={ziweiPrompt} onChange={(event) => setZiweiPrompt(event.target.value)} rows={8} className="mt-3 w-full rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm leading-6 outline-none" />
          </label>
          <label className="block rounded border border-[#C79A54]/25 bg-white p-4">
            <span className="font-semibold text-[#063F4A]">数字命理付费报告 Prompt 模板</span>
            <p className="mt-1 text-xs leading-5 text-ink/50">用于控制核心数字、能量图、年度趋势、幸运指南与现代建议。</p>
            <textarea value={numerologyPrompt} onChange={(event) => setNumerologyPrompt(event.target.value)} rows={8} className="mt-3 w-full rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm leading-6 outline-none" />
          </label>
          <label className="block rounded border border-black/10 bg-white p-4">
            <span className="font-semibold text-[#063F4A]">敏感词 / 高风险承诺</span>
            <textarea value={sensitiveWords} onChange={(event) => setSensitiveWords(event.target.value)} rows={3} className="mt-3 w-full rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm leading-6 outline-none" />
          </label>
          <div className="rounded border border-[#C79A54]/25 bg-[#DDEFF2] p-4 text-sm leading-6 text-ink/65">
            所有报告与聊天输出固定加入：命理分析仅作参考，不替代法律、医疗、投资、心理或财务专业意见。
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function FinanceModule() {
  const [activeFinanceTab, setActiveFinanceTab] = useState<FinanceTab>("revenue");

  return (
    <SectionFrame
      eyebrow="Finance Operations Center"
      title="专业财务经营中心"
      desc="不只是记录收入，而是做收入分析、支付对账、成本控制、AI 毛利、佣金风险和提现审核。"
      action={
        <button className="inline-flex items-center gap-2 rounded-full border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2 text-sm font-semibold text-[#063F4A]">
          <Download className="size-4" />
          Export finance pack
        </button>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {financeExecutiveKpis.map((item) => (
          <article key={item.label} className="rounded border border-[#C79A54]/20 bg-[#DDEFF2] p-4">
            <p className="text-sm text-ink/58">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{item.value}</p>
            <p className="mt-3 text-xs leading-5 text-[#C79A54]">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded border border-black/10 bg-[#F5FAFA] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#063F4A]">Finance Details</h3>
            <p className="mt-1 text-sm text-ink/55">点击一个财务模块查看明细，其他内容会收起来。</p>
          </div>
          <p className="text-sm text-ink/55">当前：{financeTabs.find((tab) => tab.id === activeFinanceTab)?.title}</p>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          {financeTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeFinanceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFinanceTab(tab.id)}
                className={[
                  "rounded border p-3 text-left transition hover:-translate-y-0.5",
                  active ? "border-[#C79A54] bg-[#063F4A] text-white shadow-sm" : "border-black/10 bg-white text-ink hover:border-[#C79A54]/60"
                ].join(" ")}
              >
                <Icon className={active ? "size-5 text-[#C79A54]" : "size-5 text-[#063F4A]"} />
                <p className="mt-3 text-sm font-semibold">{tab.title}</p>
                <p className={active ? "mt-1 text-xs leading-5 text-white/62" : "mt-1 text-xs leading-5 text-ink/50"}>{tab.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {activeFinanceTab === "revenue" ? (
      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded border border-black/10 bg-rice p-5">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">Revenue Analytics</h3>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {financeRevenue.map((item) => (
              <article key={item.label} className="rounded bg-white p-4">
                <p className="text-sm text-ink/58">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{item.value}</p>
                <p className="mt-2 text-xs text-[#C79A54]">{item.note}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            {revenueBreakdown.map((item) => (
              <div key={item.source}>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="font-medium text-ink/72">{item.source}</span>
                  <span className="font-semibold text-[#063F4A]">{item.amount}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-[#C79A54]" style={{ width: item.pct }} />
                </div>
                <p className="mt-1 text-xs text-ink/45">{item.pct}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-rice p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-5 text-[#C79A54]" />
              <h3 className="text-xl font-semibold">Profit Dashboard</h3>
            </div>
            <StatusPill>Revenue - Cost = Net Profit</StatusPill>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {profitSummary.map((item) => (
              <article key={item.label} className="rounded bg-white p-4">
                <p className="text-sm text-ink/55">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{item.value}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded bg-[#063F4A] p-4 text-white">
            <p className="text-sm text-white/62">真实利润逻辑</p>
            <p className="mt-2 text-sm leading-6">每次 AI 请求按用户、功能、模型与 token 用量记录成本，再汇总每日和每月 AI 成本。</p>
          </div>
        </div>
      </div>
      ) : null}

      {activeFinanceTab === "reconciliation" ? (
      <div className="mt-5 rounded border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Banknote className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">Payment Reconciliation 对账中心</h3>
          </div>
          <StatusPill>Order amount vs Gateway settlement</StatusPill>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-cloud text-ink/55">
              <tr>
                {["Gateway", "Platform orders", "Gateway received", "Gateway fee", "Net settled", "Settlement date", "Status"].map((head) => (
                  <th key={head} className="px-3 py-3 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {paymentReconciliation.map((row) => (
                <tr key={row.gateway}>
                  <td className="px-3 py-3 font-semibold">{row.gateway}</td>
                  <td className="px-3 py-3">{row.orders}</td>
                  <td className="px-3 py-3 text-[#063F4A]">{row.received}</td>
                  <td className="px-3 py-3">{row.fee}</td>
                  <td className="px-3 py-3 font-semibold text-[#063F4A]">{row.net}</td>
                  <td className="px-3 py-3 text-ink/58">{row.settlement}</td>
                  <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          专业重点：系统订单显示 Paid 不代表钱已经到账，对账模块要追踪网关到账、手续费、净结算和差异警报。
        </p>
      </div>
      ) : null}

      {activeFinanceTab === "cost" ? (
      <div className="mt-5 rounded border border-black/10 bg-white p-5">
        <div className="flex items-center gap-3">
          <CircleDollarSign className="size-5 text-[#C79A54]" />
          <h3 className="text-xl font-semibold">Cost Center 成本中心</h3>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {costCenter.map((item) => (
            <div key={item.category} className="flex items-center justify-between gap-4 rounded border border-black/10 p-3">
              <div>
                <p className="font-semibold">{item.category}</p>
                <p className="mt-1 text-xs text-ink/50">{item.pct}</p>
              </div>
              <p className="font-semibold text-[#063F4A]">{item.amount}</p>
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {activeFinanceTab === "ai" ? (
      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">AI Cost Intelligence</h3>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-cloud text-ink/55">
                <tr>
                  {["Feature", "AI revenue", "AI cost", "Margin", "Cost / request"].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {aiMarginRows.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-3 py-3 font-semibold">{row.feature}</td>
                    <td className="px-3 py-3">{row.revenue}</td>
                    <td className="px-3 py-3">{row.cost}</td>
                    <td className="px-3 py-3 font-semibold text-[#063F4A]">{row.margin}</td>
                    <td className="px-3 py-3 text-ink/58">{row.costPerReq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">AI 使用成本追踪</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {aiCostRecords.map((record) => (
              <article key={record.userId} className="rounded border border-black/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{record.userId}</p>
                    <p className="text-sm text-ink/55">{record.requests} requests · Avg {record.avgCost}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#063F4A]">{record.daily}</p>
                    <p className="text-xs text-ink/50">Daily cost</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      ) : null}

      {activeFinanceTab === "payout" ? (
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">Withdrawal Risk Review</h3>
          </div>
          <div className="mt-5 grid gap-3">
            {withdrawalRiskChecks.map((item) => (
              <div key={item.check} className="flex items-center justify-between gap-4 rounded border border-black/10 p-3">
                <div>
                  <p className="font-semibold">{item.check}</p>
                  <p className="mt-1 text-xs text-ink/50">{item.note}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HandCoins className="size-5 text-[#C79A54]" />
              <h3 className="text-xl font-semibold">Commission & Payout Control</h3>
            </div>
            <button className="rounded-full bg-[#063F4A] px-4 py-2 text-xs font-semibold text-white">Manual approval</button>
          </div>
          <div className="mt-5 space-y-3">
            {commissionRecords.map((record) => (
              <div key={record.id} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-black/10 p-4">
                <div>
                  <p className="font-semibold">{record.agent}</p>
                  <p className="text-sm text-ink/55">{record.id} · {record.source}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#063F4A]">{record.amount}</p>
                  <span className="mt-2 inline-flex"><StatusBadge status={record.status} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">提现申请</h3>
          </div>
          <div className="mt-5 space-y-3">
            {withdrawalRequests.map((request) => (
              <div key={request.id} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-black/10 p-4">
                <div>
                  <p className="font-semibold">{request.user}</p>
                  <p className="text-sm text-ink/55">{request.id} · {request.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#063F4A]">{request.amount}</p>
                  <span className="mt-2 inline-flex"><StatusBadge status={request.status} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      ) : null}

      {activeFinanceTab === "reports" ? (
      <div className="mt-5 rounded border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Download className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">Finance Reports Export Center</h3>
          </div>
          <StatusPill>CSV / Excel / PDF</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {financeReports.map((report) => (
            <article key={report.name} className="rounded border border-black/10 bg-rice p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#063F4A]">{report.name}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{report.desc}</p>
                </div>
                <span className="rounded-full bg-[#DDEFF2] px-3 py-1 text-xs font-semibold text-[#063F4A]">{report.format}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
      ) : null}

      {activeFinanceTab === "reconciliation" ? (
      <div className="mt-5 rounded border border-black/10 bg-white p-5">
        <div className="flex items-center gap-3">
          <Banknote className="size-5 text-[#C79A54]" />
          <h3 className="text-xl font-semibold">交易记录</h3>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-cloud text-ink/55">
              <tr>
                {["User ID", "Order ID", "Amount", "Method", "Status", "Timestamp", "Source"].map((head) => (
                  <th key={head} className="px-3 py-3 font-medium">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {transactionRecords.map((record) => (
                <tr key={record.orderId}>
                  <td className="px-3 py-3 font-semibold">{record.userId}</td>
                  <td className="px-3 py-3">{record.orderId}</td>
                  <td className="px-3 py-3 font-semibold text-[#063F4A]">{record.amount}</td>
                  <td className="px-3 py-3">{record.method}</td>
                  <td className="px-3 py-3"><StatusBadge status={record.status} /></td>
                  <td className="px-3 py-3 text-ink/58">{record.timestamp}</td>
                  <td className="px-3 py-3">{record.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}
    </SectionFrame>
  );
}

function PartnerPoolModule() {
  const [grossRevenue, setGrossRevenue] = useState("0");
  const [refunds, setRefunds] = useState("0");
  const [gatewayFees, setGatewayFees] = useState("0");
  const [excludedRevenue, setExcludedRevenue] = useState("0");
  const [poolRate, setPoolRate] = useState("5");
  const [participants, setParticipants] = useState(poolParticipantSeed);
  const [poolStatus, setPoolStatus] = useState("Pending");
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const eligibleRevenue = Math.max(0, parseMoney(grossRevenue) - parseMoney(refunds) - parseMoney(gatewayFees) - parseMoney(excludedRevenue));
  const poolTotal = eligibleRevenue * ((Number(poolRate) || 0) / 100);
  const eligibleParticipants = participants.filter((participant) => participant.status === "Eligible");

  function allocationFor(packageName: string, share: number) {
    const members = eligibleParticipants.filter((participant) => participant.packageName === packageName);
    const tierPool = poolTotal * (share / 100);
    return {
      members,
      tierPool,
      perMember: members.length ? tierPool / members.length : 0
    };
  }

  function updateParticipantStatus(id: string, status: string) {
    setParticipants((current) => current.map((participant) => (participant.id === id ? { ...participant, status } : participant)));
    setAuditLogs((current) => [`${new Date().toLocaleString("sv-SE")} ${id} status changed to ${status}`, ...current]);
  }

  function approvePool() {
    setPoolStatus("Approved");
    setAuditLogs((current) => [`${new Date().toLocaleString("sv-SE")} Pool approved at ${formatMoney(poolTotal)}`, ...current]);
  }

  function markPoolPaid() {
    setPoolStatus("Paid");
    setAuditLogs((current) => [`${new Date().toLocaleString("sv-SE")} Pool payout marked as paid`, ...current]);
  }

  return (
    <SectionFrame
      eyebrow="Partner Performance Pool"
      title="创业配套业绩奖励池"
      desc="每月从合资格净业绩拨出 5% 进入奖励池，再按 38888 / 16888 / 8888 三个配套池 50% / 35% / 15% 分配。"
      action={<StatusBadge status={poolStatus} />}
    >
      <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        上市友好规则：这是渠道销售激励，不是投资分红；不承诺固定回报；以实收净业绩、活跃资格、退款追回和财务审批为准。
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#063F4A]">Pool 计算设置</h3>
              <p className="mt-1 text-sm text-ink/55">建议用合资格净业绩，避免退款和手续费造成现金流风险。</p>
            </div>
            <Landmark className="size-6 text-[#C79A54]" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["公司总业绩", grossRevenue, setGrossRevenue],
              ["退款 / Chargeback", refunds, setRefunds],
              ["网关手续费", gatewayFees, setGatewayFees],
              ["排除项目", excludedRevenue, setExcludedRevenue],
              ["Pool 比例 %", poolRate, setPoolRate]
            ].map(([label, value, setter]) => (
              <label key={label as string} className="rounded border border-black/10 bg-[#F5FAFA] p-3 text-sm">
                <span className="text-ink/45">{label as string}</span>
                <input
                  value={value as string}
                  onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                  className="mt-1 w-full bg-transparent text-xl font-semibold text-[#063F4A] outline-none"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["合资格净业绩", formatMoney(eligibleRevenue)],
              ["Pool 总额", formatMoney(poolTotal)],
              ["合资格人数", `${eligibleParticipants.length} 人`]
            ].map(([label, value]) => (
              <article key={label} className="rounded bg-[#063F4A] p-4 text-white">
                <p className="text-sm text-white/58">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#C79A54]">{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setPoolStatus("Calculated")} className="rounded-full border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2 text-sm font-semibold text-[#063F4A]">
              重新计算
            </button>
            <button type="button" onClick={approvePool} className="rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white">
              财务批准
            </button>
            <button type="button" onClick={markPoolPaid} className="rounded-full bg-[#C79A54] px-4 py-2 text-sm font-semibold text-[#063F4A]">
              标记已发放
            </button>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-[#F5FAFA] p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">三大配套池分配</h3>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {poolTiers.map((tier) => {
              const allocation = allocationFor(tier.packageName, tier.share);
              return (
                <article key={tier.packageName} className={tier.share === 50 ? "rounded border border-[#C79A54] bg-[#063F4A] p-4 text-white" : "rounded border border-black/10 bg-white p-4"}>
                  <p className={tier.share === 50 ? "text-sm text-[#C79A54]" : "text-sm text-ink/50"}>{tier.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{tier.share}%</p>
                  <div className={tier.share === 50 ? "mt-4 space-y-2 text-sm text-white/70" : "mt-4 space-y-2 text-sm text-ink/58"}>
                    <p>池金额：{formatMoney(allocation.tierPool)}</p>
                    <p>合资格人数：{allocation.members.length}</p>
                    <p>每人预估：{allocation.members.length ? formatMoney(allocation.perMember) : "无人参与，金额保留"}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 overflow-x-auto rounded border border-black/10 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-cloud text-ink/55">
                <tr>
                  {["Partner", "Package", "Status", "Activity", "Estimated payout", "Action"].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {participants.map((participant) => {
                  const tier = poolTiers.find((item) => item.packageName === participant.packageName);
                  const allocation = tier ? allocationFor(tier.packageName, tier.share) : { perMember: 0 };
                  return (
                    <tr key={participant.id}>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{participant.name}</p>
                        <p className="text-xs text-ink/45">{participant.email}</p>
                      </td>
                      <td className="px-3 py-3">{participant.packageName}</td>
                      <td className="px-3 py-3"><StatusBadge status={participant.status} /></td>
                      <td className="px-3 py-3 text-ink/58">{participant.activity}</td>
                      <td className="px-3 py-3 font-semibold text-[#063F4A]">{participant.status === "Eligible" ? formatMoney(allocation.perMember) : "RM0.00"}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => updateParticipantStatus(participant.id, "Eligible")} className="rounded-full bg-[#1495A0] px-3 py-1.5 text-xs font-semibold text-white">
                            Eligible
                          </button>
                          <button type="button" onClick={() => updateParticipantStatus(participant.id, "Hold")} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            Hold
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">上市审计控制清单</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Revenue basis", "只采用合资格实收净业绩，不含未收款、退款、内部转账。"],
              ["No guaranteed return", "所有会员端文案禁止写固定收益、保本、投资回报。"],
              ["Clawback", "退款、违规推广、坏账可在下月奖励中追回或冻结。"],
              ["Approval trail", "计算、批准、付款必须保留审批人、时间、金额和备注。"],
              ["Tax support", "付款前收集税务资料，导出 partner incentive 报表。"],
              ["Period lock", "每月结算后锁账，修改必须走 adjustment 记录。"]
            ].map(([title, desc]) => (
              <div key={title} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/58">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-[#063F4A]">Audit Log</h3>
            <button className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#063F4A]">Export</button>
          </div>
          <div className="mt-4 space-y-2">
            {auditLogs.map((log) => (
              <p key={log} className="rounded bg-cloud px-3 py-2 text-sm text-ink/62">{log}</p>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function StockModule({
  products,
  onSaveProduct
}: {
  products: InventoryProduct[];
  onSaveProduct: (product: InventoryProduct, originalSku?: string) => void;
}) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft);

  function updateDraft(field: keyof ProductDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function openNewProductForm() {
    setDraft(emptyProductDraft);
    setEditingSku(null);
    setShowAddProduct(true);
  }

  function openEditProductForm(product: InventoryProduct) {
    setDraft({
      sku: product.sku,
      product: product.product,
      category: product.category,
      image: product.image,
      description: product.description,
      stock: String(product.stock),
      cost: product.cost,
      price: product.price,
      threshold: String(product.threshold)
    });
    setEditingSku(product.sku);
    setShowAddProduct(true);
  }

  function closeProductForm() {
    setDraft(emptyProductDraft);
    setEditingSku(null);
    setShowAddProduct(false);
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const stock = Number(draft.stock || 0);
    const threshold = Number(draft.threshold || 0);
    const fallbackSku = `FS-NEW-${String(products.length + 1).padStart(3, "0")}`;

    onSaveProduct({
      sku: draft.sku.trim() || fallbackSku,
      product: draft.product.trim() || "未命名产品",
      category: draft.category.trim() || "未分类",
      image: draft.image.trim() || "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=300&q=80",
      description: draft.description.trim() || "后台新增产品，请补充完整介绍内容。",
      stock,
      cost: formatRM(draft.cost),
      price: formatRM(draft.price),
      threshold,
      status: inventoryStatus(stock, threshold)
    }, editingSku ?? undefined);

    closeProductForm();
  }

  return (
    <SectionFrame
      eyebrow="Stock Keeper Module"
      title="库存与产品利润中心"
      desc="管理 SKU、库存数量、成本价、售价、低库存阈值、库存流水和产品级利润。"
      action={
        <div className="flex flex-wrap gap-2">
          <StatusPill>Paid order 自动扣库存</StatusPill>
          <button
            type="button"
            onClick={showAddProduct ? closeProductForm : openNewProductForm}
            className="inline-flex items-center gap-2 rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#052F38]"
          >
            <Plus className="size-4" />
            {showAddProduct ? "关闭表单" : "新增产品"}
          </button>
        </div>
      }
    >
      {showAddProduct ? (
        <form onSubmit={submitProduct} className="mb-5 rounded border border-[#C79A54]/25 bg-[#DDEFF2] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-[#063F4A]">{editingSku ? "编辑库存产品" : "新增库存产品"}</h3>
              <p className="mt-1 text-sm text-ink/58">
                {editingSku ? "修改现有产品资料后会即时更新当前库存表。" : "填写产品资料后会先加入当前库存表。之后接数据库时，这里会保存到 products / inventory 表。"}
              </p>
            </div>
            <ImageIcon className="size-6 text-[#C79A54]" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["SKU", "sku", "FS-NEW-005"],
              ["产品名称", "product", "五行能量挂饰"],
              ["分类", "category", "风水摆件"],
              ["照片 URL", "image", "https://..."],
              ["库存数量", "stock", "50"],
              ["成本价", "cost", "88"],
              ["售价", "price", "188"],
              ["低库存阈值", "threshold", "10"]
            ].map(([label, field, placeholder]) => (
              <label key={field} className="text-sm font-medium text-ink/72">
                {label}
                <input
                  value={draft[field as keyof ProductDraft]}
                  onChange={(event) => updateDraft(field as keyof ProductDraft, event.target.value)}
                  placeholder={placeholder}
                  className="mt-2 w-full rounded border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#C79A54]"
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm font-medium text-ink/72">
            产品内容 / 介绍
            <textarea
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
              placeholder="写清楚产品用途、适合人群、搭配运势/报告的卖点。"
              rows={3}
              className="mt-2 w-full rounded border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#C79A54]"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" className="rounded-full bg-[#063F4A] px-5 py-2.5 text-sm font-semibold text-white">
              {editingSku ? "保存修改" : "保存产品"}
            </button>
            <button
              type="button"
              onClick={closeProductForm}
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink/70"
            >
              取消
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {inventoryReports.map((item) => (
          <article key={item.label} className="rounded border border-[#C79A54]/20 bg-[#DDEFF2] p-5">
            <p className="text-sm text-ink/58">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{item.value}</p>
            <p className="mt-3 text-sm text-[#C79A54]">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <Warehouse className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">产品库存</h3>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-cloud text-ink/55">
                <tr>
                  {["SKU", "Product", "Qty", "Cost", "Selling", "Low threshold", "Status", "Action"].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td className="px-3 py-3 font-semibold">{product.sku}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt="" className="size-12 rounded object-cover" />
                        <div>
                          <p className="font-semibold">{product.product}</p>
                          <p className="text-xs text-ink/45">{product.category}</p>
                          <p className="mt-1 max-w-[260px] truncate text-xs text-ink/50">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#063F4A]">{product.stock}</td>
                    <td className="px-3 py-3">{product.cost}</td>
                    <td className="px-3 py-3">{product.price}</td>
                    <td className="px-3 py-3">{product.threshold}</td>
                    <td className="px-3 py-3"><StatusBadge status={product.status} /></td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openEditProductForm(product)}
                        className="rounded-full border border-[#063F4A]/15 bg-[#DDEFF2] px-3 py-1.5 text-xs font-semibold text-[#063F4A]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-rice p-5">
          <div className="flex items-center gap-3">
            <PackageCheck className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">库存流水</h3>
          </div>
          <div className="mt-5 space-y-3">
            {stockMovements.map((movement) => (
              <article key={movement.id} className="rounded border border-black/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{movement.type}</p>
                    <p className="mt-1 text-sm text-ink/55">{movement.sku} · {movement.reason}</p>
                  </div>
                  <p className="font-semibold text-[#063F4A]">{movement.qty}</p>
                </div>
                <p className="mt-3 text-xs text-ink/45">{movement.id} · {movement.timestamp}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded border border-black/10 bg-white p-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="size-5 text-[#C79A54]" />
          <h3 className="text-xl font-semibold">产品利润追踪</h3>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {productProfitRows.map((row) => (
            <article key={row.product} className="rounded border border-black/10 p-4">
              <p className="font-semibold text-[#063F4A]">{row.product}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Sold", row.sold],
                  ["Revenue", row.revenue],
                  ["Profit", row.profit],
                  ["Margin", row.margin]
                ].map(([label, value]) => (
                  <div key={label} className={label === "Margin" ? "rounded bg-[#DDEFF2] p-3" : "rounded bg-cloud p-3"}>
                    <p className="text-ink/50">{label}</p>
                    <p className={label === "Margin" ? "mt-1 font-semibold text-[#063F4A]" : "mt-1 font-semibold"}>{value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

function OrdersModule() {
  const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>("All");
  const filteredOrders = activeOrderTab === "All" ? orders : orders.filter((order) => order.type === activeOrderTab);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0];

  return (
    <SectionFrame
      eyebrow="Order Operations Center"
      title="订单运营中心"
      desc="确保每一笔钱收款后，会员、点数、课程、库存、佣金和通知都正确执行。"
      action={<StatusPill>Paid 后自动触发履约、扣库存、佣金与通知</StatusPill>}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {orderKpis.map((item) => (
          <article key={item.label} className="rounded border border-[#C79A54]/20 bg-[#DDEFF2] p-4">
            <p className="text-sm text-ink/58">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{item.value}</p>
            <p className="mt-2 text-xs text-[#C79A54]">{item.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded border border-black/10 bg-rice p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-[#063F4A]">订单状态 Pipeline</h3>
            <p className="mt-1 text-sm text-ink/55">快速看订单卡在哪个阶段。</p>
          </div>
          <StatusPill>Pending → Paid → Processing → Completed</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {orderPipeline.map((item) => (
            <article key={item.status} className="rounded border border-black/10 bg-white p-4">
              <p className="text-sm text-ink/55">{item.status}</p>
              <p className="mt-2 text-3xl font-semibold text-[#063F4A]">{item.count}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">异常订单提醒</h3>
          </div>
          <div className="mt-5 space-y-3">
            {orderExceptions.map((item) => (
              <article key={item.orderId} className="rounded border border-black/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-ink/55">{item.orderId} · {item.desc}</p>
                  </div>
                  <StatusBadge status={item.severity} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">订单类型筛选</h3>
              <p className="mt-1 text-sm text-ink/55">当前：{activeOrderTab}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {orderTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveOrderTab(tab);
                    const nextOrder = tab === "All" ? orders[0] : orders.find((order) => order.type === tab);
                    if (nextOrder) setSelectedOrderId(nextOrder.id);
                  }}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    activeOrderTab === tab ? "bg-[#063F4A] text-white" : "border border-black/10 bg-white text-ink/65 hover:border-[#C79A54]"
                  ].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-cloud text-ink/55">
                <tr>
                  {["Order", "Customer", "Type", "Amount", "Payment", "Fulfillment", "Commission", "Stock", "Created", "Action"].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={selectedOrder?.id === order.id ? "bg-[#DDEFF2]" : ""}>
                    <td className="px-3 py-3 font-semibold">{order.id}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{order.customer}</p>
                      <p className="text-xs text-ink/45">{order.userId}</p>
                    </td>
                    <td className="px-3 py-3">{order.type}</td>
                    <td className="px-3 py-3 font-semibold text-[#063F4A]">{order.amount}</td>
                    <td className="px-3 py-3">
                      <p>{order.paymentMethod}</p>
                      <span className="mt-1 inline-flex"><StatusBadge status={order.paymentStatus} /></span>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={order.fulfillmentStatus} /></td>
                    <td className="px-3 py-3"><StatusBadge status={order.commissionStatus} /></td>
                    <td className="px-3 py-3"><StatusBadge status={order.stockStatus} /></td>
                    <td className="px-3 py-3 text-ink/55">{order.createdAt}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="rounded-full border border-[#063F4A]/15 bg-[#DDEFF2] px-3 py-1.5 text-xs font-semibold text-[#063F4A]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedOrder ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Selected Order</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#063F4A]">{selectedOrder.id}</h3>
                <p className="mt-2 text-sm text-ink/58">{selectedOrder.customer} · {selectedOrder.userId}</p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["购买项目", selectedOrder.item],
                ["订单类型", selectedOrder.type],
                ["金额", selectedOrder.amount],
                ["付款方式", selectedOrder.paymentMethod],
                ["付款状态", selectedOrder.paymentStatus],
                ["创建时间", selectedOrder.createdAt]
              ].map(([label, value]) => (
                <div key={label} className="rounded bg-cloud p-3">
                  <p className="text-xs text-ink/45">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Approve payment", "Mark processing", "Mark completed", "Resend receipt", "Re-run automation"].map((action) => (
                <button key={action} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink/70">
                  {action}
                </button>
              ))}
              <button className="rounded-full bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Refund</button>
            </div>
          </div>

          <div className="rounded border border-black/10 bg-rice p-5">
            <div className="flex items-center gap-3">
              <PackageCheck className="size-5 text-[#C79A54]" />
              <h3 className="text-xl font-semibold">自动化执行结果</h3>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {selectedOrder.automation.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded border border-black/10 bg-white p-3">
                  <CheckCircle2 className="size-4 shrink-0 text-[#063F4A]" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded border border-black/10 bg-white p-4">
              <h4 className="font-semibold">操作日志</h4>
              <div className="mt-3 space-y-2">
                {selectedOrder.logs.map((log) => (
                  <p key={log} className="rounded bg-cloud px-3 py-2 text-sm text-ink/65">{log}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded border border-[#C79A54]/25 bg-[#DDEFF2] p-4">
        <p className="font-semibold text-[#063F4A]">订单模块专业重点</p>
        <p className="mt-2 text-sm leading-6 text-ink/62">
          订单 Paid 后必须检查：会员升级、点数发放、课程开通、库存扣减、佣金生成、团队业绩更新、通知发送。异常订单要自动进入提醒队列。
        </p>
      </div>
    </SectionFrame>
  );
}

function CoursesModule() {
  const [courses, setCourses] = useState(courseSeed);
  const [draft, setDraft] = useState({ title: "", type: "线上课程", price: "", seats: "", points: "" });

  function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    setCourses((current) => [
      ...current,
      {
        id: `CRS-${String(current.length + 1).padStart(3, "0")}`,
        title: draft.title,
        type: draft.type,
        price: formatRM(draft.price),
        seats: Number(draft.seats) || 0,
        enrolled: 0,
        status: "Draft",
        points: Number(draft.points) || 0
      }
    ]);
    setDraft({ title: "", type: "线上课程", price: "", seats: "", points: "" });
  }

  return (
    <SectionFrame
      eyebrow="Course Commerce"
      title="课程管理"
      desc="新增和编辑线上课、直播课、线下课与导师班，管理价格、名额、赠点、报名、签到和证书状态。"
      action={<button className="inline-flex items-center gap-2 rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white"><BookOpenCheck className="size-4" />课程中心</button>}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">课程列表</h3>
          <div className="mt-4 space-y-3">
            {courses.map((course, index) => (
              <article key={course.id} className="rounded border border-black/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C79A54]">{course.id} · {course.type}</p>
                    <input value={course.title} onChange={(event) => setCourses((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} className="mt-2 w-full text-lg font-semibold text-[#063F4A] outline-none" />
                  </div>
                  <StatusBadge status={course.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <label className="rounded bg-[#F5FAFA] p-3 text-sm">
                    <span className="text-ink/45">价格</span>
                    <input value={course.price} onChange={(event) => setCourses((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} className="mt-1 w-full bg-transparent font-semibold outline-none" />
                  </label>
                  <label className="rounded bg-[#F5FAFA] p-3 text-sm">
                    <span className="text-ink/45">名额</span>
                    <input type="number" value={course.seats} onChange={(event) => setCourses((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, seats: Number(event.target.value) } : row))} className="mt-1 w-full bg-transparent font-semibold outline-none" />
                  </label>
                  <div className="rounded bg-[#F5FAFA] p-3 text-sm">
                    <span className="text-ink/45">报名</span>
                    <p className="mt-1 font-semibold">{course.enrolled} 人</p>
                  </div>
                  <label className="rounded bg-[#F5FAFA] p-3 text-sm">
                    <span className="text-ink/45">赠点</span>
                    <input type="number" value={course.points} onChange={(event) => setCourses((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, points: Number(event.target.value) } : row))} className="mt-1 w-full bg-transparent font-semibold outline-none" />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["报名名单", "签到管理", "证书生成", "上传视频"].map((label) => (
                    <button key={label} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[#063F4A]">{label}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={addCourse} className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">新增课程</h3>
          <div className="mt-4 space-y-3">
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="课程名称" className="w-full rounded border border-black/10 px-3 py-3 outline-none" />
            <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className="w-full rounded border border-black/10 px-3 py-3 outline-none">
              {["线上课程", "短训训练", "直播课", "商业课程", "线下课程", "高阶导师班"].map((type) => <option key={type}>{type}</option>)}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="价格" className="rounded border border-black/10 px-3 py-3 outline-none" />
              <input value={draft.seats} onChange={(event) => setDraft({ ...draft, seats: event.target.value })} placeholder="名额" className="rounded border border-black/10 px-3 py-3 outline-none" />
              <input value={draft.points} onChange={(event) => setDraft({ ...draft, points: event.target.value })} placeholder="赠点" className="rounded border border-black/10 px-3 py-3 outline-none" />
            </div>
            <button className="w-full rounded bg-[#1495A0] px-4 py-3 font-semibold text-white">新增课程</button>
          </div>
        </form>
      </div>
    </SectionFrame>
  );
}

function AgentPackagesModule() {
  const [packages, setPackages] = useState(agentPackageSeed);

  return (
    <SectionFrame
      eyebrow="Partner Package Control"
      title="代理配套管理"
      desc="把 8888 / 16888 / 38888 包装成产品包、课程包、服务包，不包装成“买资格赚钱”。"
      action={<StatusPill>产品包 · 课程包 · 服务包</StatusPill>}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {packages.map((pack, index) => (
          <article key={pack.name} className={pack.name.includes("16888") ? "rounded border border-[#C79A54] bg-[#063F4A] p-5 text-white shadow-sm" : "rounded border border-black/10 bg-white p-5"}>
            <div className="flex items-start justify-between gap-3">
              <Award className={pack.name.includes("16888") ? "size-6 text-[#C79A54]" : "size-6 text-[#063F4A]"} />
              <StatusBadge status={pack.status} />
            </div>
            <input value={pack.name} onChange={(event) => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} className="mt-5 w-full bg-transparent text-xl font-semibold outline-none" />
            <input value={pack.price} onChange={(event) => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} className={pack.name.includes("16888") ? "mt-3 w-full bg-transparent text-3xl font-semibold text-[#C79A54] outline-none" : "mt-3 w-full bg-transparent text-3xl font-semibold text-[#063F4A] outline-none"} />
            <div className={pack.name.includes("16888") ? "mt-5 space-y-3 text-sm text-white/68" : "mt-5 space-y-3 text-sm text-ink/60"}>
              <p>AI 权限：{pack.tier}</p>
              <p>包含点数：{pack.points.toLocaleString()} 点</p>
              <p>推荐分润：{pack.commission}</p>
              <p>业绩奖励池：{pack.poolShare}</p>
              <p>包含：产品礼包、课程权限、专属海报、团队看板</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button className={pack.name.includes("16888") ? "rounded-full bg-[#C79A54] px-4 py-2 text-sm font-semibold text-[#063F4A]" : "rounded-full bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white"}>保存</button>
              <button
                type="button"
                onClick={() => setPackages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, status: row.status === "Active" ? "Draft" : "Active" } : row))}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold"
              >
                {pack.status === "Active" ? "下架" : "上架"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}

function PaymentsModule() {
  const [reviews, setReviews] = useState(paymentReviewSeed);

  function updateStatus(id: string, status: string) {
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, status } : review)));
  }

  return (
    <SectionFrame
      eyebrow="Payment Review Desk"
      title="支付审核"
      desc="处理手动银行转账、网关对账差异和付款后自动开通动作。审核通过后应触发升级会员、发放点数、开通课程、生成佣金。"
      action={<StatusPill>{reviews.filter((item) => item.status === "Pending Review").length} 待审核</StatusPill>}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">付款审核队列</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F5FAFA] text-ink/55">
                <tr>
                  {["Payment ID", "User", "Order", "Amount", "Method", "Status", "Action"].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td className="px-3 py-3 font-semibold text-[#063F4A]">{review.id}</td>
                    <td className="px-3 py-3">{review.user}</td>
                    <td className="px-3 py-3">{review.order}</td>
                    <td className="px-3 py-3 font-semibold">{review.amount}</td>
                    <td className="px-3 py-3">{review.method}</td>
                    <td className="px-3 py-3"><StatusBadge status={review.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => updateStatus(review.id, "Approved")} className="rounded-full bg-[#1495A0] px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                        <button type="button" onClick={() => updateStatus(review.id, "Rejected")} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-5">
          <h3 className="text-xl font-semibold text-[#063F4A]">审核通过后自动执行</h3>
          <div className="mt-4 space-y-3">
            {["升级会员", "发放点数", "开通课程 / 报告", "生成三层佣金", "更新团队业绩", "发送收据通知"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded bg-white p-3">
                <CheckCircle2 className="size-4 text-[#1495A0]" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function SystemModule() {
  return (
    <SectionFrame
      eyebrow="System Module"
      title="后台功能地图与控制规则"
      desc="这里放比较稳定的系统管理入口，不和财务、库存的日常运营数据混在一起。"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">后台功能地图</h3>
              <p className="mt-2 text-sm text-ink/55">点击上方模块查看日常经营细节。</p>
            </div>
            <StatusPill>管理范围</StatusPill>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {adminModules.map((module) => {
              const Icon = module.icon;
              return (
                <article key={module.title} className="rounded border border-black/10 bg-rice p-4">
                  <Icon className="size-5 text-[#063F4A]" />
                  <h4 className="mt-3 font-semibold">{module.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{module.desc}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 size-5 shrink-0 text-[#C79A54]" />
              <div>
                <h3 className="text-xl font-semibold">AI 与合规控制</h3>
                <p className="mt-2 text-sm leading-6 text-white/68">
                  每个 AI 功能独立配置点数、等级权限、Prompt 模板、敏感词、免责声明和报告模板。所有命理建议都需要保留风险提醒与行动建议。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded border border-black/10 bg-white p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 shrink-0 text-[#C79A54]" />
              <div>
                <h3 className="text-xl font-semibold">三层分润规则</h3>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    ["第一代", "20%"],
                    ["第二代", "10%"],
                    ["第三代", "5%"]
                  ].map(([level, pct]) => (
                    <div key={level} className="rounded bg-cloud p-4">
                      <p className="text-sm text-ink/55">{level}</p>
                      <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{pct}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-ink/58">
                  订阅、点数、报告、产品、课程和真人服务可分别设置佣金比例，后台记录收益，不开放点数提现。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

export default function AdminPage() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("ceo");
  const [inventoryList, setInventoryList] = useState<InventoryProduct[]>(inventoryProducts);
  const [adminGate, setAdminGate] = useState<"checking" | "authorized" | "denied">("checking");
  const [adminGateMessage, setAdminGateMessage] = useState("正在验证管理员权限。");

  useEffect(() => {
    let mounted = true;

    async function verifyAdminAccess() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session }
      } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

      if (!session?.access_token) {
        if (mounted) {
          setAdminGate("denied");
          setAdminGateMessage("请先使用管理员账号登录后再进入后台。");
        }
        return;
      }

      try {
        const response = await fetch("/api/admin/credits?emails=ronfatt%40gmail.com", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.error || "没有后台访问权限。");
        }

        if (mounted) {
          setAdminGate("authorized");
          setAdminGateMessage("管理员权限已验证。");
        }
      } catch (error) {
        if (mounted) {
          setAdminGate("denied");
          setAdminGateMessage(error instanceof Error ? error.message : "没有后台访问权限。");
        }
      }
    }

    verifyAdminAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (adminGate !== "authorized") {
    return (
      <AppShell>
        <main className="px-5 py-8">
          <div className="mx-auto max-w-3xl rounded border border-black/10 bg-white p-8 shadow-sm">
            <StatusPill>{adminGate === "checking" ? "Checking" : "Admin Protected"}</StatusPill>
            <h1 className="mt-4 text-3xl font-semibold text-[#063F4A]">
              {adminGate === "checking" ? "正在验证后台权限" : "后台只开放给管理员"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-ink/60">{adminGateMessage}</p>
            {adminGate === "denied" ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/auth" className="rounded bg-[#063F4A] px-5 py-3 text-sm font-semibold text-white">
                  前往登录
                </a>
                <a href="/" className="rounded border border-black/10 px-5 py-3 text-sm font-semibold text-[#063F4A]">
                  返回首页
                </a>
              </div>
            ) : null}
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill>老板后台 · Admin Console</StatusPill>
                <h1 className="mt-4 text-3xl font-semibold text-[#063F4A] md:text-5xl">公司经营控制台</h1>
                <p className="mt-3 max-w-3xl text-ink/65">
                  先看现金、异常、审批和经营风险，再进入用户、财务、库存、订单、代理与 Pool Share 模块处理。
                </p>
              </div>
              <div className="flex gap-2">
                <button className="grid size-11 place-items-center rounded-full border border-black/10" aria-label="搜索">
                  <Search className="size-5" />
                </button>
                <button className="grid size-11 place-items-center rounded-full bg-[#063F4A] text-white" aria-label="设置">
                  <Settings2 className="size-5" />
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {adminStats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded border border-black/10 bg-[#F5FAFA] p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Module Switcher</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">选择一个模块查看细节</h2>
              </div>
              <p className="text-sm text-ink/55">当前：{moduleTabs.find((module) => module.id === activeModule)?.title}</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {moduleTabs.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  active={activeModule === module.id}
                  onClick={() => setActiveModule(module.id)}
                />
              ))}
            </div>
          </section>

          <div className="mt-6">
            {activeModule === "ceo" ? <CeoOverviewModule onOpenModule={setActiveModule} /> : null}
            {activeModule === "users" ? <UsersModule /> : null}
            {activeModule === "credits" ? <CreditsModule /> : null}
            {activeModule === "ai" ? <AiControlModule /> : null}
            {activeModule === "finance" ? <FinanceModule /> : null}
            {activeModule === "accounting" ? <AccountingExportModule /> : null}
            {activeModule === "pool" ? <PartnerPoolModule /> : null}
            {activeModule === "stock" ? (
              <StockModule
                products={inventoryList}
                onSaveProduct={(product, originalSku) =>
                  setInventoryList((current) => {
                    if (!originalSku) return [product, ...current];
                    return current.map((item) => (item.sku === originalSku ? product : item));
                  })
                }
              />
            ) : null}
            {activeModule === "courses" ? <CoursesModule /> : null}
            {activeModule === "orders" ? <OrdersModule /> : null}
            {activeModule === "agents" ? <AgentPackagesModule /> : null}
            {activeModule === "payments" ? <PaymentsModule /> : null}
            {activeModule === "system" ? <SystemModule /> : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
