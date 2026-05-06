"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { demoMemberProfile, type MemberProfile } from "@/lib/member-profile";
import { profileRowToMemberProfile } from "@/lib/profile-adapter";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type DashboardModule =
  | "fortune"
  | "calendar"
  | "profile"
  | "growth"
  | "vault"
  | "ai"
  | "divination"
  | "sigil"
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
    desc: "评分 + 行动",
    metric: "AI 89",
    icon: CalendarDays
  },
  {
    id: "calendar",
    title: "运势日历",
    desc: "14 天窗口",
    metric: "14 天",
    icon: TrendingUp
  },
  {
    id: "profile",
    title: "个人命盘",
    desc: "十二宫 + 五行",
    metric: "专属",
    icon: UserRound
  },
  {
    id: "growth",
    title: "成长玩法",
    desc: "任务 + 徽章",
    metric: "72%",
    icon: Trophy
  },
  {
    id: "vault",
    title: "收藏夹",
    desc: "灵感档案",
    metric: "8 项",
    icon: BookmarkCheck
  },
  {
    id: "ai",
    title: "AI 风水师",
    desc: "紫微 + 梅花",
    metric: "24/7",
    icon: Bot
  },
  {
    id: "divination",
    title: "九运问卦",
    desc: "三数起卦",
    metric: "36 点",
    icon: Flame
  },
  {
    id: "sigil",
    title: "Sigil 符印",
    desc: "意图图形化",
    metric: "88 点",
    icon: Sparkles
  },
  {
    id: "wallet",
    title: "钱包与报告",
    desc: "点数 + 报告",
    metric: "2,680 点",
    icon: WalletCards
  },
  {
    id: "shop",
    title: "产品商城",
    desc: "开运产品",
    metric: "5 类",
    icon: ShoppingBag
  },
  {
    id: "courses",
    title: "课程学习",
    desc: "课程路径",
    metric: "5 类",
    icon: BookOpenCheck
  },
  {
    id: "team",
    title: "推荐团队",
    desc: "三层团队",
    metric: "46 人",
    icon: Network
  }
];

type MembershipTier = "free" | "tactical" | "strategic";

const membershipTiers: {
  id: MembershipTier;
  name: string;
  price: string;
  positioning: string;
  aiMode: string;
  dataDepth: string;
  features: string[];
  locked?: string[];
}[] = [
  {
    id: "free",
    name: "Free 免费版",
    price: "RM0",
    positioning: "情绪晴雨表",
    aiMode: "低算力 · 静态短句库",
    dataDepth: "仅当天星级评分",
    features: ["今日财运/事业/人缘星级", "一句话宜忌", "每日打卡", "基础收藏"],
    locked: ["每周运势", "AI 深度解析", "流月/流年战略"]
  },
  {
    id: "tactical",
    name: "进阶会员版",
    price: "RM39.90/月",
    positioning: "紫微 + 梅花战术指南",
    aiMode: "中算力 · 紫微矩阵 + 梅花象意",
    dataDepth: "每日 + 每周 + 100-200 字 AI 解读",
    features: ["每日/每周运势", "紫微 + 梅花双引擎", "幸运色与贵人方", "谈判时辰", "报告中心"],
    locked: ["流月/流年", "战略顾问问答", "商业策略报告"]
  },
  {
    id: "strategic",
    name: "高阶战略版",
    price: "RM69.90/月",
    positioning: "紫微 + 梅花私人顾问",
    aiMode: "高算力 · 紫微/梅花 + 本命/流年/流月/流日",
    dataDepth: "全周期趋势 + 商业决策建议",
    features: ["流月/流年趋势", "梅花易数即时决策", "战略顾问 AI 对话", "化解与布局建议", "商业五行策略", "高级报告额度"]
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

const todayActionCards: {
  title: string;
  desc: string;
  module: DashboardModule;
  icon: typeof CalendarDays;
  tone: "gold" | "green" | "red";
}[] = [
  {
    title: "先看今日运势",
    desc: "89 分 · 宜合作",
    module: "fortune",
    icon: CalendarDays,
    tone: "gold"
  },
  {
    title: "问 AI 一个问题",
    desc: "紫微 + 梅花判断",
    module: "ai",
    icon: Bot,
    tone: "green"
  },
  {
    title: "三数起卦决策",
    desc: "消耗 36 点",
    module: "divination",
    icon: Flame,
    tone: "gold"
  },
  {
    title: "生成意图符印",
    desc: "消耗 88 点",
    module: "sigil",
    icon: Sparkles,
    tone: "red"
  }
];

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

type DailyFortuneResponse = {
  configured: boolean;
  model: string;
  reading: string;
  matrix: {
    date: string;
    overall: number;
    wealth: {
      score: number;
      palace: string;
      signals: string[];
      risks: string[];
    };
    career: {
      score: number;
      palace: string;
      signals: string[];
      risks: string[];
    };
    relationship: {
      score: number;
      palace: string;
      signals: string[];
      risks: string[];
    };
    method: string;
  };
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
const pointsStorageKey = "ai-fengshui-demo-points";
const sigilStorageKey = "ai-fengshui-sigil-vault";
const sigilCost = 88;
const divinationStorageKey = "ai-fengshui-jiuyun-divinations";
const divinationCheckInKey = "ai-fengshui-jiuyun-checkins";
const divinationCost = 36;

type SigilArtifact = {
  id: string;
  title: string;
  hash: string;
  path: string;
  ornamentPath: string;
  dots: { x: number; y: number }[];
  createdAt: string;
  cost: number;
};

type Trigram = {
  key: string;
  name: string;
  symbol: string;
  element: "金" | "木" | "水" | "火" | "土";
  direction: string;
  color: string;
  object: string;
  action: string;
  numbers: string;
  lines: [number, number, number];
};

type DivinationReading = {
  id: string;
  numbers: [number, number, number];
  hourBranch: string;
  createdAt: string;
  originalHexagram: string;
  mutualHexagram: string;
  changingHexagram: string;
  bodyTrigram: Trigram;
  useTrigram: Trigram;
  movingLine: number;
  passElement: Trigram["element"];
  score: number;
  situation: string;
  process: string;
  outcome: string;
  mindset: string;
  actionPlan: {
    timing: string;
    direction: string;
    color: string;
    object: string;
    action: string;
    mantra: string;
  };
};

type DivinationCheckIn = {
  id: string;
  readingTitle: string;
  createdAt: string;
  note: string;
  reward: number;
  status: "待审核" | "已通过";
};

function formatReportText(report: SavedReport, memberProfile: MemberProfile) {
  return [
    `AI Feng Shui Master - ${report.title}`,
    `分析对象：${memberProfile.name}`,
    `出生资料：${memberProfile.birthDate}，${memberProfile.birthTimeLabel}，${memberProfile.gender}`,
    `联系方式：${memberProfile.email}${memberProfile.phone ? ` / ${memberProfile.phone}` : ""}`,
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

function downloadReport(report: SavedReport, memberProfile: MemberProfile) {
  const blob = new Blob([formatReportText(report, memberProfile)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.title}-${report.createdAt.replace(/[/:\\s]/g, "-")}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const trigrams: Trigram[] = [
  {
    key: "qian",
    name: "乾",
    symbol: "☰",
    element: "金",
    direction: "西北方",
    color: "白色 / 金色",
    object: "白水晶、金属铃、颂钵",
    action: "在西北方轻敲颂钵 4 下或 9 下，先定规则再行动。",
    numbers: "4 / 9",
    lines: [1, 1, 1]
  },
  {
    key: "dui",
    name: "兑",
    symbol: "☱",
    element: "金",
    direction: "正西方",
    color: "白色 / 银色",
    object: "白水晶、圆形金属物",
    action: "在正西方整理沟通话术，连续写下 4 个合作边界。",
    numbers: "4 / 9",
    lines: [1, 1, 0]
  },
  {
    key: "li",
    name: "离",
    symbol: "☲",
    element: "火",
    direction: "正南方",
    color: "红色 / 紫色",
    object: "九运香、旭日图、灯光",
    action: "在正南方点燃 2 支或 7 支九运香，完成一件需要曝光的事。",
    numbers: "2 / 7",
    lines: [1, 0, 1]
  },
  {
    key: "zhen",
    name: "震",
    symbol: "☳",
    element: "木",
    direction: "正东方",
    color: "绿色",
    object: "绿植、木质摆件、行动清单",
    action: "在正东方摆放 3 盆或 8 盆绿植，并大声读出今日心法。",
    numbers: "3 / 8",
    lines: [1, 0, 0]
  },
  {
    key: "xun",
    name: "巽",
    symbol: "☴",
    element: "木",
    direction: "东南方",
    color: "青绿 / 浅木色",
    object: "香氛、绿植、文件夹",
    action: "在东南方整理 3 个资源入口，主动联系一位贵人。",
    numbers: "3 / 8",
    lines: [0, 1, 1]
  },
  {
    key: "kan",
    name: "坎",
    symbol: "☵",
    element: "水",
    direction: "正北方",
    color: "黑色 / 蓝色",
    object: "纯净水、蓝色杯、流动水景",
    action: "面向正北方喝 1 杯或 6 杯水，先暂停冲动决定。",
    numbers: "1 / 6",
    lines: [0, 1, 0]
  },
  {
    key: "gen",
    name: "艮",
    symbol: "☶",
    element: "土",
    direction: "东北方",
    color: "黄色 / 大地色",
    object: "黄玉石、陶瓷、米粒",
    action: "在东北方放置 5 粒或 10 粒米，先稳住基本盘。",
    numbers: "5 / 10",
    lines: [0, 0, 1]
  },
  {
    key: "kun",
    name: "坤",
    symbol: "☷",
    element: "土",
    direction: "西南方",
    color: "黄色 / 米色",
    object: "黄玉、陶土、方形收纳",
    action: "在西南方放置 5 个稳定物件，把杂乱事务归位。",
    numbers: "5 / 10",
    lines: [0, 0, 0]
  }
];

const elementBridge: Record<Trigram["element"], Trigram["element"]> = {
  金: "水",
  水: "木",
  木: "火",
  火: "土",
  土: "金"
};

const elementRituals: Record<Trigram["element"], Omit<DivinationReading["actionPlan"], "timing" | "mantra">> = {
  金: {
    direction: "西北方",
    color: "白色 / 金色",
    object: "白水晶、金属铃、颂钵",
    action: "在吉时轻敲颂钵 4 下或 9 下，并写下今天必须遵守的 4 条规则。"
  },
  水: {
    direction: "正北方",
    color: "黑色 / 蓝色",
    object: "纯净水、蓝色杯、流动水景",
    action: "面向正北方喝 1 杯或 6 杯水，把最冲动的决定延后一个时辰。"
  },
  木: {
    direction: "正东方",
    color: "绿色",
    object: "绿植、木质摆件、成长清单",
    action: "在正东方摆放 3 盆或 8 盆绿植，并说出今天最重要的行动口号。"
  },
  火: {
    direction: "正南方",
    color: "红色 / 紫色",
    object: "九运香、灯光、旭日图",
    action: "在正南方点燃 2 支或 7 支九运香，完成一次公开表达或关键发布。"
  },
  土: {
    direction: "西南方",
    color: "黄色 / 大地色",
    object: "黄玉、陶瓷、米粒",
    action: "在西南方放置 5 粒或 10 粒米，先整理桌面与账户，稳定磁场。"
  }
};

const elementProductRecommendations: Record<Trigram["element"], { title: string; desc: string; price: string }[]> = {
  金: [
    { title: "白水晶通关套装", desc: "适合规则、谈判、合作边界与金位布局。", price: "RM188" },
    { title: "颂钵净场工具", desc: "用于 4/9 数理敲击与空间清理。", price: "RM328" }
  ],
  水: [
    { title: "蓝晶水元素杯", desc: "适合冷静决策、复盘与财务降噪。", price: "RM98" },
    { title: "北方流动水摆件", desc: "用于水位稳定与情绪缓冲。", price: "RM268" }
  ],
  木: [
    { title: "东方绿植开运组", desc: "适合启动新计划、增长与贵人连接。", price: "RM128" },
    { title: "成长行动卡", desc: "把木气转成每日可执行任务。", price: "RM68" }
  ],
  火: [
    { title: "九运香能量盒", desc: "适合正南方火位启动、曝光与表达。", price: "RM128" },
    { title: "旭日东升能量图", desc: "用于增强火气、信心与可见度。", price: "RM188" }
  ],
  土: [
    { title: "黄玉稳定套装", desc: "适合西南方布局、稳定现金流与关系基础。", price: "RM188" },
    { title: "土元素收纳盘", desc: "用于整理空间、文件与账户秩序。", price: "RM88" }
  ]
};

const divinationExchangeRewards = [
  ["80 点", "解锁财富方高级测算"],
  ["120 点", "生成九运行动报告"],
  ["180 点", "兑换九运香折扣券"]
] as const;

const hourBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function normalizeDivinationNumber(value: string, fallback: number) {
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTrigramByNumber(value: number) {
  const index = ((value - 1) % 8 + 8) % 8;
  return trigrams[index];
}

function getTrigramByLines(lines: number[]) {
  return trigrams.find((trigram) => trigram.lines.every((line, index) => line === lines[index])) || trigrams[0];
}

function getCurrentHourBranch(date = new Date()) {
  const branchIndex = Math.floor(((date.getHours() + 1) % 24) / 2);
  return hourBranches[branchIndex] || "子";
}

function composeHexagramName(upper: Trigram, lower: Trigram) {
  return `${upper.symbol}${lower.symbol} ${upper.name}上${lower.name}下`;
}

function createDivinationReading(rawNumbers: [string, string, string]): DivinationReading {
  const numbers: [number, number, number] = [
    normalizeDivinationNumber(rawNumbers[0], 3),
    normalizeDivinationNumber(rawNumbers[1], 8),
    normalizeDivinationNumber(rawNumbers[2], 9)
  ];
  const now = new Date();
  const hourBranch = getCurrentHourBranch(now);
  const hourSeed = hourBranches.indexOf(hourBranch) + 1;
  const upper = getTrigramByNumber(numbers[0]);
  const lower = getTrigramByNumber(numbers[1]);
  const movingLine = ((numbers[2] + hourSeed - 1) % 6) + 1;
  const originalLines = [...lower.lines, ...upper.lines];
  const changingLines = originalLines.map((line, index) => (index + 1 === movingLine ? (line ? 0 : 1) : line));
  const mutualLower = getTrigramByLines(originalLines.slice(1, 4));
  const mutualUpper = getTrigramByLines(originalLines.slice(2, 5));
  const changingLower = getTrigramByLines(changingLines.slice(0, 3));
  const changingUpper = getTrigramByLines(changingLines.slice(3, 6));
  const bodyTrigram = movingLine <= 3 ? upper : lower;
  const useTrigram = movingLine <= 3 ? lower : upper;
  const passElement = bodyTrigram.element === useTrigram.element ? elementBridge[bodyTrigram.element] : useTrigram.element;
  const ritual = elementRituals[passElement];
  const score = 68 + ((numbers[0] * 7 + numbers[1] * 5 + numbers[2] * 3 + hourSeed) % 24);

  return {
    id: `jiuyun-${Date.now()}`,
    numbers,
    hourBranch,
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(now),
    originalHexagram: composeHexagramName(upper, lower),
    mutualHexagram: composeHexagramName(mutualUpper, mutualLower),
    changingHexagram: composeHexagramName(changingUpper, changingLower),
    bodyTrigram,
    useTrigram,
    movingLine,
    passElement,
    score,
    situation: `本卦显示当下的核心是“${bodyTrigram.name}体遇${useTrigram.name}用”。你现在不是没有机会，而是需要先分清主次，避免被外部节奏牵着走。`,
    process: `互卦落在${mutualUpper.name}${mutualLower.name}，过程会出现资源重新组合的信号。中段最怕急着证明自己，越稳越容易看见真正的入口。`,
    outcome: `变卦转为${changingUpper.name}${changingLower.name}，最终走向偏向“先调整方法，再打开结果”。今天适合小步推进，不适合一次性押注。`,
    mindset: `今日战略心法：从“我要马上得到答案”转为“我先让局势显露结构”。换位看问题，先处理${useTrigram.element}的外部压力，再补足${passElement}来通关。`,
    actionPlan: {
      timing: `${hourBranch}时后 1 个时辰内，或今天第一个不被打扰的 20 分钟`,
      direction: ritual.direction,
      color: ritual.color,
      object: ritual.object,
      action: ritual.action,
      mantra: `我以${passElement}通关，先看清，再行动。`
    }
  };
}

function normalizeIntent(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .toUpperCase();
}

function distillSigilIntent(input: string) {
  const normalized = normalizeIntent(input);
  const seen = new Set<string>();
  const vowels = new Set(["A", "E", "I", "O", "U"]);
  const chars = Array.from(normalized).filter((char) => {
    if (seen.has(char) || vowels.has(char)) {
      return false;
    }

    seen.add(char);
    return true;
  });

  return chars.slice(0, 18).join("") || "SIGIL";
}

function getIntentGuidance(input: string) {
  const trimmed = input.trim();
  const scarcityPatterns = ["我想要", "我希望", "我不要", "我不想", "缺", "没有", "摆脱", "害怕", "担心"];
  const matched = scarcityPatterns.find((pattern) => trimmed.includes(pattern));

  if (!trimmed) {
    return {
      ok: false,
      message: "请先写下一个明确、肯定、现在式的意图。",
      suggestion: "我稳定地吸引高质量合作机会"
    };
  }

  if (matched) {
    return {
      ok: false,
      message: `检测到“${matched}”这类匮乏或否定表达。Sigil 更适合使用已经发生的肯定句。`,
      suggestion: trimmed
        .replace(/我想要|我希望/g, "我正在")
        .replace(/我不要|我不想|摆脱/g, "我选择")
        .replace(/缺|没有/g, "拥有")
        .replace(/害怕|担心/g, "稳定面对")
    };
  }

  return {
    ok: true,
    message: "意图表达合格：明确、肯定、适合生成符印。",
    suggestion: trimmed
  };
}

function hashIntent(input: string) {
  let hash = 2166136261;

  for (const char of Array.from(input)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function svgCirclePath(cx: number, cy: number, radius: number) {
  return `M ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy}`;
}

function buildSigilPath(distilled: string, hash: string) {
  const chars = Array.from(distilled);
  const seed = parseInt(hash.slice(0, 8), 16) || 1;
  const centerX = 120;
  const centerY = 120;
  const sourceChars = chars.length >= 3 ? chars : Array.from(`${distilled}SIGIL`).slice(0, 8);
  const sacredSlots = [
    { x: centerX, y: 42 },
    { x: 168, y: 72 },
    { x: 184, y: centerY },
    { x: 168, y: 168 },
    { x: centerX, y: 198 },
    { x: 72, y: 168 },
    { x: 56, y: centerY },
    { x: 72, y: 72 },
    { x: centerX, y: 78 },
    { x: 154, y: centerY },
    { x: centerX, y: 162 },
    { x: 86, y: centerY }
  ];
  const picked = sourceChars.slice(0, 8).map((char, index) => {
    const code = char.charCodeAt(0);
    const slot = sacredSlots[(code + seed + index * 3) % sacredSlots.length];
    const snap = ((code + seed + index) % 3) - 1;

    return {
      x: slot.x + snap * 4,
      y: slot.y + (((code >> 2) + index) % 3 - 1) * 4,
      code
    };
  });
  const uniqueDots = picked.reduce<{ x: number; y: number; code: number }[]>((items, dot) => {
    const exists = items.some((item) => Math.abs(item.x - dot.x) < 8 && Math.abs(item.y - dot.y) < 8);
    return exists ? items : [...items, dot];
  }, []);
  const motif = seed % 4;
  const anchorSets = [
    [
      { x: centerX, y: 46 },
      { x: centerX, y: centerY },
      { x: 74, y: 82 },
      { x: 166, y: 158 },
      { x: centerX, y: 194 }
    ],
    [
      { x: 72, y: centerY },
      { x: centerX, y: 76 },
      { x: 168, y: centerY },
      { x: centerX, y: 164 },
      { x: centerX, y: 46 }
    ],
    [
      { x: centerX, y: 46 },
      { x: 166, y: 86 },
      { x: 74, y: centerY },
      { x: 166, y: 154 },
      { x: centerX, y: 194 }
    ],
    [
      { x: centerX, y: 46 },
      { x: 82, y: 112 },
      { x: centerX, y: 194 },
      { x: 158, y: 112 },
      { x: centerX, y: 78 }
    ]
  ];
  const dots = [...anchorSets[motif], ...uniqueDots].slice(0, 9);
  const linePath = dots.map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`).join(" ");
  const end = dots[dots.length - 1];
  const endMark = `M ${end.x - 13} ${end.y} L ${end.x + 13} ${end.y}`;
  const topCircle = svgCirclePath(dots[0].x, dots[0].y, 9);
  const centerCircle = svgCirclePath(centerX, centerY, 13 + (seed % 3) * 3);
  const lowerCircle = seed % 2 === 0 ? svgCirclePath(centerX, 178, 11) : "";
  const crossBar = seed % 3 === 0 ? `M ${centerX - 42} ${centerY} L ${centerX + 42} ${centerY}` : `M ${centerX} 66 L ${centerX} 188`;
  const sideArc =
    seed % 2 === 0
      ? `M 75 92 A 38 38 0 0 0 75 148 M 165 92 A 38 38 0 0 1 165 148`
      : `M 88 78 A 34 34 0 0 1 152 78 M 88 162 A 34 34 0 0 0 152 162`;

  return {
    path: `${linePath} ${endMark}`,
    ornamentPath: `${topCircle} ${centerCircle} ${lowerCircle} ${crossBar} ${sideArc}`,
    dots
  };
}

function createSigilArtifact(intent: string): SigilArtifact {
  const distilled = distillSigilIntent(intent);
  const hash = hashIntent(`${intent}-${Date.now()}`);
  const { path, ornamentPath, dots } = buildSigilPath(distilled, hash);

  return {
    id: `sigil-${Date.now()}`,
    title: `符印 ${hash.slice(0, 4)}`,
    hash,
    path,
    ornamentPath,
    dots,
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    cost: sigilCost
  };
}

function downloadSigil(artifact: SigilArtifact) {
  const nodeDots = [artifact.dots[0], artifact.dots[artifact.dots.length - 1]].filter(Boolean);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="240" height="240" fill="#ffffff"/><circle cx="120" cy="120" r="94" fill="none" stroke="#C79A54" stroke-opacity=".8" stroke-width="2.6"/><circle cx="120" cy="120" r="64" fill="none" stroke="#C79A54" stroke-opacity=".28" stroke-width="2.2"/><path d="${artifact.ornamentPath || ""}" fill="none" stroke="#C79A54" stroke-opacity=".88" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${artifact.path}" fill="none" stroke="#C79A54" stroke-opacity=".98" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#goldGlow)"/>${nodeDots
    .map((dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="8.5" fill="#ffffff" stroke="#C79A54" stroke-width="2.6"/>`)
    .join("")}</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${artifact.title}-${artifact.hash}.svg`;
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
      className={`group rounded border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        active
          ? "border-[#C79A54]/70 bg-[#063F4A] text-white shadow-soft"
          : "border-black/10 bg-white text-ink hover:border-[#C79A54]/45"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-9 place-items-center rounded ${
            active ? "bg-white/12 text-[#C79A54]" : "bg-[#DDEFF2] text-[#063F4A]"
          }`}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={`rounded px-2.5 py-1 text-xs font-semibold ${
            active ? "bg-[#C79A54] text-[#063F4A]" : "bg-[#F5FAFA] text-ink/55"
          }`}
        >
          {module.metric}
        </span>
      </div>
      <h3 className="mt-4 font-semibold">{module.title}</h3>
      <p className={`mt-1 text-xs ${active ? "text-white/62" : "text-ink/48"}`}>{module.desc}</p>
      <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${active ? "text-[#C79A54]" : "text-[#063F4A]"}`}>
        打开 <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function ScoreRing({ score, label, desc }: { score: number; label: string; desc: string }) {
  return (
    <div className="grid place-items-center">
      <div
        className="grid size-36 place-items-center rounded-full shadow-soft"
        style={{ background: `conic-gradient(#C79A54 ${score * 3.6}deg, #DDEFF2 0deg)` }}
      >
        <div className="grid size-28 place-items-center rounded-full bg-white text-center">
          <span className="text-4xl font-semibold text-[#063F4A]">{score}</span>
          <span className="-mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-ink/70">{desc}</p>
    </div>
  );
}

function TodayActionCenter({
  currentPlan,
  currentPoints,
  onOpenModule
}: {
  currentPlan: (typeof membershipTiers)[number];
  currentPoints: number;
  onOpenModule: (module: DashboardModule) => void;
}) {
  return (
    <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr_0.85fr]">
        <div className="rounded bg-[#F5FAFA] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Today</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">今日行动中心</h1>
          <p className="mt-3 text-sm leading-6 text-ink/58">先看分数，再决定行动。减少选择压力。</p>
          <div className="mt-5">
            <StatusPill>{currentPlan.name} · {currentPoints.toLocaleString("en-US")} 点</StatusPill>
          </div>
        </div>

        <div className="grid gap-4 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-5 sm:grid-cols-[160px_1fr]">
          <ScoreRing score={89} label="Score" desc="稳中有进" />
          <div className="grid gap-3">
            {todayActionCards.map((action) => {
              const Icon = action.icon;
              const toneClass =
                action.tone === "gold"
                  ? "bg-[#C79A54]/15 text-[#C79A54]"
                  : action.tone === "green"
                    ? "bg-[#DDEFF2] text-[#063F4A]"
                    : "bg-[#E8D4A8] text-[#1495A0]";

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => onOpenModule(action.module)}
                  className="group flex items-center gap-3 rounded border border-black/10 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/55 hover:shadow-sm"
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded ${toneClass}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{action.title}</span>
                    <span className="mt-0.5 block text-xs text-ink/50">{action.desc}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink/35 transition group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded bg-[#063F4A] p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Quick Read</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {fortuneScores.map(([label, score]) => (
              <div key={label} className="rounded bg-white/8 p-3">
                <p className="text-xs text-white/45">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-[#C79A54]">{score}</p>
              </div>
            ))}
            <div className="rounded bg-white/8 p-3">
              <p className="text-xs text-white/45">贵人方</p>
              <p className="mt-1 text-xl font-semibold text-[#C79A54]">东南</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenModule("ai")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#C79A54] px-4 py-3 text-sm font-semibold text-[#063F4A]"
          >
            问 AI 风水师 <Bot className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function MembershipPlanPanel({
  currentTier,
  onChangeTier
}: {
  currentTier: MembershipTier;
  onChangeTier: (tier: MembershipTier) => void;
}) {
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];

  return (
    <section className="mt-6 rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Membership Engine</p>
          <h2 className="mt-2 text-2xl font-semibold">三级会员权限与 AI 算力</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/58">
            Free 负责高频打卡，RM39.90 开始启用紫微斗数 + 梅花易数双引擎，RM69.90 提供流月/流年与商业战略顾问。
          </p>
        </div>
        <StatusPill>当前：{activeTier.name}</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {membershipTiers.map((tier) => {
          const active = tier.id === currentTier;

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onChangeTier(tier.id)}
              className={`rounded border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                active
                  ? "border-[#C79A54] bg-[#063F4A] text-white"
                  : "border-black/10 bg-rice text-ink hover:border-[#C79A54]/55"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${active ? "text-[#C79A54]" : "text-[#063F4A]"}`}>{tier.positioning}</p>
                  <h3 className="mt-2 text-xl font-semibold">{tier.name}</h3>
                </div>
                <span className={`rounded px-2.5 py-1 text-sm font-semibold ${active ? "bg-[#C79A54] text-[#063F4A]" : "bg-white text-[#063F4A]"}`}>
                  {tier.price}
                </span>
              </div>
              <div className={`mt-4 rounded p-3 ${active ? "bg-white/8" : "bg-white"}`}>
                <p className={`text-xs ${active ? "text-white/45" : "text-ink/45"}`}>AI / 数据调用权限</p>
                <p className="mt-1 text-sm font-semibold">{tier.aiMode}</p>
                <p className={`mt-1 text-xs leading-5 ${active ? "text-white/58" : "text-ink/55"}`}>{tier.dataDepth}</p>
              </div>
              <div className="mt-4 grid gap-2">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`size-4 ${active ? "text-[#C79A54]" : "text-[#063F4A]"}`} />
                    <span>{feature}</span>
                  </div>
                ))}
                {tier.locked?.map((feature) => (
                  <div key={feature} className={`flex items-center gap-2 text-sm ${active ? "text-white/42" : "text-ink/35"}`}>
                    <LockKeyhole className="size-4" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TierTestSwitcher({
  currentTier,
  onChangeTier
}: {
  currentTier: MembershipTier;
  onChangeTier: (tier: MembershipTier) => void;
}) {
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];

  return (
    <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Test Mode</p>
          <h2 className="mt-1 text-lg font-semibold">快速切换会员版本</h2>
          <p className="mt-1 text-sm text-ink/58">当前：{activeTier.positioning}</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[560px] sm:grid-cols-3">
          {membershipTiers.map((tier) => {
            const active = tier.id === currentTier;
            const Icon = tier.id === "free" ? LockKeyhole : tier.id === "tactical" ? Sparkles : Trophy;

            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onChangeTier(tier.id)}
                className={`rounded border p-3 text-left transition ${
                  active
                    ? "border-[#C79A54] bg-[#063F4A] text-white shadow-soft"
                    : "border-black/10 bg-white text-ink hover:border-[#C79A54]/55"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`grid size-8 place-items-center rounded ${active ? "bg-white/12 text-[#C79A54]" : "bg-[#DDEFF2] text-[#063F4A]"}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${active ? "bg-[#C79A54] text-[#063F4A]" : "bg-[#F5FAFA] text-ink/55"}`}>
                    {tier.price}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{tier.id === "free" ? "Free" : tier.id === "tactical" ? "进阶版" : "高阶版"}</p>
                <p className={`mt-1 text-xs ${active ? "text-white/58" : "text-ink/45"}`}>{tier.positioning}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
      <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">New Member Path</p>
            <h2 className="mt-2 text-2xl font-semibold">新手 4 步引导</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              让新会员知道先做什么，避免进入 Dashboard 后不知道怎么开始。
            </p>
          </div>
          <span className="rounded bg-[#C79A54] px-3 py-1 text-sm font-semibold text-[#063F4A]">
            {completedSteps.size} / {onboardingSteps.length}
          </span>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/12">
          <div
            className="h-2 rounded-full bg-[#C79A54]"
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
                  isDone ? "border-[#063F4A]/25 bg-[#DDEFF2]" : "border-black/10 bg-rice"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-8 place-items-center rounded ${isDone ? "bg-[#063F4A] text-white" : "bg-white text-ink/45"}`}>
                    <CheckCircle2 className="size-4" />
                  </span>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#063F4A]">Step {index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/58">{step.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#063F4A]">
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
            <Sparkles className="size-5 text-[#C79A54]" />
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
              className="group rounded border border-black/10 bg-rice p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded bg-[#DDEFF2] text-[#063F4A]">
                  <Icon className="size-5" />
                </span>
                <span className="rounded bg-[#C79A54]/15 px-2 py-1 text-xs font-semibold text-[#063F4A]">{action.tag}</span>
              </div>
              <h3 className="mt-4 font-semibold">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/58">{action.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#063F4A]">
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
              <HeartPulse className="size-5 text-[#C79A54]" />
              <h2 className="text-xl font-semibold">今日状态打卡</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/58">
              用户每天记录状态，系统就能推荐更贴近当下的 AI 问题、报告和开运任务。
            </p>
          </div>
          <span className="rounded bg-[#DDEFF2] px-3 py-1 text-sm font-semibold text-[#063F4A]">
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
                  active ? "border-[#C79A54] bg-[#C79A54]/10" : "border-black/10 bg-rice"
                }`}
              >
                <p className="text-xl font-semibold text-[#063F4A]">{mood.label}</p>
                <p className="mt-1 text-xs leading-5 text-ink/55">{mood.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">基于状态推荐</p>
            <h3 className="mt-2 text-2xl font-semibold">从“{selectedMood.label}”开始问 AI</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">{selectedMood.prompt}</p>
          </div>
          <Bot className="size-8 text-[#C79A54]" />
        </div>
        <button
          type="button"
          onClick={() => onOpenModule("ai")}
          className="mt-5 inline-flex items-center gap-2 rounded bg-[#C79A54] px-4 py-3 text-sm font-semibold text-[#063F4A]"
        >
          带着这个问题去问 AI <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function TodayFortune({ currentTier, memberProfile }: { currentTier: MembershipTier; memberProfile: MemberProfile }) {
  const [aiFortune, setAiFortune] = useState<DailyFortuneResponse | null>(null);
  const [isLoadingFortune, setIsLoadingFortune] = useState(false);
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const canUseAiReading = currentTier !== "free";
  const canSeeStrategicCycle = currentTier === "strategic";

  async function generateDailyFortune() {
    setIsLoadingFortune(true);

    try {
      const response = await fetch("/api/daily-fortune", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: memberProfile,
          memberLevel: activeTier.name
        })
      });
      const data = (await response.json()) as DailyFortuneResponse;
      setAiFortune(data);
    } finally {
      setIsLoadingFortune(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/58">AI 紫微矩阵 · 今日运势</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">稳中有进，先整理后扩张</h2>
            <p className="mt-2 text-xs text-white/45">
              {memberProfile.name} · {memberProfile.birthDate} · {memberProfile.birthTimeLabel} · {memberProfile.gender}
            </p>
          </div>
          <CalendarDays className="size-9 text-[#C79A54]" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr]">
          <div className="rounded border border-[#C79A54]/35 bg-[#C79A54]/12 p-4">
            <p className="text-xs text-white/55">今日评分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-semibold leading-none text-[#C79A54]">89</span>
              <span className="pb-1 text-sm text-white/52">/100</span>
            </div>
            <p className="mt-3 text-xs text-white/62">适合推进合作与整理计划</p>
          </div>
          <div className="rounded border border-white/12 bg-white/8 p-4 sm:hidden">
            <p className="text-xs text-white/55">Free 星级</p>
            <p className="mt-2 text-2xl text-[#C79A54]">★★★★★</p>
            <p className="mt-2 text-xs text-white/58">一句话宜忌：宜谈合作，忌冲动承诺。</p>
          </div>
          <div className="rounded border border-white/12 bg-white/8 p-4">
            <div className="grid gap-4">
              {fortuneScores.map(([label, score, note]) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-white">{label}</span>
                    <span className="text-[#C79A54]">{score}/100</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${score}%` }} />
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
            <Palette className="size-4 text-[#C79A54]" />
            <div className="mt-2 flex items-center gap-2">
              <span className="size-4 rounded-full bg-[#1495A0]" />
              <p className="text-sm">幸运色：青绿</p>
            </div>
          </div>
          <div className="rounded bg-white/8 p-3">
            <TrendingUp className="size-4 text-[#C79A54]" />
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full border border-[#C79A54]/45 text-[10px] text-[#C79A54]">SE</span>
              <p className="text-sm">贵人方：东南</p>
            </div>
          </div>
          <div className="rounded bg-white/8 p-3">
            <Flame className="size-4 text-[#C79A54]" />
            <p className="mt-2 text-sm">今日宜：复盘</p>
          </div>
        </div>

        <div className="mt-6 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#C79A54]">底层算法</p>
              <p className="mt-1 text-sm text-white/65">紫微矩阵 + 飞星四化 + 梅花体用 + LLM 解读</p>
            </div>
          <button
            type="button"
              onClick={generateDailyFortune}
              disabled={isLoadingFortune || !canUseAiReading}
              className="rounded bg-[#C79A54] px-4 py-2 text-sm font-semibold text-[#063F4A] disabled:opacity-60"
            >
              {currentTier === "free" ? "升级解锁 AI 解读" : isLoadingFortune ? "AI 生成中..." : "AI 生成今日解读"}
            </button>
          </div>
          <div className="mt-3 rounded bg-white/8 p-3">
            <p className="text-xs text-white/45">当前会员权限</p>
            <p className="mt-1 text-sm font-semibold text-white">{activeTier.name} · {activeTier.positioning}</p>
          </div>
          {aiFortune ? (
            <div className="mt-4 rounded bg-white/8 p-4">
              <p className="text-xs text-white/45">OpenAI · {aiFortune.model}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/78">{aiFortune.reading}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Ziwei Matrix</p>
              <h3 className="mt-2 text-xl font-semibold">今日评分来源</h3>
            </div>
            <StatusPill>飞星四化</StatusPill>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              ["财帛宫", "武曲 + 禄意象", "+8", "地空地劫风险，偏财保守"],
              ["官禄宫", "化权触发", "+12", "适合谈合作、提案和签约准备"],
              ["交友宫", "客户沟通窗口", "+5", "适合主动联系，但避免压迫式沟通"]
            ].map(([palace, signal, score, note]) => (
              <div key={palace} className="rounded border border-black/10 bg-rice p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{palace}</p>
                  <span className="rounded bg-[#C79A54]/15 px-2 py-1 text-xs font-semibold text-[#063F4A]">{score}</span>
                </div>
                <p className="mt-1 text-sm text-ink/65">{signal}</p>
                <p className="mt-1 text-xs leading-5 text-ink/48">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-ink/55">连续签到</p>
              <p className="mt-2 text-4xl font-semibold">7 天</p>
            </div>
            <span className="grid size-11 place-items-center rounded bg-[#C79A54]/15 text-[#C79A54]">
              <Sparkles className="size-5" />
            </span>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1">
            {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
              <div key={day} className="grid aspect-square place-items-center rounded bg-[#063F4A] text-xs font-semibold text-white">
                {day}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-ink/60">保持 14 天可解锁一次免费深度分析。</p>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">今日开运任务</h2>
            <span className="rounded bg-[#F5FAFA] px-2.5 py-1 text-xs font-medium text-ink/58">3 / 3</span>
          </div>
          <div className="grid gap-3">
            {dailyRituals.map((item) => (
              <div key={item.title} className="flex gap-3 rounded border border-black/10 bg-[#F5FAFA] p-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#063F4A]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <span className="shrink-0 rounded bg-white px-2 py-1 text-xs text-[#063F4A]">{item.reward}</span>
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
            <span className="rounded bg-[#F5FAFA] px-2.5 py-1 text-xs font-medium text-ink/58">AI 总结</span>
          </div>
          <div className="grid gap-3">
            {recentInsights.map((item) => (
              <div key={item.title} className="rounded border border-black/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  <span className="rounded bg-[#C79A54]/15 px-2 py-1 text-xs text-ink">{item.tag}</span>
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

function FortuneCalendarModule({ currentTier }: { currentTier: MembershipTier }) {
  const canSeeStrategicCycle = currentTier === "strategic";

  return (
    <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Fortune Calendar</p>
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
                  ? "border-[#C79A54]/45 bg-[#C79A54]/10"
                  : item.tone === "green"
                    ? "border-[#063F4A]/15 bg-[#DDEFF2]"
                    : "border-black/10 bg-[#F5FAFA]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{item.day}</span>
                <span className="text-xs text-ink/50">{item.date}</span>
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-semibold text-[#063F4A]">{item.score}</span>
                <span className="pb-1 text-xs text-ink/45">/100</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${item.score}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink/72">{item.tag}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white shadow-soft">
          <CalendarDays className="size-8 text-[#C79A54]" />
          <h3 className="mt-4 text-2xl font-semibold">最佳行动窗口</h3>
          <div className="mt-5 grid gap-3">
            {[
              ["05/04", "适合签约、发布、谈合作"],
              ["05/08", "适合整理现金流与收款"],
              ["05/11", "贵人日，适合主动联系关键人物"]
            ].map(([date, text]) => (
              <div key={date} className="rounded border border-white/12 bg-white/8 p-3">
                <p className="text-sm font-semibold text-[#C79A54]">{date}</p>
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
          <div className="mt-4 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
            <p className="text-sm font-semibold text-[#063F4A]">连续查看进度</p>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-2 w-[72%] rounded-full bg-[#063F4A]" />
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
            <LockKeyhole className="size-7 text-[#C79A54]" />
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
          <button className="mt-4 w-full rounded bg-[#063F4A] px-4 py-3 text-sm font-semibold text-white">
            再查看 2 天解锁
          </button>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold">流月 / 流年战略</h3>
              <p className="mt-2 text-sm leading-6 text-ink/58">
                高阶战略版读取本命格局、流年大环境、流月动态与当前问题，输出商业策略。
              </p>
            </div>
            {canSeeStrategicCycle ? <Sparkles className="size-7 text-[#C79A54]" /> : <LockKeyhole className="size-7 text-[#C79A54]" />}
          </div>
          <div className={`mt-4 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4 ${canSeeStrategicCycle ? "" : "opacity-65"}`}>
            <p className="text-sm font-semibold text-[#063F4A]">
              {canSeeStrategicCycle ? "本月建议：防御型扩张" : "RM69.90 解锁"}
            </p>
            <p className={`mt-2 text-sm leading-6 text-ink/62 ${canSeeStrategicCycle ? "" : "blur-[2px]"}`}>
              本月事业宫略有阻滞，宜先复盘内部管理、优化现金流，把重要对外谈判放在下半月推进。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DestinyProfileModule({ memberProfile }: { memberProfile: MemberProfile }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">Personal Destiny Profile</p>
            <h2 className="mt-2 text-3xl font-semibold">{memberProfile.name} 的个人命盘</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              会员注册后必须填写基础资料。今日运势、AI 风水师和报告中心都会读取这份档案来做命理分析。
            </p>
          </div>
          <UserRound className="size-9 text-[#C79A54]" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["姓名", memberProfile.name],
            ["性别", memberProfile.gender],
            ["出生日期", memberProfile.birthDate],
            ["出生时辰", memberProfile.birthTimeLabel],
            ["Email", memberProfile.email],
            ["手机号", memberProfile.phone || "选填"],
            ["地区", memberProfile.region],
            ["年度关键词", "稳中扩张"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-white/12 bg-white/8 p-3">
              <p className="text-xs text-white/45">{label}</p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
          <p className="text-sm font-semibold text-[#C79A54]">专属建议</p>
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
                <span className="grid size-10 place-items-center rounded bg-[#DDEFF2] font-semibold text-[#063F4A]">
                  {element}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-[#063F4A]" style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {destinyKeywords.map((keyword) => (
            <div key={keyword} className="rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-3 text-sm font-semibold text-[#063F4A]">
              {keyword}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded border border-black/10 bg-[#F5FAFA] p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold">十二宫数据桶</h4>
            <span className="rounded bg-white px-2 py-1 text-xs text-ink/55">MVP 预览</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              "命宫",
              "财帛宫",
              "官禄宫",
              "夫妻宫",
              "交友宫",
              "福德宫"
            ].map((palace) => (
              <div key={palace} className="rounded bg-white p-3 text-sm font-semibold text-[#063F4A]">
                {palace}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-ink/52">
            后续接真实排盘库后，每个宫位会写入主星、辅星、煞曜、四化状态和权重分。
          </p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Daily Growth Loop</p>
            <h2 className="mt-2 text-2xl font-semibold">每日任务与奖励</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              让用户每天有事可做、有奖励可拿、有理由回来。现在先做前端交互，后续接点数系统。
            </p>
          </div>
          <span className="rounded bg-[#C79A54] px-3 py-1 text-sm font-semibold text-[#063F4A]">
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
                  isDone ? "border-[#063F4A]/25 bg-[#DDEFF2]" : "border-black/10 bg-rice"
                }`}
              >
                <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded ${isDone ? "bg-[#063F4A] text-white" : "bg-white text-ink/45"}`}>
                  <CheckCircle2 className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{task.title}</span>
                    <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-[#063F4A]">{task.reward}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-ink/58">{task.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-[#063F4A]">距离 Pro 升级</p>
            <span className="text-sm font-semibold">72%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white">
            <div className="h-2 w-[72%] rounded-full bg-[#063F4A]" />
          </div>
          <p className="mt-2 text-sm text-ink/58">还差 320 点消费、1 份报告或 3 次分享。</p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/55">今日分享卡</p>
              <h3 className="mt-1 text-2xl font-semibold">我的事业评分 91</h3>
            </div>
            <Share2 className="size-8 text-[#C79A54]" />
          </div>
          <div className="mt-6 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-5 text-center">
            <p className="text-sm text-white/60">今日运势</p>
            <p className="mt-2 text-6xl font-semibold text-[#C79A54]">89</p>
            <p className="mt-3 text-xl font-semibold">稳中有进，先整理后扩张</p>
            <p className="mt-4 text-sm leading-6 text-white/65">幸运色：青绿 · 贵人方：东南 · 今日宜：复盘</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded bg-white/8 p-3">
            <p className="text-sm text-white/70">推荐码：FENG-LIM88</p>
            <button className="rounded bg-[#C79A54] px-3 py-2 text-sm font-semibold text-[#063F4A]">
              预览海报
            </button>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-[#C79A54]" />
            <h3 className="text-xl font-semibold">成就徽章</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {achievementBadges.map(([badge, status]) => (
              <div key={badge} className="rounded border border-black/10 bg-rice p-3">
                <Trophy className="size-4 text-[#C79A54]" />
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
      <div className="rounded border border-black/10 bg-[#063F4A] p-5 text-white shadow-soft">
        <BookmarkCheck className="size-9 text-[#C79A54]" />
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
                activeType === type ? "bg-[#063F4A] text-white" : "border border-black/10 bg-rice text-ink/60"
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
                <span className="rounded bg-[#C79A54]/15 px-2 py-1 text-xs font-semibold text-[#063F4A]">{item.type}</span>
                <BookmarkCheck className="size-4 text-[#C79A54]" />
              </div>
              <h4 className="mt-4 font-semibold">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-ink/58">{item.desc}</p>
              <button className="mt-4 text-sm font-semibold text-[#063F4A]">打开查看</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WalletAndReports({ currentTier, memberProfile }: { currentTier: MembershipTier; memberProfile: MemberProfile }) {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const strategicReportTitles = new Set(["流年报告", "开业择日报告", "公司风水初步分析报告"]);

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

  function isReportLocked(report: (typeof reportTypes)[number]) {
    return currentTier === "free" || (currentTier === "tactical" && strategicReportTitles.has(report.title));
  }

  function handleOpenReport(report: (typeof reportTypes)[number]) {
    if (isReportLocked(report)) {
      return;
    }

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
            <Coins className="size-5 text-[#C79A54]" />
            <h2 className="text-xl font-semibold">点数钱包</h2>
          </div>
          <button className="rounded bg-[#1495A0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F7F88]">
            充值点数
          </button>
        </div>
        <div className="rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
          <p className="text-sm text-ink/55">当前可用点数</p>
          <p className="mt-2 text-4xl font-semibold text-[#063F4A]">2,680</p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">AI Report Center</p>
            <h2 className="mt-2 text-2xl font-semibold">报告中心</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              {activeTier.name} 当前可用：{currentTier === "free" ? "报告摘要预览" : currentTier === "tactical" ? "财运、事业、感情、合盘等战术报告" : "全部报告与流月/流年战略分析"}。
            </p>
          </div>
          <StatusPill>可生成 2 份 PDF</StatusPill>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {reportTypes.map((report) => {
                const locked = isReportLocked(report);

                return (
                  <button
                    key={report.title}
                    type="button"
                    onClick={() => handleOpenReport(report)}
                    disabled={locked}
                    className={`group rounded border p-4 text-left transition ${
                      locked
                        ? "cursor-not-allowed border-black/10 bg-[#F5FAFA] opacity-72"
                        : "border-black/10 bg-rice hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {locked ? <LockKeyhole className="size-5 text-[#C79A54]" /> : <FileText className="size-5 text-[#063F4A]" />}
                      <span className="rounded bg-white px-2 py-1 text-xs text-ink/60">
                        {locked ? (currentTier === "free" ? "升级解锁" : "战略版") : report.tag}
                      </span>
                    </div>
                    <p className="mt-4 font-semibold">{report.title}</p>
                    <p className="mt-2 text-sm text-ink/55">
                      {locked ? (currentTier === "free" ? "Free 仅可预览每日摘要" : "RM69.90 解锁流月/流年战略") : `消耗 ${report.points} 点`}
                    </p>
                    <div className={`mt-4 flex items-center gap-1 text-xs font-semibold ${locked ? "text-ink/38" : "text-[#063F4A]"}`}>
                      {locked ? "当前等级不可生成" : "生成并查看报告"} <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded border border-black/10 bg-[#F5FAFA] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Archive className="size-4 text-[#063F4A]" />
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
                        selectedReport?.id === report.id ? "text-[#063F4A]" : "text-ink"
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Saved Report</p>
                    <h3 className="mt-2 text-2xl font-semibold">{selectedReport.title}</h3>
                    <p className="mt-2 text-sm text-ink/55">
                      分析对象：{memberProfile.name} · {memberProfile.birthDate} · {memberProfile.birthTimeLabel} · {memberProfile.gender}
                    </p>
                    <p className="mt-2 text-sm text-ink/55">生成时间：{selectedReport.createdAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadReport(selectedReport, memberProfile)}
                    className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#052F38]"
                  >
                    <Download className="size-4" /> 下载报告
                  </button>
                </div>

                <div className="mt-5 rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
                  <p className="text-sm font-semibold text-[#063F4A]">报告摘要</p>
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

                <p className="mt-5 rounded bg-[#F5FAFA] p-3 text-xs leading-5 text-ink/50">
                  免责声明：本报告为 AI 命理与风水辅助建议，仅供参考，不构成投资、医疗、法律或重大人生决策的唯一依据。
                </p>
              </div>
            ) : (
              <div className="grid min-h-[440px] place-items-center rounded border border-dashed border-black/15 bg-[#F5FAFA] p-8 text-center">
                <div>
                  <FileText className="mx-auto size-10 text-[#063F4A]" />
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

function SigilPreview({ artifact }: { artifact: SigilArtifact }) {
  const nodeDots = [artifact.dots[0], artifact.dots[artifact.dots.length - 1]].filter(Boolean);

  return (
    <svg viewBox="0 0 240 240" className="size-full">
      <defs>
        <filter id={`gold-glow-${artifact.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`gold-aura-${artifact.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C79A54" stopOpacity="0.13" />
          <stop offset="72%" stopColor="#C79A54" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="240" fill="#ffffff" />
      <rect width="240" height="240" fill={`url(#gold-aura-${artifact.id})`} />
      <circle cx="120" cy="120" r="94" fill="none" stroke="#C79A54" strokeOpacity="0.8" strokeWidth="2.6" />
      <circle cx="120" cy="120" r="64" fill="none" stroke="#C79A54" strokeOpacity="0.28" strokeWidth="2.2" />
      <path
        d={artifact.ornamentPath || ""}
        fill="none"
        stroke="#C79A54"
        strokeOpacity="0.88"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={artifact.path}
        fill="none"
        stroke="#C79A54"
        strokeOpacity="0.98"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#gold-glow-${artifact.id})`}
      />
      {nodeDots.map((dot, index) => (
        <circle
          key={`${artifact.id}-node-${index}`}
          cx={dot.x}
          cy={dot.y}
          r="8.5"
          fill="#ffffff"
          stroke="#C79A54"
          strokeWidth="2.6"
        />
      ))}
    </svg>
  );
}

function SigilModule({
  points,
  onSpendPoints,
}: {
  points: number;
  onSpendPoints: (amount: number) => boolean;
}) {
  const [intent, setIntent] = useState("I AM EARNING STEADY MONEY EVERY WEEK");
  const [artifacts, setArtifacts] = useState<SigilArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<SigilArtifact | null>(null);
  const [error, setError] = useState("");
  const intentGuidance = getIntentGuidance(intent);

  useEffect(() => {
    const stored = window.localStorage.getItem(sigilStorageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as SigilArtifact[];
      setArtifacts(parsed);
      setSelectedArtifact(parsed[0] || null);
    } catch {
      window.localStorage.removeItem(sigilStorageKey);
    }
  }, []);

  function handleGenerateSigil() {
    const cleanIntent = intent.trim();

    if (!intentGuidance.ok) {
      setError(intentGuidance.message);
      return;
    }

    if (points < sigilCost || !onSpendPoints(sigilCost)) {
      setError(`点数不足，生成符印需要 ${sigilCost} 点。`);
      return;
    }

    const generated = createSigilArtifact(cleanIntent);
    const nextArtifacts = [generated, ...artifacts].slice(0, 9);
    setArtifacts(nextArtifacts);
    setSelectedArtifact(generated);
    setIntent("");
    setError("");
    window.localStorage.setItem(sigilStorageKey, JSON.stringify(nextArtifacts));
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Sigil Studio</p>
            <h2 className="mt-2 text-2xl font-semibold">符印生成器</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              输入一个正向意图，系统会生成一枚专属金色符印。
            </p>
          </div>
          <StatusPill>生成一次 {sigilCost} 点</StatusPill>
        </div>

        <div className="mt-5">
          <label htmlFor="sigil-intent" className="text-sm font-semibold text-ink/70">
            Statement of Intent
          </label>
          <textarea
            id="sigil-intent"
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            className="mt-2 min-h-28 w-full rounded border border-black/10 bg-rice px-4 py-3 text-sm outline-none focus:border-[#063F4A]"
            placeholder="例如：I AM EARNING STEADY MONEY EVERY WEEK"
          />
          <div
            className={`mt-3 rounded border p-3 text-sm ${
              intentGuidance.ok ? "border-[#063F4A]/20 bg-[#DDEFF2] text-[#063F4A]" : "border-[#C79A54]/45 bg-[#C79A54]/10 text-ink/65"
            }`}
          >
            <p className="font-semibold">{intentGuidance.ok ? "意图检查通过" : "意图需要改写"}</p>
            <p className="mt-1 text-xs leading-5">{intentGuidance.message}</p>
            {!intentGuidance.ok ? (
              <button
                type="button"
                onClick={() => setIntent(intentGuidance.suggestion)}
                className="mt-2 rounded bg-white px-3 py-1.5 text-xs font-semibold text-[#063F4A]"
              >
                使用建议句：{intentGuidance.suggestion}
              </button>
            ) : null}
          </div>
        </div>

        {error ? <p className="mt-3 rounded bg-[#E8D4A8] p-3 text-sm text-[#1495A0]">{error}</p> : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateSigil}
            className="inline-flex items-center gap-2 rounded bg-[#1495A0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F7F88]"
          >
            消耗 {sigilCost} 点生成符印 <Sparkles className="size-4" />
          </button>
          <span className="text-sm text-ink/55">当前点数：{points.toLocaleString("en-US")} 点</span>
        </div>

        <div className="mt-6 rounded border border-black/10 bg-[#F5FAFA] p-4">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-[#063F4A]" />
            <h3 className="font-semibold">符印档案</h3>
          </div>
          <div className="mt-3 grid gap-2">
            {artifacts.length ? (
              artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  type="button"
                  onClick={() => setSelectedArtifact(artifact)}
                  className={`flex items-center justify-between gap-3 rounded border p-3 text-left ${
                    selectedArtifact?.id === artifact.id ? "border-[#C79A54] bg-white" : "border-black/10 bg-white/70"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{artifact.title}</span>
                    <span className="block text-xs text-ink/45">{artifact.createdAt} · {artifact.cost} 点</span>
                  </span>
                  <Eye className="size-4 text-ink/38" />
                </button>
              ))
            ) : (
              <p className="rounded border border-dashed border-black/15 bg-white p-4 text-sm leading-6 text-ink/55">
                还没有符印。生成后会自动保存到这里，方便用户之后找回。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded border border-[#C79A54]/30 bg-white p-5 text-ink shadow-sm">
        {selectedArtifact ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink/48">Generated Sigil</p>
                <h3 className="mt-2 text-2xl font-semibold">{selectedArtifact.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => downloadSigil(selectedArtifact)}
                className="inline-flex items-center gap-2 rounded bg-[#C79A54] px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <Download className="size-4" /> 下载 SVG
              </button>
            </div>

            <div className="mx-auto mt-6 aspect-square max-w-sm overflow-hidden rounded border border-[#C79A54]/30 bg-white shadow-sm">
              <SigilPreview artifact={selectedArtifact} />
            </div>

            <div className="mt-5 rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
              <p className="text-sm font-semibold text-[#C79A54]">激活建议</p>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                进入专注或冥想状态后凝视符印 30-60 秒。完成后不要反复追问原始意图，让符号从显意识退场，把它当作行动提醒的视觉锚点。
              </p>
              <p className="mt-2 text-xs leading-5 text-ink/45">
                心理学视角：抽象图像降低理性怀疑干扰，让意图以视觉形式进入潜意识记忆。
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-ink/48">Sigil Preview</p>
              <h3 className="mt-2 text-2xl font-semibold">等待生成符印</h3>
              <p className="mt-2 text-sm leading-6 text-ink/55">输入意图并消耗点数后，这里会显示你的专属金色符印。</p>
            </div>
            <div className="grid min-h-[460px] place-items-center rounded border border-dashed border-[#C79A54]/40 bg-[#C79A54]/5 p-8 text-center">
              <div>
                <Sparkles className="mx-auto size-12 text-[#C79A54]" />
                <p className="mt-4 text-sm leading-6 text-ink/55">符印将在生成后显示。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DivinationModule({
  points,
  onSpendPoints,
  onEarnPoints,
  onOpenModule
}: {
  points: number;
  onSpendPoints: (amount: number) => boolean;
  onEarnPoints: (amount: number) => void;
  onOpenModule: (module: DashboardModule) => void;
}) {
  const [numbers, setNumbers] = useState<[string, string, string]>(["3", "8", "9"]);
  const [readings, setReadings] = useState<DivinationReading[]>([]);
  const [selectedReading, setSelectedReading] = useState<DivinationReading | null>(null);
  const [checkIns, setCheckIns] = useState<DivinationCheckIn[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const activeProducts = selectedReading ? elementProductRecommendations[selectedReading.passElement] : elementProductRecommendations.火;

  useEffect(() => {
    const storedReadings = window.localStorage.getItem(divinationStorageKey);
    const storedCheckIns = window.localStorage.getItem(divinationCheckInKey);

    if (storedReadings) {
      try {
        const parsed = JSON.parse(storedReadings) as DivinationReading[];
        setReadings(parsed);
        setSelectedReading(parsed[0] || null);
      } catch {
        window.localStorage.removeItem(divinationStorageKey);
      }
    }

    if (storedCheckIns) {
      try {
        setCheckIns(JSON.parse(storedCheckIns) as DivinationCheckIn[]);
      } catch {
        window.localStorage.removeItem(divinationCheckInKey);
      }
    }
  }, []);

  function updateNumber(index: number, value: string) {
    const next = [...numbers] as [string, string, string];
    next[index] = value.replace(/\D/g, "").slice(0, 4);
    setNumbers(next);
  }

  function handleGenerateReading() {
    if (numbers.some((value) => !value.trim())) {
      setError("请先输入 3 个数字。");
      return;
    }

    if (points < divinationCost || !onSpendPoints(divinationCost)) {
      setError(`点数不足，九运问卦需要 ${divinationCost} 点。`);
      return;
    }

    const reading = createDivinationReading(numbers);
    const nextReadings = [reading, ...readings].slice(0, 8);
    setReadings(nextReadings);
    setSelectedReading(reading);
    setError("");
    window.localStorage.setItem(divinationStorageKey, JSON.stringify(nextReadings));
  }

  function handleCheckIn() {
    if (!selectedReading || !note.trim()) {
      setError("请先选择问卦结果，并写下今日打卡反馈。");
      return;
    }

    const reward = 18;
    const checkIn: DivinationCheckIn = {
      id: `checkin-${Date.now()}`,
      readingTitle: selectedReading.originalHexagram,
      createdAt: new Intl.DateTimeFormat("zh-MY", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date()),
      note: note.trim(),
      reward,
      status: "已通过"
    };
    const nextCheckIns = [checkIn, ...checkIns].slice(0, 8);
    setCheckIns(nextCheckIns);
    setNote("");
    setError("");
    onEarnPoints(reward);
    window.localStorage.setItem(divinationCheckInKey, JSON.stringify(nextCheckIns));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.84fr_1.16fr]">
      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Jiu Yun Oracle</p>
              <h2 className="mt-2 text-2xl font-semibold">九运智慧问卦</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink/58">
                随机报出 3 个数字，系统结合当前时辰起卦，输出局势、变化、结果与五行通关行动。
              </p>
            </div>
            <StatusPill>问卦一次 {divinationCost} 点</StatusPill>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {numbers.map((value, index) => (
              <label key={index} className="block">
                <span className="text-xs font-semibold text-ink/45">数字 {index + 1}</span>
                <input
                  value={value}
                  onChange={(event) => updateNumber(index, event.target.value)}
                  className="mt-2 h-14 w-full rounded border border-black/10 bg-rice text-center text-2xl font-semibold text-[#063F4A] outline-none focus:border-[#C79A54]"
                  inputMode="numeric"
                  placeholder={`${index + 1}`}
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleGenerateReading}
              className="inline-flex items-center gap-2 rounded bg-[#1495A0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F7F88]"
            >
              消耗 {divinationCost} 点开始问卦 <Flame className="size-4" />
            </button>
            <span className="text-sm text-ink/55">当前点数：{points.toLocaleString("en-US")} 点</span>
          </div>

          {error ? <p className="mt-3 rounded bg-[#E8D4A8] p-3 text-sm text-[#1495A0]">{error}</p> : null}
        </div>

        <div className="rounded border border-black/10 bg-[#F5FAFA] p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-[#063F4A]" />
            <h3 className="font-semibold">问卦档案</h3>
          </div>
          <div className="mt-3 grid gap-2">
            {readings.length ? (
              readings.map((reading) => (
                <button
                  key={reading.id}
                  type="button"
                  onClick={() => setSelectedReading(reading)}
                  className={`rounded border p-3 text-left transition ${
                    selectedReading?.id === reading.id ? "border-[#C79A54] bg-white" : "border-black/10 bg-white/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{reading.originalHexagram}</span>
                    <span className="rounded bg-[#DDEFF2] px-2 py-1 text-xs font-semibold text-[#063F4A]">{reading.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/45">{reading.createdAt} · {reading.hourBranch}时 · 动爻 {reading.movingLine}</p>
                </button>
              ))
            ) : (
              <p className="rounded border border-dashed border-black/15 bg-white p-4 text-sm leading-6 text-ink/55">
                还没有问卦记录。输入 3 个数字后，会自动保存本次结果。
              </p>
            )}
          </div>
        </div>

        <div className="rounded border border-[#C79A54]/30 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-[#C79A54]" />
            <h3 className="font-semibold">福报积分兑换</h3>
          </div>
          <div className="mt-3 grid gap-2">
            {divinationExchangeRewards.map(([cost, reward]) => (
              <div key={reward} className="flex items-center justify-between gap-3 rounded border border-black/10 bg-rice p-3">
                <span className="text-sm font-semibold text-[#063F4A]">{cost}</span>
                <span className="text-sm text-ink/60">{reward}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenModule("wallet")}
            className="mt-3 w-full rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white"
          >
            去报告中心兑换
          </button>
        </div>
      </div>

      <div className="rounded border border-[#C79A54]/30 bg-white p-5 shadow-sm">
        {selectedReading ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Panoramic Decision</p>
                <h3 className="mt-2 text-2xl font-semibold">三数起卦结果</h3>
                <p className="mt-2 text-sm text-ink/55">
                  数字 {selectedReading.numbers.join(" / ")} · {selectedReading.hourBranch}时 · 动爻 {selectedReading.movingLine}
                </p>
              </div>
              <div className="rounded bg-[#063F4A] px-4 py-3 text-right text-white">
                <p className="text-xs text-white/48">今日决策指数</p>
                <p className="text-3xl font-semibold text-[#C79A54]">{selectedReading.score}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ["本卦", selectedReading.originalHexagram],
                ["互卦", selectedReading.mutualHexagram],
                ["变卦", selectedReading.changingHexagram],
                ["今日体卦", `${selectedReading.bodyTrigram.symbol} ${selectedReading.bodyTrigram.name} · ${selectedReading.bodyTrigram.element}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded border border-black/10 bg-rice p-4">
                  <p className="text-xs text-ink/45">{label}</p>
                  <p className="mt-2 font-semibold text-[#063F4A]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["现状定位", selectedReading.situation],
                ["演变推演", selectedReading.process],
                ["最终走向", selectedReading.outcome]
              ].map(([title, content]) => (
                <div key={title} className="rounded border border-black/10 bg-white p-4 shadow-sm">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{content}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-[#C79A54]" />
                <p className="font-semibold text-[#C79A54]">今日战略心法</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/70">{selectedReading.mindset}</p>
            </div>

            <div className="mt-5 rounded bg-[#063F4A] p-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#C79A54]">五行通关闭环</p>
                  <h4 className="mt-2 text-2xl font-semibold">需用「{selectedReading.passElement}」通关</h4>
                </div>
                <StatusPill>天时 · 地利 · 物用 · 人和</StatusPill>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["天时", selectedReading.actionPlan.timing],
                  ["地利", selectedReading.actionPlan.direction],
                  ["颜色", selectedReading.actionPlan.color],
                  ["通关物件", selectedReading.actionPlan.object]
                ].map(([label, value]) => (
                  <div key={label} className="rounded bg-white/8 p-3">
                    <p className="text-xs text-white/42">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded bg-white/8 p-4">
                <p className="text-xs text-white/42">动态行为</p>
                <p className="mt-2 text-sm leading-6 text-white/78">{selectedReading.actionPlan.action}</p>
                <p className="mt-3 rounded bg-[#C79A54]/15 px-3 py-2 text-sm font-semibold text-[#C79A54]">
                  {selectedReading.actionPlan.mantra}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Share Card</p>
                    <h4 className="mt-1 font-semibold">九运开运分享图预览</h4>
                  </div>
                  <Share2 className="size-5 text-[#C79A54]" />
                </div>
                <div className="mt-4 overflow-hidden rounded border border-[#C79A54]/35 bg-white shadow-sm">
                  <div className="bg-[#063F4A] p-5 text-white">
                    <p className="text-xs text-[#C79A54]">AI Feng Shui Master</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-4xl font-semibold text-[#C79A54]">{selectedReading.score}</p>
                        <p className="text-xs text-white/52">今日决策指数</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl">{selectedReading.bodyTrigram.symbol}</p>
                        <p className="text-sm text-white/70">{selectedReading.originalHexagram}</p>
                      </div>
                    </div>
                    <p className="mt-4 rounded bg-white/8 p-3 text-sm leading-6 text-white/78">
                      {selectedReading.actionPlan.mantra}
                    </p>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 p-4">
                    <div>
                      <p className="text-xs font-semibold text-[#063F4A]">#{selectedReading.passElement}通关 #九运智慧 #易玺老师</p>
                      <p className="mt-1 text-xs text-ink/45">分享后回传截图，可获得福报点数。</p>
                    </div>
                    <div className="grid size-14 place-items-center rounded bg-[#F5FAFA] text-[10px] font-semibold text-ink/45">
                      QR
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Commerce Loop</p>
                    <h4 className="mt-1 font-semibold">通关物件推荐</h4>
                  </div>
                  <StatusPill>{selectedReading.passElement}元素</StatusPill>
                </div>
                <div className="mt-4 grid gap-3">
                  {activeProducts.map((product) => (
                    <button
                      key={product.title}
                      type="button"
                      onClick={() => onOpenModule("shop")}
                      className="group rounded border border-black/10 bg-rice p-3 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/50 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="mt-1 text-sm leading-6 text-ink/55">{product.desc}</p>
                        </div>
                        <span className="rounded bg-white px-2 py-1 text-sm font-semibold text-[#063F4A]">{product.price}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold text-[#063F4A]">去商城查看</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded border border-black/10 bg-rice p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-[#063F4A]" />
                  <h4 className="font-semibold">开运日记打卡</h4>
                </div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="mt-3 min-h-24 w-full rounded border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#063F4A]"
                  placeholder="完成布局后写下感应，例如：今天谈合作更顺，思路比较清楚。"
                />
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="mt-3 inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  提交打卡并获得积分 <Coins className="size-4" />
                </button>
              </div>

              <div className="rounded border border-black/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Share2 className="size-5 text-[#C79A54]" />
                  <h4 className="font-semibold">社交见证闭环</h4>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-ink/60">
                  <p>1. 完成五行布局后拍照。</p>
                  <p>2. 次日填写见证反馈。</p>
                  <p>3. 系统后续可生成分享图与二维码。</p>
                  <p>4. 审核通过后发放福报点数。</p>
                </div>
              </div>
            </div>

            {checkIns.length ? (
              <div className="mt-5 rounded border border-black/10 bg-white p-4">
                <h4 className="font-semibold">最近见证</h4>
                <div className="mt-3 grid gap-2">
                  {checkIns.map((checkIn) => (
                    <div key={checkIn.id} className="rounded border border-black/10 bg-rice p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{checkIn.readingTitle}</p>
                        <span className="rounded bg-[#DDEFF2] px-2 py-1 text-xs font-semibold text-[#063F4A]">
                          +{checkIn.reward} 点 · {checkIn.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/58">{checkIn.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid min-h-[620px] place-items-center rounded border border-dashed border-[#C79A54]/45 bg-[#C79A54]/5 p-8 text-center">
            <div>
              <Flame className="mx-auto size-12 text-[#C79A54]" />
              <h3 className="mt-4 text-2xl font-semibold">等待三数起卦</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-ink/55">
                输入 3 个随机数字后，系统会自动结合当前时辰生成九运智慧决策建议。
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductModule() {
  return (
    <section className="rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-[#063F4A]" />
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
              <p className="text-xs font-medium text-[#1495A0]">{product.category}</p>
              <h3 className="mt-2 min-h-10 font-semibold leading-5">{product.name}</h3>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[#063F4A]">{product.price}</span>
                <span className="rounded bg-[#F5FAFA] px-2 py-1 text-xs text-ink/58">{product.points}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-[#063F4A]">
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
          <BookOpenCheck className="size-5 text-[#1495A0]" />
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
              <p className="text-xs font-medium text-[#1495A0]">{course.category}</p>
              <h3 className="mt-2 min-h-10 font-semibold leading-5">{course.name}</h3>
              <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-[#063F4A]">{course.price}</span>
                <span className="rounded bg-[#F5FAFA] px-2 py-1 text-xs text-ink/58">{course.reward}</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-ink/50 transition group-hover:text-[#063F4A]">
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
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<DashboardModule>("fortune");
  const [currentTier, setCurrentTier] = useState<MembershipTier>("tactical");
  const [pointBalance, setPointBalance] = useState(2680);
  const [pointsLoaded, setPointsLoaded] = useState(false);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(demoMemberProfile);
  const [profileSource, setProfileSource] = useState<"supabase" | "demo" | "loading">("loading");
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const active = modules.find((module) => module.id === activeModule) || modules[0];
  const currentPlan = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const accountStats = dashboardStats.map((stat) =>
    stat.label === "当前点数" ? { ...stat, value: pointBalance.toLocaleString("en-US") } : stat
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(pointsStorageKey);
    const parsed = stored ? Number(stored) : 2680;
    setPointBalance(Number.isFinite(parsed) && parsed >= 0 ? parsed : 2680);
    setPointsLoaded(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSupabaseProfile() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        if (mounted) {
          setMemberProfile(demoMemberProfile);
          setProfileSource("demo");
          setAuthStatus("unauthenticated");
          router.replace("/auth");
        }
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setMemberProfile(demoMemberProfile);
          setProfileSource("demo");
          setAuthStatus("unauthenticated");
          router.replace("/auth");
        }
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      if (mounted) {
        if (profile) {
          setMemberProfile(profileRowToMemberProfile(profile));
          setCurrentTier(profile.membership_tier);
          setPointBalance(profile.credit_balance);
          setProfileSource("supabase");
        } else {
          setMemberProfile({
            ...demoMemberProfile,
            email: user.email || demoMemberProfile.email,
            name: user.user_metadata?.full_name || demoMemberProfile.name
          });
          setProfileSource("demo");
        }
        setAuthStatus("authenticated");
      }
    }

    loadSupabaseProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (pointsLoaded) {
      window.localStorage.setItem(pointsStorageKey, String(pointBalance));
    }
  }, [pointBalance, pointsLoaded]);

  function spendPoints(amount: number) {
    if (pointBalance < amount) {
      return false;
    }

    setPointBalance((current) => current - amount);
    return true;
  }

  function earnPoints(amount: number) {
    setPointBalance((current) => current + amount);
  }

  if (authStatus !== "authenticated") {
    return (
      <AppShell>
        <main className="px-5 py-16">
          <div className="mx-auto max-w-3xl rounded border border-[#C79A54]/35 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Member Access</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#063F4A]">正在确认会员登录状态</h1>
            <p className="mt-3 text-ink/62">如果尚未登录，系统会自动带你回到登录页面。</p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <TodayActionCenter currentPlan={currentPlan} currentPoints={pointBalance} onOpenModule={setActiveModule} />

          <section className="mt-6 rounded border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards className="size-5 text-[#063F4A]" />
                <h2 className="text-lg font-semibold">账户快照</h2>
              </div>
              <StatusPill>
                {profileSource === "loading" ? "读取会员资料中" : profileSource === "supabase" ? "Supabase 会员资料" : "Demo 资料"}
              </StatusPill>
              <button className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052F38]">
                充值点数 <CreditCard className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accountStats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
            <TierTestSwitcher currentTier={currentTier} onChangeTier={setCurrentTier} />
          </section>

          <MembershipPlanPanel currentTier={currentTier} onChangeTier={setCurrentTier} />
          <OnboardingPanel onOpenModule={setActiveModule} />
          <TodayRecommendedActions onOpenModule={setActiveModule} />
          <MoodCheckInPanel onOpenModule={setActiveModule} />

          <section className="mt-6 rounded border border-black/10 bg-[#F5FAFA] p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-5 text-[#063F4A]" />
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
            {activeModule === "fortune" ? <TodayFortune currentTier={currentTier} memberProfile={memberProfile} /> : null}
            {activeModule === "calendar" ? <FortuneCalendarModule currentTier={currentTier} /> : null}
            {activeModule === "profile" ? <DestinyProfileModule memberProfile={memberProfile} /> : null}
            {activeModule === "growth" ? <GrowthPlaybookModule /> : null}
            {activeModule === "vault" ? <FavoritesVaultModule /> : null}
            {activeModule === "ai" ? (
              <FengshuiChat tier={currentTier} tierName={currentPlan.name} aiMode={currentPlan.positioning} profile={memberProfile} />
            ) : null}
            {activeModule === "divination" ? (
              <DivinationModule
                points={pointBalance}
                onSpendPoints={spendPoints}
                onEarnPoints={earnPoints}
                onOpenModule={setActiveModule}
              />
            ) : null}
            {activeModule === "sigil" ? (
              <SigilModule points={pointBalance} onSpendPoints={spendPoints} />
            ) : null}
            {activeModule === "wallet" ? <WalletAndReports currentTier={currentTier} memberProfile={memberProfile} /> : null}
            {activeModule === "shop" ? <ProductModule /> : null}
            {activeModule === "courses" ? <CourseModule /> : null}
            {activeModule === "team" ? <HierarchyTree /> : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
