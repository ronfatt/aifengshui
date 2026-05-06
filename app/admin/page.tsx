"use client";

import { type FormEvent, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  HandCoins,
  ImageIcon,
  LayoutGrid,
  PackageCheck,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  TrendingUp,
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

const moduleTabs = [
  {
    id: "finance",
    title: "Finance",
    desc: "收入、成本、利润、佣金、提现",
    icon: CircleDollarSign,
    stat: "RM612,480"
  },
  {
    id: "stock",
    title: "Stock Keeper",
    desc: "SKU、库存流水、低库存、产品利润",
    icon: Warehouse,
    stat: "4 SKU"
  },
  {
    id: "orders",
    title: "Orders",
    desc: "订单状态、支付审核、履约跟踪",
    icon: Banknote,
    stat: "4 orders"
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

function formatRM(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "RM0";
  return trimmed.toUpperCase().startsWith("RM") ? trimmed : `RM${trimmed}`;
}

function inventoryStatus(stock: number, threshold: number) {
  if (stock <= 0) return "Out of stock";
  if (stock <= threshold) return "Low stock";
  return "In stock";
}

function statusTone(status: string) {
  if (["Paid", "Completed", "Approved", "In stock"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["Matched", "Enabled", "Required", "Points issued", "Course opened"].includes(status)) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (["Pending", "Pending Review", "Processing", "Low stock", "Generating report", "On hold", "Hold", "Reserved", "Packing"].includes(status)) {
    return "bg-amber-50 text-amber-700";
  }

  if (["Out of stock", "Mismatch", "Flagged", "Deduction failed", "High"].includes(status)) {
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
            <StatusPill>MVP 管理范围</StatusPill>
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
  const [activeModule, setActiveModule] = useState<ActiveModule>("finance");
  const [inventoryList, setInventoryList] = useState<InventoryProduct[]>(inventoryProducts);

  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill>老板后台 · Admin Console</StatusPill>
                <h1 className="mt-4 text-3xl font-semibold text-[#063F4A] md:text-5xl">平台运营总览</h1>
                <p className="mt-3 max-w-3xl text-ink/65">
                  后台改成模块式管理：先看经营总览，再点击 Finance、Stock Keeper、Orders 或 System 查看对应细节。
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
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            {activeModule === "finance" ? <FinanceModule /> : null}
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
            {activeModule === "orders" ? <OrdersModule /> : null}
            {activeModule === "system" ? <SystemModule /> : null}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
