"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Archive,
  BookmarkCheck,
  BookOpenCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileText,
  Flame,
  Gift,
  HeartPulse,
  LayoutGrid,
  LockKeyhole,
  Network,
  Palette,
  Share2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  WalletCards
} from "lucide-react";
import {
  dailyRituals,
  dashboardCourses,
  dashboardProducts,
  dashboardStats,
  recentInsights,
  reportTypes
} from "@/lib/data";
import { AppShell, MetricCard, StatusPill } from "@/components/shell";
import { FengshuiChat } from "@/components/fengshui-chat";
import { HierarchyTree } from "@/components/hierarchy-tree";

type DashboardModule =
  | "fortune"
  | "calendar"
  | "profile"
  | "growth"
  | "vault"
  | "ai"
  | "wallet"
  | "shop"
  | "courses"
  | "team";

const modules: {
  id: DashboardModule;
  title: string;
  desc: string;
  metric: string;
  icon: typeof CalendarDays;
}[] = [
  {
    id: "fortune",
    title: "今日运势",
    desc: "评分、宜忌、开运任务和最近洞察",
    metric: "89 分",
    icon: CalendarDays
  },
  {
    id: "calendar",
    title: "运势日历",
    desc: "查看 14 天评分、宜忌和行动窗口",
    metric: "14 天",
    icon: TrendingUp
  },
  {
    id: "profile",
    title: "个人命盘",
    desc: "八字资料、五行强弱和年度关键词",
    metric: "专属",
    icon: UserRound
  },
  {
    id: "growth",
    title: "成长玩法",
    desc: "任务奖励、徽章、分享卡和升级进度",
    metric: "72%",
    icon: Trophy
  },
  {
    id: "vault",
    title: "收藏夹",
    desc: "保存 AI 回复、报告、课程和产品灵感",
    metric: "8 项",
    icon: BookmarkCheck
  },
  {
    id: "ai",
    title: "AI 风水师",
    desc: "问事业、财富、感情与行动时间",
    metric: "24/7",
    icon: Bot
  },
  {
    id: "wallet",
    title: "钱包与报告",
    desc: "点数记录、充值入口和 AI 报告中心",
    metric: "2,680 点",
    icon: WalletCards
  },
  {
    id: "shop",
    title: "产品商城",
    desc: "开运产品、五行饰品和办公室用品",
    metric: "5 类",
    icon: ShoppingBag
  },
  {
    id: "courses",
    title: "课程学习",
    desc: "线上课、直播课和导师认证",
    metric: "5 类",
    icon: BookOpenCheck
  },
  {
    id: "team",
    title: "推荐团队",
    desc: "三层下线、团队业绩和预估佣金",
    metric: "46 人",
    icon: Network
  }
];

const fortuneScores = [
  ["财运", 82, "偏财不宜冒进"],
  ["事业", 91, "适合谈合作"],
  ["感情", 76, "沟通宜慢"]
] as const;

const fortuneCards = [
  ["财运", "偏财不宜冒进"],
  ["事业", "适合谈合作"],
  ["感情", "沟通宜慢"],
  ["健康", "注意睡眠"]
] as const;

const walletRecords = [
  ["购买 Pro 月费", "+1,500 点"],
  ["生成财运报告", "-120 点"],
  ["推荐奖励", "+300 点"],
  ["产品赠送", "+80 点"]
] as const;

const fortuneCalendarDays = [
  { day: "今天", date: "04/30", score: 89, tag: "宜合作", tone: "gold" },
  { day: "五", date: "05/01", score: 84, tag: "宜复盘", tone: "green" },
  { day: "六", date: "05/02", score: 76, tag: "慢决策", tone: "soft" },
  { day: "日", date: "05/03", score: 81, tag: "宜学习", tone: "green" },
  { day: "一", date: "05/04", score: 92, tag: "宜签约", tone: "gold" },
  { day: "二", date: "05/05", score: 73, tag: "忌冲动", tone: "soft" },
  { day: "三", date: "05/06", score: 88, tag: "宜见客", tone: "gold" },
  { day: "四", date: "05/07", score: 79, tag: "宜整理", tone: "green" },
  { day: "五", date: "05/08", score: 86, tag: "财务日", tone: "gold" },
  { day: "六", date: "05/09", score: 70, tag: "宜休息", tone: "soft" },
  { day: "日", date: "05/10", score: 83, tag: "宜沟通", tone: "green" },
  { day: "一", date: "05/11", score: 90, tag: "贵人日", tone: "gold" },
  { day: "二", date: "05/12", score: 78, tag: "守现金", tone: "soft" },
  { day: "三", date: "05/13", score: 87, tag: "宜发布", tone: "gold" }
] as const;

const fiveElementProfile = [
  ["木", 76, "成长力强，适合学习与规划"],
  ["火", 64, "表达力可提升，避免急躁"],
  ["土", 82, "执行稳定，适合做长期项目"],
  ["金", 58, "规则意识需加强，先定标准"],
  ["水", 71, "洞察不错，适合复盘与研究"]
] as const;

const destinyKeywords = ["稳中扩张", "合作机会", "现金流优先", "先整理后放大"];

const growthTasks = [
  { title: "查看今日运势", reward: "+5 点", desc: "每天回来看一次评分与宜忌。" },
  { title: "问 AI 一个决策问题", reward: "+15 点", desc: "围绕事业、财运或关系提出一个具体问题。" },
  { title: "生成或查看一份报告", reward: "+20 点", desc: "把分析变成可保存的行动建议。" },
  { title: "分享今日运势卡", reward: "+30 点", desc: "分享后可带推荐链接，后续接真实裂变。" }
] as const;

const achievementBadges = [
  ["连续 7 天", "已解锁"],
  ["首次报告", "已解锁"],
  ["AI 提问 10 次", "进行中"],
  ["分享 3 次", "进行中"]
] as const;

const onboardingSteps: {
  title: string;
  desc: string;
  action: string;
  module: DashboardModule;
}[] = [
  {
    title: "完善生日资料",
    desc: "建立个人命盘后，运势、AI 回答和报告会更像专属建议。",
    action: "查看命盘",
    module: "profile"
  },
  {
    title: "查看今日运势",
    desc: "先理解今天适合做什么、避开什么，再决定下一步。",
    action: "看今日运势",
    module: "fortune"
  },
  {
    title: "问 AI 一个问题",
    desc: "把最近最卡的事业、财运或关系问题交给 AI 分析。",
    action: "问 AI",
    module: "ai"
  },
  {
    title: "生成第一份报告",
    desc: "把 AI 分析沉淀成可保存、可下载、可回看的报告。",
    action: "生成报告",
    module: "wallet"
  }
];

const recommendedActions: {
  title: string;
  desc: string;
  tag: string;
  module: DashboardModule;
  icon: typeof CalendarDays;
}[] = [
  {
    title: "生成事业报告",
    desc: "今日事业 91 分，适合把合作机会整理成行动计划。",
    tag: "推荐",
    module: "wallet",
    icon: FileText
  },
  {
    title: "问 AI 合作风险",
    desc: "今天适合谈合作，但先确认边界、预算和时间表。",
    tag: "高转化",
    module: "ai",
    icon: Bot
  },
  {
    title: "查看办公室布局套装",
    desc: "适合把事业运势落到空间与工作区调整。",
    tag: "商城",
    module: "shop",
    icon: ShoppingBag
  },
  {
    title: "学习商业择日课程",
    desc: "把好运窗口变成可复制的商业决策方法。",
    tag: "课程",
    module: "courses",
    icon: BookOpenCheck
  }
];

const moodOptions = [
  {
    label: "顺",
    desc: "适合推进合作",
    prompt: "我今天状态很顺，适合把哪个机会推进到下一步？"
  },
  {
    label: "卡",
    desc: "适合先找阻力点",
    prompt: "我最近做事很卡，问题可能出在时机、方向还是行动方式？"
  },
  {
    label: "累",
    desc: "适合低消耗复盘",
    prompt: "我今天状态比较累，有什么低消耗但有效的开运行动？"
  },
  {
    label: "焦虑",
    desc: "适合风险拆解",
    prompt: "我现在有点焦虑，能帮我拆解当前最大的风险和最稳的下一步吗？"
  },
  {
    label: "有动力",
    desc: "适合冲刺任务",
    prompt: "我今天很有动力，适合优先处理事业、财务还是关系上的哪件事？"
  }
] as const;

const favoriteItems = [
  { type: "AI 回复", title: "开新店前先确认选址与预算", desc: "来自 AI 风水师对开业问题的初步建议。" },
  { type: "报告", title: "财运报告 · 守正现金流", desc: "正财稳定，偏财不宜冒进。" },
  { type: "运势", title: "05/04 宜签约", desc: "适合发布、合作、签约与客户邀约。" },
  { type: "产品", title: "办公室布局套装", desc: "适合把事业运势落到空间调整。" },
  { type: "课程", title: "商业择日与开业布局", desc: "适合创业者学习择时与动线逻辑。" },
  { type: "行动", title: "每周五财务复盘", desc: "固定整理现金流、应收款与预算。" },
  { type: "分享卡", title: "今日事业评分 91", desc: "可用于社群分享与推荐转化。" },
  { type: "洞察", title: "先整理后扩张", desc: "本周适合先做清单，再谈资源。" }
] as const;

type SavedReport = {
  id: string;
  title: string;
  tag: string;
  points: number;
  createdAt: string;
  summary: string;
  sections: {
    title: string;
    content: string;
  }[];
};

const reportContent: Record<string, Omit<SavedReport, "id" | "createdAt" | "tag" | "points">> = {
  财运报告: {
    title: "财运报告",
    summary: "近期财运以守正为主，适合先稳定现金流，再寻找低风险扩张机会。",
    sections: [
      { title: "财运趋势", content: "正财稳定，偏财不宜冒进。未来 14 天适合整理账目、回收应收款、减少情绪型消费。" },
      { title: "风险提醒", content: "不宜在信息不足时做大额投资，尤其避免听信未经验证的快速收益承诺。" },
      { title: "行动建议", content: "把预算分成固定支出、成长投入和机会资金三类，每周复盘一次资金流向。" }
    ]
  },
  事业报告: {
    title: "事业报告",
    summary: "事业能量偏向合作与资源整合，适合主动沟通，但不宜一次承诺过多。",
    sections: [
      { title: "事业趋势", content: "当前适合推进谈判、提案、客户关系维护，尤其有利于把旧资源重新整理成新机会。" },
      { title: "风险提醒", content: "容易因为想快速扩张而分散注意力，需要先确认优先级与执行节奏。" },
      { title: "行动建议", content: "本周先锁定一个最重要合作对象，准备清晰方案、预算和下一步时间表。" }
    ]
  },
  合盘报告: {
    title: "合盘报告",
    summary: "关系互动重点在沟通节奏与边界，适合用温和方式确认真实需求。",
    sections: [
      { title: "关系状态", content: "双方有互补空间，但沟通速度不同，容易出现一方想推进、一方想观察的节奏差。" },
      { title: "风险提醒", content: "避免用试探代替表达，也不要把短期情绪当成长期判断。" },
      { title: "行动建议", content: "选择轻松场景沟通，先谈事实与期待，再谈承诺与计划。" }
    ]
  },
  流年报告: {
    title: "流年报告",
    summary: "今年适合先打基础再放大成果，关键在长期布局与稳定复盘。",
    sections: [
      { title: "年度主题", content: "流年重点是累积信用、提升专业度和建立可持续收入结构。" },
      { title: "风险提醒", content: "上半年不宜频繁换方向，下半年适合把成熟项目系统化。" },
      { title: "行动建议", content: "每季度设定一个核心目标，围绕现金流、能力、关系三条线推进。" }
    ]
  },
  开业择日报告: {
    title: "开业择日报告",
    summary: "开业策略宜先稳后旺，日期选择需配合行业属性、负责人命盘与场地动线。",
    sections: [
      { title: "择日方向", content: "优先选择有利于签约、启动、曝光和稳定客流的日期，并避开冲动决策日。" },
      { title: "空间建议", content: "入口保持明亮整洁，收银与接待区宜减少杂物，强化第一眼信任感。" },
      { title: "行动建议", content: "开业前 7 天完成试运营、客户邀约、动线测试和开业当天 SOP。" }
    ]
  },
  公司风水初步分析: {
    title: "公司风水初步分析",
    summary: "公司空间重点在动线、采光、座位方向与团队沟通区的能量分布。",
    sections: [
      { title: "空间观察", content: "办公区需要保持核心通道清晰，管理位应避免背后空荡或长期受干扰。" },
      { title: "风险提醒", content: "杂物堆积、暗角、座位冲门和团队沟通断层，都会影响执行效率。" },
      { title: "行动建议", content: "先从入口、会议区、负责人座位和财务文件区四个位置做基础调整。" }
    ]
  }
};

const reportStorageKey = "ai-fengshui-saved-reports";

function formatReportText(report: SavedReport) {
  return [
    `AI Feng Shui Master - ${report.title}`,
    `生成时间：${report.createdAt}`,
    `类型：${report.tag}`,
    "",
    "报告摘要",
    report.summary,
    "",
    ...report.sections.flatMap((section) => [section.title, section.content, ""]),
    "免责声明：本报告为 AI 命理与风水辅助建议，仅供参考，不构成投资、医疗、法律或重大人生决策的唯一依据。"
  ].join("\n");
}

function createSavedReport(report: (typeof reportTypes)[number]): SavedReport {
  const content = reportContent[report.title] || reportContent["财运报告"];

  return {
    id: `${report.title}-${Date.now()}`,
    title: content.title,
    tag: report.tag,
    points: report.points,
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary: content.summary,
    sections: content.sections
  };
}

function downloadReport(report: SavedReport) {
  const blob = new Blob([formatReportText(report)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.title}-${report.createdAt.replace(/[/:\\s]/g, "-")}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ModuleCard({
  module,
  active,
  onClick
}: {
  module: (typeof modules)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-[156px] rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        active
          ? "border-[#D4AF37]/70 bg-[#064E3B] text-white shadow-soft"
          : "border-black/10 bg-white text-ink hover:border-[#D4AF37]/45"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`grid size-11 place-items-center rounded ${
            active ? "bg-white/12 text-[#D4AF37]" : "bg-[#ECFDF5] text-[#064E3B]"
          }`}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={`rounded px-2.5 py-1 text-xs font-semibold ${
            active ? "bg-[#D4AF37] text-[#062F25]" : "bg-[#F7F7F7] text-ink/55"
          }`}
        >
          {module.metric}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold">{module.title}</h3>
      <p className={`mt-2 text-sm leading-6 ${active ? "text-white/68" : "text-ink/55"}`}>{module.desc}</p>
      <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${active ? "text-[#D4AF37]" : "text-[#064E3B]"}`}>
        打开模块 <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function OnboardingPanel({ onOpenModule }: { onOpenModule: (module: DashboardModule) => void }) {
  const [completedSteps, setCompletedSteps] = useState(() => new Set([0]));

  function handleStep(step: (typeof onboardingSteps)[number], index: number) {
    setCompletedSteps((current) => new Set(current).add(index));
    onOpenModule(step.module);
  }

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded border border-black/10 bg-[#102019] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">New Member Path</p>
            <h2 className="mt-2 text-2xl font-semibold">新手 4 步引导</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              让新会员知道先做什么，避免进入 Dashboard 后不知道怎么开始。
            </p>
          </div>
          <span className="rounded bg-[#D4AF37] px-3 py-1 text-sm font-semibold text-[#062F25]">
            {completedSteps.size} / {onboardingSteps.length}
          </span>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/12">
          <div
            className="h-2 rounded-full bg-[#D4AF37]"
            style={{ width: `${(completedSteps.size / onboardingSteps.length) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-white/52">完成全部步骤后，可解锁一次“周趋势总结”入口。</p>
      </div>

      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {onboardingSteps.map((step, index) => {
            const isDone = completedSteps.has(index);

            return (
              <button
                key={step.title}
                type="button"
                onClick={() => handleStep(step, index)}
                className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  isDone ? "border-[#064E3B]/25 bg-[#ECFDF5]" : "border-black/10 bg-rice"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-8 place-items-center rounded ${isDone ? "bg-[#064E3B] text-white" : "bg-white text-ink/45"}`}>
                    <CheckCircle2 className="size-4" />
                  </span>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#064E3B]">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/58">{step.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#064E3B]">
                  {step.action} <ChevronRight className="size-4" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TodayRecommendedActions({ onOpenModule }: { onOpenModule: (module: DashboardModule) => void }) {
  return (
    <section className="mt-6 rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#B08919]" />
            <h2 className="text-xl font-semibold">今日推荐行动</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/58">
            根据今日评分自动推荐下一步，把运势变成报告、AI 问答、产品和课程的成交闭环。
          </p>
        </div>
        <StatusPill>今日事业 91 分</StatusPill>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {recommendedActions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              type="button"
              onClick={() => onOpenModule(action.module)}
              className="group rounded border border-black/10 bg-rice p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded bg-[#ECFDF5] text-[#064E3B]">
                  <Icon className="size-5" />
                </span>
                <span className="rounded bg-[#D4AF37]/15 px-2 py-1 text-xs font-semibold text-[#064E3B]">{action.tag}</span>
              </div>
              <h3 className="mt-4 font-semibold">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/58">{action.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#064E3B]">
                立即查看 <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MoodCheckInPanel({ onOpenModule }: { onOpenModule: (module: DashboardModule) => void }) {
  const [selectedMood, setSelectedMood] = useState<(typeof moodOptions)[number]>(moodOptions[1]);

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HeartPulse className="size-5 text-[#B08919]" />
              <h2 className="text-xl font-semibold">今日状态打卡</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/58">
              用户每天记录状态，系统就能推荐更贴近当下的 AI 问题、报告和开运任务。
            </p>
          </div>
          <span className="rounded bg-[#ECFDF5] px-3 py-1 text-sm font-semibold text-[#064E3B]">
            已打卡
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {moodOptions.map((mood) => {
            const active = selectedMood.label === mood.label;

            return (
              <button
                key={mood.label}
                type="button"
                onClick={() => setSelectedMood(mood)}
                className={`rounded border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  active ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-black/10 bg-rice"
                }`}
              >
                <p className="text-xl font-semibold text-[#064E3B]">{mood.label}</p>
                <p className="mt-1 text-xs leading-5 text-ink/55">{mood.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded border border-black/10 bg-[#102019] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">基于状态推荐</p>
            <h3 className="mt-2 text-2xl font-semibold">从“{selectedMood.label}”开始问 AI</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">{selectedMood.prompt}</p>
          </div>
          <Bot className="size-8 text-[#D4AF37]" />
        </div>
        <button
          type="button"
          onClick={() => onOpenModule("ai")}
          className="mt-5 inline-flex items-center gap-2 rounded bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-[#062F25]"
        >
          带着这个问题去问 AI <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function TodayFortune() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded border border-black/10 bg-[#102019] p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/58">今日运势</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">稳中有进，先整理后扩张</h2>
          </div>
          <CalendarDays className="size-9 text-[#D4AF37]" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr]">
          <div className="rounded border border-[#D4AF37]/35 bg-[#D4AF37]/12 p-4">
            <p className="text-xs text-white/55">今日评分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-semibold leading-none text-[#D4AF37]">89</span>
              <span className="pb-1 text-sm text-white/52">/100</span>
            </div>
            <p className="mt-3 text-xs text-white/62">适合推进合作与整理计划</p>
          </div>
          <div className="rounded border border-white/12 bg-white/8 p-4">
            <div className="grid gap-4">
              {fortuneScores.map(([label, score, note]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-white">{label}</span>
                    <span className="text-[#D4AF37]">{score}/100</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${score}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-white/52">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {fortuneCards.map(([label, value]) => (
            <div key={label} className="rounded border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">{label}</p>
              <p className="mt-2 font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded bg-white/8 p-3">
            <Palette className="size-4 text-[#D4AF37]" />
            <p className="mt-2 text-sm">幸运色：青绿</p>
          </div>
          <div className="rounded bg-white/8 p-3">
            <TrendingUp className="size-4 text-[#D4AF37]" />
            <p className="mt-2 text-sm">贵人方：东南</p>
          </div>
          <div className="rounded bg-white/8 p-3">
            <Flame className="size-4 text-[#D4AF37]" />
            <p className="mt-2 text-sm">今日宜：复盘</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink/55">连续签到</p>
              <p className="mt-2 text-4xl font-semibold">7 天</p>
            </div>
            <span className="grid size-11 place-items-center rounded bg-[#D4AF37]/15 text-[#B08919]">
              <Sparkles className="size-5" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1">
            {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
              <div key={day} className="grid aspect-square place-items-center rounded bg-[#064E3B] text-xs font-semibold text-white">
                {day}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-ink/60">保持 14 天可解锁一次免费深度分析。</p>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">今日开运任务</h2>
            <span className="rounded bg-[#F7F7F7] px-2.5 py-1 text-xs font-medium text-ink/58">3 / 3</span>
          </div>
          <div className="grid gap-3">
            {dailyRituals.map((item) => (
              <div key={item.title} className="flex gap-3 rounded border border-black/10 bg-[#F7F7F7] p-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#064E3B]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <span className="shrink-0 rounded bg-white px-2 py-1 text-xs text-[#064E3B]">{item.reward}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-ink/58">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">最近洞察</h2>
            <span className="rounded bg-[#F7F7F7] px-2.5 py-1 text-xs font-medium text-ink/58">AI 总结</span>
          </div>
          <div className="grid gap-3">
            {recentInsights.map((item) => (
              <div key={item.title} className="rounded border border-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <span className="rounded bg-[#D4AF37]/15 px-2 py-1 text-xs text-ink">{item.tag}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/58">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FortuneCalendarModule() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#064E3B]">Fortune Calendar</p>
            <h2 className="mt-2 text-2xl font-semibold">14 天运势日历</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              让用户每天回来查看分数、宜忌与行动窗口。后续接数据库后，可记录真实每日趋势。
            </p>
          </div>
          <StatusPill>本周高峰：05/04</StatusPill>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fortuneCalendarDays.map((item) => (
            <button
              key={`${item.date}-${item.tag}`}
              type="button"
              className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                item.tone === "gold"
                  ? "border-[#D4AF37]/45 bg-[#D4AF37]/10"
                  : item.tone === "green"
                    ? "border-[#064E3B]/15 bg-[#ECFDF5]"
                    : "border-black/10 bg-[#F7F7F7]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{item.day}</span>
                <span className="text-xs text-ink/50">{item.date}</span>
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-semibold text-[#064E3B]">{item.score}</span>
                <span className="pb-1 text-xs text-ink/45">/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-[#D4AF37]" style={{ width: `${item.score}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink/72">{item.tag}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-[#102019] p-5 text-white shadow-soft">
          <CalendarDays className="size-8 text-[#D4AF37]" />
          <h3 className="mt-4 text-2xl font-semibold">最佳行动窗口</h3>
          <div className="mt-5 grid gap-3">
            {[
              ["05/04", "适合签约、发布、谈合作"],
              ["05/08", "适合整理现金流与收款"],
              ["05/11", "贵人日，适合主动联系关键人物"]
            ].map(([date, text]) => (
              <div key={date} className="rounded border border-white/12 bg-white/8 p-3">
                <p className="text-sm font-semibold text-[#D4AF37]">{date}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold">下次回来理由</h3>
          <p className="mt-3 text-sm leading-6 text-ink/60">
            明天会刷新事业与财运评分。连续查看 7 天后，可解锁一份“周趋势总结”。
          </p>
          <div className="mt-4 rounded border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-4">
            <p className="text-sm font-semibold text-[#064E3B]">连续查看进度</p>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-2 w-[72%] rounded-full bg-[#064E3B]" />
            </div>
            <p className="mt-2 text-xs text-ink/55">5 / 7 天，差 2 天解锁周总结</p>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">周趋势总结</h3>
              <p className="mt-2 text-sm leading-6 text-ink/58">连续查看 7 天后自动解锁，形成长期留存闭环。</p>
            </div>
            <LockKeyhole className="size-7 text-[#B08919]" />
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ["本周最高分", "05/04 · 92 分"],
              ["本周风险日", "05/05 · 忌冲动"],
              ["本周建议", "先整理现金流，再推进签约"]
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-black/10 bg-rice p-3 opacity-70">
                <p className="text-xs text-ink/45">{label}</p>
                <p className="mt-1 font-semibold blur-[2px]">{value}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded bg-[#064E3B] px-4 py-3 text-sm font-semibold text-white">
            再查看 2 天解锁
          </button>
        </div>
      </div>
    </section>
  );
}

function DestinyProfileModule() {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded border border-black/10 bg-[#102019] p-6 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">Personal Destiny Profile</p>
            <h2 className="mt-2 text-3xl font-semibold">Lim Mei 的个人命盘</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              先用视觉化资料建立“系统懂我”的感觉。接 Auth 后这里会读取用户真实生日、时间、地区与性别。
            </p>
          </div>
          <UserRound className="size-9 text-[#D4AF37]" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["出生日期", "1990-08-18"],
            ["出生时间", "09:30"],
            ["地区", "Kuala Lumpur"],
            ["年度关键词", "稳中扩张"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/12 bg-white/8 p-3">
              <p className="text-xs text-white/45">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-4">
          <p className="text-sm font-semibold text-[#D4AF37]">专属建议</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            今年适合先建立稳定现金流和清晰合作边界，再逐步扩大项目规模。每次重大决策前，建议先做择时与风险复盘。
          </p>
        </div>
      </div>

      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold">五行强弱</h3>
            <p className="mt-2 text-sm leading-6 text-ink/58">用简单图形让用户快速理解自己的状态与建议。</p>
          </div>
          <StatusPill>Plus 专属</StatusPill>
        </div>

        <div className="mt-6 grid gap-4">
          {fiveElementProfile.map(([element, score, note]) => (
            <div key={element} className="rounded border border-black/10 bg-rice p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{element} · {score}/100</p>
                  <p className="mt-1 text-sm text-ink/55">{note}</p>
                </div>
                <span className="grid size-10 place-items-center rounded bg-[#ECFDF5] font-semibold text-[#064E3B]">
                  {element}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-[#064E3B]" style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {destinyKeywords.map((keyword) => (
            <div key={keyword} className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-3 text-sm font-semibold text-[#064E3B]">
              {keyword}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GrowthPlaybookModule() {
  const [completed, setCompleted] = useState(() => new Set([0, 1]));
  const completedCount = completed.size;

  function toggleTask(index: number) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#064E3B]">Daily Growth Loop</p>
            <h2 className="mt-2 text-2xl font-semibold">每日任务与奖励</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              让用户每天有事可做、有奖励可拿、有理由回来。现在先做前端交互，后续接点数系统。
            </p>
          </div>
          <span className="rounded bg-[#D4AF37] px-3 py-1 text-sm font-semibold text-[#062F25]">
            {completedCount} / {growthTasks.length}
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {growthTasks.map((task, index) => {
            const isDone = completed.has(index);

            return (
              <button
                key={task.title}
                type="button"
                onClick={() => toggleTask(index)}
                className={`flex gap-3 rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  isDone ? "border-[#064E3B]/25 bg-[#ECFDF5]" : "border-black/10 bg-rice"
                }`}
              >
                <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded ${isDone ? "bg-[#064E3B] text-white" : "bg-white text-ink/45"}`}>
                  <CheckCircle2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{task.title}</span>
                    <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-[#064E3B]">{task.reward}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-ink/58">{task.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#064E3B]">距离 Pro 升级</p>
            <span className="text-sm font-semibold">72%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white">
            <div className="h-2 w-[72%] rounded-full bg-[#064E3B]" />
          </div>
          <p className="mt-2 text-sm text-ink/58">还差 320 点消费、1 份报告或 3 次分享。</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-[#102019] p-5 text-white shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/55">今日分享卡</p>
              <h3 className="mt-1 text-2xl font-semibold">我的事业评分 91</h3>
            </div>
            <Share2 className="size-8 text-[#D4AF37]" />
          </div>
          <div className="mt-6 rounded border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-5 text-center">
            <p className="text-sm text-white/60">今日运势</p>
            <p className="mt-2 text-6xl font-semibold text-[#D4AF37]">89</p>
            <p className="mt-3 text-xl font-semibold">稳中有进，先整理后扩张</p>
            <p className="mt-4 text-sm leading-6 text-white/65">幸运色：青绿 · 贵人方：东南 · 今日宜：复盘</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded bg-white/8 p-3">
            <p className="text-sm text-white/70">推荐码：FENG-LIM88</p>
            <button className="rounded bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-[#062F25]">
              预览海报
            </button>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-[#B08919]" />
            <h3 className="text-xl font-semibold">成就徽章</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {achievementBadges.map(([badge, status]) => (
              <div key={badge} className="rounded border border-black/10 bg-rice p-3">
                <Trophy className="size-4 text-[#B08919]" />
                <p className="mt-2 text-sm font-semibold">{badge}</p>
                <p className="mt-1 text-xs text-ink/50">{status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FavoritesVaultModule() {
  const [activeType, setActiveType] = useState("全部");
  const types = ["全部", ...Array.from(new Set(favoriteItems.map((item) => item.type)))];
  const filteredItems = activeType === "全部" ? favoriteItems : favoriteItems.filter((item) => item.type === activeType);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded border border-black/10 bg-[#102019] p-5 text-white shadow-soft">
        <BookmarkCheck className="size-9 text-[#D4AF37]" />
        <h2 className="mt-4 text-3xl font-semibold">我的收藏夹</h2>
        <p className="mt-3 text-sm leading-6 text-white/68">
          把 AI 回复、报告、运势日历、产品、课程和行动建议集中保存，形成用户自己的命理决策库。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["收藏总数", "8"],
            ["本周新增", "3"],
            ["待行动", "2"],
            ["可分享", "4"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/12 bg-white/8 p-3">
              <p className="text-xs text-white/45">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold">灵感与行动库</h3>
            <p className="mt-2 text-sm leading-6 text-ink/58">后续接数据库后，用户收藏的 AI 回复和报告会永久保存。</p>
          </div>
          <StatusPill>{filteredItems.length} 项</StatusPill>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`shrink-0 rounded px-3 py-2 text-sm font-semibold ${
                activeType === type ? "bg-[#064E3B] text-white" : "border border-black/10 bg-rice text-ink/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div key={`${item.type}-${item.title}`} className="rounded border border-black/10 bg-rice p-4 transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded bg-[#D4AF37]/15 px-2 py-1 text-xs font-semibold text-[#064E3B]">{item.type}</span>
                <BookmarkCheck className="size-4 text-[#B08919]" />
              </div>
              <h4 className="mt-4 font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-ink/58">{item.desc}</p>
              <button className="mt-4 text-sm font-semibold text-[#064E3B]">打开查看</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WalletAndReports() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(reportStorageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as SavedReport[];
      setSavedReports(parsed);
      setSelectedReport(parsed[0] || null);
    } catch {
      window.localStorage.removeItem(reportStorageKey);
    }
  }, []);

  function handleOpenReport(report: (typeof reportTypes)[number]) {
    const generated = createSavedReport(report);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
  }

  function handleSelectSaved(report: SavedReport) {
    setSelectedReport(report);
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-[#B08919]" />
            <h2 className="text-xl font-semibold">点数钱包</h2>
          </div>
          <button className="rounded bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#991B1B]">
            充值点数
          </button>
        </div>
        <div className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
          <p className="text-sm text-ink/55">当前可用点数</p>
          <p className="mt-2 text-4xl font-semibold text-[#064E3B]">2,680</p>
          <p className="mt-2 text-sm text-ink/55">点数只用于平台功能，不可提现。</p>
        </div>
        <div className="mt-4">
          {walletRecords.map(([label, value]) => (
            <div key={label} className="flex justify-between border-t border-black/10 py-3 text-sm">
              <span className="text-ink/65">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#064E3B]">AI Report Center</p>
            <h2 className="mt-2 text-2xl font-semibold">报告中心</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              用点数生成财运、事业、感情、合盘、流年、择日与公司风水分析报告。
            </p>
          </div>
          <StatusPill>可生成 2 份 PDF</StatusPill>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reportTypes.map((report) => (
                <button
                  key={report.title}
                  type="button"
                  onClick={() => handleOpenReport(report)}
                  className="group rounded border border-black/10 bg-rice p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <FileText className="size-5 text-[#064E3B]" />
                    <span className="rounded bg-[#F7F7F7] px-2 py-1 text-xs text-ink/60">{report.tag}</span>
                  </div>
                  <p className="mt-4 font-semibold">{report.title}</p>
                  <p className="mt-2 text-sm text-ink/55">消耗 {report.points} 点</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#064E3B]">
                    生成并查看报告 <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded border border-black/10 bg-[#F7F7F7] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Archive className="size-4 text-[#064E3B]" />
                  <h3 className="font-semibold">我的报告档案</h3>
                </div>
                <span className="rounded bg-white px-2.5 py-1 text-xs text-ink/55">{savedReports.length} 份</span>
              </div>
              <div className="mt-3 max-h-72 overflow-y-auto pr-1 scrollbar-soft">
                {savedReports.length ? (
                  savedReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => handleSelectSaved(report)}
                      className={`flex w-full items-center justify-between gap-3 border-t border-black/10 py-3 text-left first:border-t-0 ${
                        selectedReport?.id === report.id ? "text-[#064E3B]" : "text-ink"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{report.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink/50">{report.createdAt}</span>
                      </span>
                      <Eye className="size-4 shrink-0 text-ink/38" />
                    </button>
                  ))
                ) : (
                  <div className="rounded border border-dashed border-black/15 bg-white p-4 text-sm leading-6 text-ink/55">
                    点击上方任一报告后，系统会自动生成并保存到这里，用户之后可以随时找回。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
            {selectedReport ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#064E3B]">Saved Report</p>
                    <h3 className="mt-2 text-2xl font-semibold">{selectedReport.title}</h3>
                    <p className="mt-2 text-sm text-ink/55">生成时间：{selectedReport.createdAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadReport(selectedReport)}
                    className="inline-flex items-center gap-2 rounded bg-[#064E3B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#053C2F]"
                  >
                    <Download className="size-4" /> 下载报告
                  </button>
                </div>

                <div className="mt-5 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
                  <p className="text-sm font-semibold text-[#064E3B]">报告摘要</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{selectedReport.summary}</p>
                </div>

                <div className="mt-5 grid gap-3">
                  {selectedReport.sections.map((section) => (
                    <div key={section.title} className="rounded border border-black/10 bg-rice p-4">
                      <p className="font-semibold">{section.title}</p>
                      <p className="mt-2 text-sm leading-6 text-ink/62">{section.content}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded bg-[#F7F7F7] p-3 text-xs leading-5 text-ink/50">
                  免责声明：本报告为 AI 命理与风水辅助建议，仅供参考，不构成投资、医疗、法律或重大人生决策的唯一依据。
                </p>
              </div>
            ) : (
              <div className="grid min-h-[440px] place-items-center rounded border border-dashed border-black/15 bg-[#F7F7F7] p-8 text-center">
                <div>
                  <FileText className="mx-auto size-10 text-[#064E3B]" />
                  <h3 className="mt-4 text-xl font-semibold">选择一个报告开始生成</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-ink/55">
                    点击左侧报告类型后，这里会显示完整报告内容，并自动保存到“我的报告档案”。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductModule() {
  return (
    <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-[#064E3B]" />
          <h2 className="text-xl font-semibold">产品商城</h2>
        </div>
        <p className="text-sm text-ink/55">点击产品图可进入完整介绍，购买可赠送点数。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {dashboardProducts.map((product) => (
          <Link
            key={product.name}
            href={`/dashboard/products/${product.slug}`}
            className="group overflow-hidden rounded border border-black/10 bg-rice transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="p-4">
              <p className="text-xs font-medium text-[#B91C1C]">{product.category}</p>
              <h3 className="mt-2 min-h-10 font-semibold leading-5">{product.name}</h3>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[#064E3B]">{product.price}</span>
                <span className="rounded bg-[#F7F7F7] px-2 py-1 text-xs text-ink/58">{product.points}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-[#064E3B]">
                查看完整介绍
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CourseModule() {
  return (
    <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="size-5 text-[#B91C1C]" />
          <h2 className="text-xl font-semibold">课程推荐</h2>
        </div>
        <p className="text-sm text-ink/55">从入门、直播到导师认证，完成课程也可获赠点数。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {dashboardCourses.map((course) => (
          <Link
            key={course.name}
            href={`/dashboard/courses/${course.slug}`}
            className="group overflow-hidden rounded border border-black/10 bg-rice transition hover:-translate-y-0.5 hover:shadow-soft"
          >
            <img
              src={course.image}
              alt={course.name}
              className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="p-4">
              <p className="text-xs font-medium text-[#B91C1C]">{course.category}</p>
              <h3 className="mt-2 min-h-10 font-semibold leading-5">{course.name}</h3>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[#064E3B]">{course.price}</span>
                <span className="rounded bg-[#F7F7F7] px-2 py-1 text-xs text-ink/58">{course.reward}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-[#064E3B]">
                查看课程详情
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<DashboardModule>("fortune");
  const active = modules.find((module) => module.id === activeModule) || modules[0];

  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <StatusPill>Plus 会员 · 2,680 点可用</StatusPill>
                <h1 className="mt-4 text-3xl font-semibold md:text-5xl">会员中心</h1>
                <p className="mt-3 max-w-2xl text-ink/65">
                  每日运势、AI 风水师、报告中心、点数钱包、商城课程和推荐团队都整理成模块。先看重点，再打开细节。
                </p>
              </div>
              <button className="inline-flex items-center gap-2 rounded bg-[#064E3B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#053C2F]">
                充值点数 <CreditCard className="size-4" />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dashboardStats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          <OnboardingPanel onOpenModule={setActiveModule} />
          <TodayRecommendedActions onOpenModule={setActiveModule} />
          <MoodCheckInPanel onOpenModule={setActiveModule} />

          <section className="mt-6 rounded border border-black/10 bg-[#F7F7F7] p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-5 text-[#064E3B]" />
                <h2 className="text-xl font-semibold">功能模块</h2>
              </div>
              <p className="text-sm text-ink/55">当前打开：{active.title}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  active={module.id === activeModule}
                  onClick={() => setActiveModule(module.id)}
                />
              ))}
            </div>
          </section>

          <section className="mt-6">
            {activeModule === "fortune" ? <TodayFortune /> : null}
            {activeModule === "calendar" ? <FortuneCalendarModule /> : null}
            {activeModule === "profile" ? <DestinyProfileModule /> : null}
            {activeModule === "growth" ? <GrowthPlaybookModule /> : null}
            {activeModule === "vault" ? <FavoritesVaultModule /> : null}
            {activeModule === "ai" ? <FengshuiChat /> : null}
            {activeModule === "wallet" ? <WalletAndReports /> : null}
            {activeModule === "shop" ? <ProductModule /> : null}
            {activeModule === "courses" ? <CourseModule /> : null}
            {activeModule === "team" ? <HierarchyTree /> : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
