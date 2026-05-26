"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  WalletCards,
  X
} from "lucide-react";
import {
  dailyRituals,
  dashboardCourses,
  dashboardProducts,
  dashboardStats,
  recentInsights,
  reportTypes
} from "@/lib/data";
import { AppShell, StatusPill } from "@/components/shell";
import { FengshuiChat } from "@/components/fengshui-chat";
import { HierarchyTree } from "@/components/hierarchy-tree";
import { emptyMemberProfile, type MemberProfile } from "@/lib/member-profile";
import { profileRowToMemberProfile } from "@/lib/profile-adapter";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { companySponsorCode, generateShortReferralCode, normalizeReferralCode } from "@/lib/referral-code";
import { getAutoLunarDateText, getMingliCalendar } from "@/lib/mingli-calendar";
import type { BaziAnalysis } from "@/lib/bazi-engine";
import { buildDailyFortuneMatrix, type DailyFortuneMatrix } from "@/lib/daily-fortune-engine";

type DashboardModule =
  | "fortune"
  | "calendar"
  | "profile"
  | "growth"
  | "vault"
  | "ai"
  | "divination"
  | "hexagram64"
  | "sigil"
  | "invite"
  | "partner"
  | "wallet"
  | "shop"
  | "courses"
  | "team";

type PartnerPackage = "none" | "startup_8888" | "partner_16888" | "regional_38888";
type DashboardCategory = "today" | "ai" | "reports" | "wallet" | "profile" | "partner";

const partnerPackageLabels: Record<PartnerPackage, string> = {
  none: "未购买创业配套",
  startup_8888: "8888 创业启动包",
  partner_16888: "16888 事业合伙人",
  regional_38888: "38888 区域导师 / 代理商"
};

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
    title: "AI 风水命理师",
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
    id: "hexagram64",
    title: "64卦一字",
    desc: "当下命理字",
    metric: "8 点",
    icon: Sparkles
  },
  {
    id: "sigil",
    title: "Sigil 符印",
    desc: "意图图形化",
    metric: "88 点",
    icon: Sparkles
  },
  {
    id: "invite",
    title: "邀请好友",
    desc: "推荐码 + 奖励",
    metric: "+30 点",
    icon: Share2
  },
  {
    id: "partner",
    title: "创业中心",
    desc: "团队转化 + Pool",
    metric: "0 人",
    icon: Trophy
  },
  {
    id: "wallet",
    title: "钱包与报告",
    desc: "点数 + 报告",
    metric: "0 点",
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
    metric: "0 人",
    icon: Network
  }
];

const dashboardCategories: {
  id: DashboardCategory;
  title: string;
  desc: string;
  modules: DashboardModule[];
}[] = [
  {
    id: "today",
    title: "今日",
    desc: "每日运势、符印、日历与收藏",
    modules: ["fortune", "sigil", "calendar", "growth", "vault"]
  },
  {
    id: "ai",
    title: "AI 问答",
    desc: "命理师、问卦、一字与符印",
    modules: ["ai", "divination", "hexagram64", "sigil"]
  },
  {
    id: "reports",
    title: "报告",
    desc: "按需求生成专业命理报告",
    modules: ["wallet"]
  },
  {
    id: "wallet",
    title: "钱包",
    desc: "点数、消费、充值与邀请",
    modules: ["wallet", "invite"]
  },
  {
    id: "profile",
    title: "我的",
    desc: "资料、命盘、课程与商城",
    modules: ["profile", "shop", "courses"]
  },
  {
    id: "partner",
    title: "创业中心",
    desc: "团队、佣金与创业经营",
    modules: ["invite", "team", "partner"]
  }
];

const memberDashboardCategories = dashboardCategories.slice(0, 5);
const partnerDashboardCategory = dashboardCategories[5]!;

const defaultModuleByCategory: Record<DashboardCategory, DashboardModule> = {
  today: "fortune",
  ai: "ai",
  reports: "wallet",
  wallet: "wallet",
  profile: "profile",
  partner: "partner"
};

const aiQuestionPrompts: {
  title: string;
  desc: string;
  module: DashboardModule;
}[] = [
  { title: "我最近事业适合变动吗？", desc: "适合换工、转型、创业前判断", module: "ai" },
  { title: "今天适合谈合作吗？", desc: "看时机、风险与沟通策略", module: "ai" },
  { title: "最近财运哪里要注意？", desc: "先守现金流，再看机会", module: "ai" },
  { title: "感情关系该怎么处理？", desc: "看沟通节奏与关系卡点", module: "ai" },
  { title: "我要做一个重要决定", desc: "结合当下状态拆解下一步", module: "divination" }
];

const demandReportCards: {
  title: string;
  desc: string;
  cost: string;
  preset: ReportDemandPreset;
}[] = [
  {
    title: "事业方向报告",
    desc: "适合换工作、创业、合作前判断方向。",
    cost: "消耗 680 点",
    preset: {
      title: "事业方向报告",
      focus: "career",
      questionCategory: "career",
      specificQuestion: "我接下来事业方向应该如何选择？目前适合换工作、创业、合作，还是先稳定累积？",
      message: "已预设事业方向报告：系统会以综合命理合参生成事业节奏、机会、风险与行动建议。"
    }
  },
  {
    title: "财运趋势报告",
    desc: "整理收入模式、现金流、风险与机会。",
    cost: "消耗 680 点",
    preset: {
      title: "财运趋势报告",
      focus: "wealth",
      questionCategory: "wealth",
      specificQuestion: "我近期财运趋势如何？收入、现金流、投资和合作收款有什么需要注意？",
      message: "已预设财运趋势报告：系统会重点分析现金流、机会窗口、破财风险与通关建议。"
    }
  },
  {
    title: "感情关系报告",
    desc: "分析关系模式、沟通卡点与相处建议。",
    cost: "消耗 680 点",
    preset: {
      title: "感情关系报告",
      focus: "relationship",
      questionCategory: "relationship",
      specificQuestion: "我目前的感情关系模式、沟通卡点和下一步处理方式是什么？",
      message: "已预设感情关系报告：系统会重点分析关系模式、沟通节奏与修复建议。"
    }
  },
  {
    title: "年度运势报告",
    desc: "看未来一年节奏、关键月份与避险提醒。",
    cost: "消耗 680 点",
    preset: {
      title: "年度运势报告",
      focus: "yearly luck",
      questionCategory: "business",
      specificQuestion: "请分析我未来一年的整体节奏、关键月份、事业财运机会与需要避开的风险。",
      message: "已预设年度运势报告：系统会重点看未来一年节奏、关键月份与避险行动。"
    }
  },
  {
    title: "综合命理报告",
    desc: "适合第一次全面了解自己的人。",
    cost: "消耗 680 点",
    preset: {
      title: "综合命理报告",
      focus: "business",
      questionCategory: "business",
      specificQuestion: "请综合分析我的人生优势、事业财运、关系模式、风险点、通关方式和长期行动方向。",
      message: "已预设综合命理报告：系统会融合四大命理底层分析，输出完整个人策略。"
    }
  }
];

const walletQuickRows = [
  ["当前点数", "pointBalance"],
  ["今日已用", "0 点"],
  ["最近消费", "问卦 36 点 / 报告 380 点"],
  ["推荐奖励", "+30 点 / 新会员"]
] as const;

const onboardingProgressStorageKey = "ai-fengshui-onboarding-progress";

const moduleCategoryMap = dashboardCategories.reduce<Record<DashboardModule, DashboardCategory>>((map, category) => {
  category.modules.forEach((module) => {
    if (!map[module]) map[module] = category.id;
  });
  return map;
}, {} as Record<DashboardModule, DashboardCategory>);

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
  },
  {
    title: "邀请好友注册",
    desc: "双方各得 30 点",
    module: "invite",
    icon: Share2,
    tone: "green"
  },
  {
    title: "查看创业中心",
    desc: "团队 + Pool Share",
    module: "partner",
    icon: Trophy,
    tone: "gold"
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

const palaceExplanations = [
  {
    name: "命宫",
    meaning: "代表一个人的核心性格、人生主轴、行动方式和整体气质。",
    good: "好状态：方向感清楚，做事有主见，遇事能稳住自己。",
    caution: "需注意：容易固执或自我消耗，重大选择前要先确认长期目标。"
  },
  {
    name: "兄弟宫",
    meaning: "代表手足、同辈、伙伴关系，也看资源互助与竞争关系。",
    good: "好状态：容易获得同辈支持，合作中有人补位。",
    caution: "需注意：界线不清会带来人情压力，钱与责任要说清楚。"
  },
  {
    name: "夫妻宫",
    meaning: "代表伴侣关系、亲密互动、婚姻观与长期相处模式。",
    good: "好状态：沟通顺、愿意互相成就，适合谈未来规划。",
    caution: "需注意：情绪化判断会放大误会，先听清楚再回应。"
  },
  {
    name: "子女宫",
    meaning: "代表子女、作品、创意成果，也看表达与传承能力。",
    good: "好状态：创意活跃，适合推出内容、课程或作品。",
    caution: "需注意：想法太多会分散执行，先完成一个再扩张。"
  },
  {
    name: "财帛宫",
    meaning: "代表赚钱模式、现金流、理财习惯与财富承载力。",
    good: "好状态：收入稳定，适合整理现金流、定价和预算。",
    caution: "需注意：偏财诱惑或冲动投资，先看风险再看回报。"
  },
  {
    name: "疾厄宫",
    meaning: "代表身体状态、压力来源、情绪消耗和作息节奏。",
    good: "好状态：精力恢复快，适合建立规律运动和休息。",
    caution: "需注意：长期熬夜、焦虑和过劳会影响判断力。"
  },
  {
    name: "迁移宫",
    meaning: "代表外出发展、异地机会、市场曝光和对外表现。",
    good: "好状态：适合出差、见客户、开拓新圈层。",
    caution: "需注意：外部机会多但变数也多，合约细节要确认。"
  },
  {
    name: "交友宫",
    meaning: "代表朋友、客户、粉丝、团队与人脉质量。",
    good: "好状态：贵人、人脉和客户机会较明显。",
    caution: "需注意：小人、口舌或团队拖延，合作前先看价值观。"
  },
  {
    name: "官禄宫",
    meaning: "代表事业方向、职位发展、专业能力和社会成就。",
    good: "好状态：适合提案、升职、创业规划和商业布局。",
    caution: "需注意：目标太散会影响成果，先定一个主战场。"
  },
  {
    name: "田宅宫",
    meaning: "代表家宅、办公室、不动产、空间气场和安全感。",
    good: "好状态：适合整理空间、布局办公位或规划资产。",
    caution: "需注意：杂乱、暗角和动线不顺会影响专注与财气。"
  },
  {
    name: "福德宫",
    meaning: "代表内在福气、精神状态、享受能力和长期幸福感。",
    good: "好状态：心态稳定，能用更高视角看问题。",
    caution: "需注意：想太多或长期紧绷，需主动留白与休息。"
  },
  {
    name: "父母宫",
    meaning: "代表长辈、贵人、制度资源、证照文件与保护力。",
    good: "好状态：容易获得长辈、上司或制度层面的支持。",
    caution: "需注意：文件、合约、流程不可马虎，避免口头承诺。"
  }
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
  { type: "AI 回复", title: "开新店前先确认选址与预算", desc: "来自 AI 风水命理师对开业问题的初步建议。" },
  { type: "报告", title: "财运报告 · 守正现金流", desc: "正财稳定，偏财不宜冒进。" },
  { type: "运势", title: "05/04 宜签约", desc: "适合发布、合作、签约与客户邀约。" },
  { type: "产品", title: "办公室布局套装", desc: "适合把事业运势落到空间调整。" },
  { type: "课程", title: "商业择日与开业布局", desc: "适合创业者学习择时与动线逻辑。" },
  { type: "行动", title: "每周五财务复盘", desc: "固定整理现金流、应收款与预算。" },
  { type: "分享卡", title: "今日事业评分 91", desc: "可用于社群分享与推荐转化。" },
  { type: "洞察", title: "先整理后扩张", desc: "本周适合先做清单，再谈资源。" }
] as const;

const partnerMetrics = [
  ["Free 线索", "0", "等待真实推荐"],
  ["创业配套", "0", "8888 / 16888 / 38888"],
  ["本月新增", "0", "等待真实注册"],
  ["Pool Share", "RM0", "本月总分享金额"]
] as const;

const partnerPackageMix = [
  ["8888 创业启动包", 0, "等待真实购买"],
  ["16888 事业合伙人", 0, "等待真实购买"],
  ["38888 区域导师", 0, "等待真实购买"]
] as const;

const partnerLeadSegments = [
  ["Free 新人未完成资料", "0 人", "等待真实会员"],
  ["Free 已连续打卡 7 天", "0 人", "等待真实打卡"],
  ["已生成报告未咨询", "0 人", "等待真实报告"],
  ["8888 已招 5 人以上", "0 人", "等待真实团队"],
  ["16888 活跃合伙人", "0 人", "等待真实团队"],
  ["38888 区域代理", "0 人", "等待真实团队"]
] as const;

const partnerFollowUps = [
  "邀请第一批会员完成注册资料",
  "引导新会员生成第一份报告",
  "整理真实客户问题与后续跟进",
  "确认创业配套购买资格与合规文案"
] as const;

function compactAccountStats(
  stats: typeof dashboardStats,
  pointBalance: number,
  currentTier: MembershipTier
) {
  return stats.map((stat) => {
    if (stat.label === "当前点数") {
      return { ...stat, value: pointBalance.toLocaleString("en-US"), change: pointBalance <= 30 ? "注册奖励已到账" : stat.change };
    }

    if (stat.label === "今日 AI 次数") {
      return currentTier === "free" ? { ...stat, value: "0 / 3", change: "Free 每日基础额度" } : stat;
    }

    if (stat.label === "推荐收益") {
      return currentTier === "free" ? { ...stat, value: "RM0", change: "邀请好友后开始累积" } : stat;
    }

    if (stat.label === "待完成报告") {
      return currentTier === "free" ? { ...stat, value: "0", change: "生成报告需点数解锁" } : stat;
    }

    return stat;
  });
}

type SavedReport = {
  id: string;
  title: string;
  tag: string;
  points: number;
  createdAt: string;
  summary: string;
  metadata?: {
    kind?: "bazi_destiny" | "meihua_divination" | "ziwei_destiny" | "numerology_life_path" | "integrated_destiny";
    baziInput?: BaziReportInput;
    baziAnalysis?: BaziAnalysis;
    meihuaInput?: MeihuaReportInput;
    ziweiInput?: ZiweiReportInput;
    ziweiChart?: ZiweiChartSnapshot;
    numerologyInput?: NumerologyReportInput;
    integratedInput?: IntegratedReportInput;
    integratedScores?: Record<string, number>;
    integratedActions?: Record<string, string[]>;
  };
  sections: {
    title: string;
    content: string;
  }[];
};

type IntegratedAiContent = Pick<SavedReport, "summary" | "sections"> & {
  scores?: Record<string, number>;
  actions?: Record<string, string[]>;
};

type DailyFortuneResponse = {
  configured: boolean;
  model: string;
  reading: string;
  matrix: DailyFortuneMatrix;
};

type BaziReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  calendarType: "Gregorian" | "Lunar";
  lunarDate?: string;
  birthHourBranch?: string;
  focus: "career" | "wealth" | "relationship" | "health" | "business" | "yearly luck";
};

type BaziPillar = {
  label: string;
  stem: string;
  branch: string;
  hiddenStems: string;
  tenGods: string;
  naYin: string;
  emptyBranch: string;
};

type MeihuaReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  lunarDate?: string;
  birthHourBranch?: string;
  questionCategory: "career" | "wealth" | "relationship" | "health" | "business" | "legal" | "travel";
  specificQuestion: string;
  divinationDateTime: string;
  manualNumbers: string;
  mode: "random" | "time";
};

type ZiweiReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  calendarType: "Gregorian" | "Lunar";
  lunarDate?: string;
  birthHourBranch?: string;
  focus: "career" | "wealth" | "relationship" | "health" | "business" | "annual luck";
};

type ZiweiChartSnapshot = {
  engine?: string;
  mainPalaceBranch?: string;
  bodyPalaceBranch?: string;
  fiveElementName?: string;
  fiveElementNum?: number | string;
  ziweiBranch?: string;
  horoscopeDirection?: 1 | -1;
  lunarDate?: string;
  fourPillarsText?: string;
  zodiac?: string;
  chartNotes?: string;
  palaces?: Array<{
    index: number;
    palace: string;
    palaceName: string;
    branch: string;
    stem: string;
    age: string;
    majorStars: string[];
    minorStars: string[];
    stars: string;
    minor: string;
    transform: string;
    flying: string[];
    summary: string;
  }>;
  currentHoroscope?: Array<{ palaceName: string; age: number; yearly: number; yearlyText: string }>;
};

type NumerologyReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  lunarDate?: string;
  birthHourBranch?: string;
  focus: "career" | "wealth" | "relationship" | "personal growth" | "business" | "yearly luck";
};

type IntegratedReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  calendarType: "Gregorian" | "Lunar";
  lunarDate?: string;
  birthHourBranch?: string;
  focus: "career" | "wealth" | "relationship" | "health" | "business" | "yearly luck";
  questionCategory: MeihuaReportInput["questionCategory"];
  specificQuestion: string;
  divinationDateTime: string;
  manualNumbers: string;
  mode: MeihuaReportInput["mode"];
};

type ReportDemandPreset = {
  title: string;
  focus: IntegratedReportInput["focus"];
  questionCategory: IntegratedReportInput["questionCategory"];
  specificQuestion: string;
  message: string;
};

type ReportSubjectProfile = {
  id: string;
  label: string;
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  calendarType: "Gregorian" | "Lunar";
};

const baziReportCost = 380;
const meihuaReportCost = 260;
const ziweiReportCost = 420;
const numerologyReportCost = 220;
const integratedReportCost = 680;
const baziDisclaimer =
  "This report is based on traditional metaphysics and is for cultural reference, self-reflection, and personal planning only. It is not financial, legal, medical, or professional advice.";
const meihuaDisclaimer =
  "This report is based on traditional Mei Hua Yi Shu metaphysics and is for cultural reference, self-reflection, and personal planning only. It is not financial, legal, medical, or professional advice.";
const ziweiDisclaimer =
  "This report is based on traditional Zi Wei Dou Shu metaphysics and is for cultural reference, self-reflection, and personal planning only. It is not financial, legal, medical, or professional advice.";
const numerologyDisclaimer =
  "This report is based on numerology principles and is for cultural reference, self-reflection, and personal planning only. It is not financial, legal, medical, or professional advice.";

const focusLabels: Record<BaziReportInput["focus"], string> = {
  career: "事业",
  wealth: "财运",
  relationship: "感情",
  health: "健康",
  business: "商业",
  "yearly luck": "流年"
};

const meihuaCategoryLabels: Record<MeihuaReportInput["questionCategory"], string> = {
  career: "事业",
  wealth: "财运",
  relationship: "感情",
  health: "健康",
  business: "商业",
  legal: "法律 / 冲突",
  travel: "出行 / 搬迁"
};

const ziweiFocusLabels: Record<ZiweiReportInput["focus"], string> = {
  career: "事业",
  wealth: "财运",
  relationship: "感情",
  health: "健康",
  business: "商业",
  "annual luck": "流年"
};

const numerologyFocusLabels: Record<NumerologyReportInput["focus"], string> = {
  career: "事业",
  wealth: "财富",
  relationship: "关系",
  "personal growth": "个人成长",
  business: "商业",
  "yearly luck": "年度运势"
};

const integratedFocusLabels: Record<IntegratedReportInput["focus"], string> = focusLabels;

const reportContent: Record<string, Omit<SavedReport, "id" | "createdAt" | "tag" | "points">> = {
  八字命理测算完整报告: {
    title: "八字命理测算完整报告",
    summary: "命局以戊土日主为核心，五行土金较明显，适合先稳结构、定标准、再借水木之气打开流动与成长。",
    sections: [
      { title: "命局主轴", content: "日主戊土重稳定、责任与承载，遇金旺则利表达、技术与规则输出，遇水木则打开财流、学习与事业成长。" },
      { title: "事业财运", content: "适合经营、管理、顾问、地产空间、教育培训、系统化服务与需要长期信用累积的行业。财运宜守正现金流，再逐步扩张。" },
      { title: "行动建议", content: "今年先建立标准作业、现金流表与合作边界。重要决策前先复盘时机、资源、人和，再决定推进节奏。" }
    ]
  },
  梅花易数测算完整报告: {
    title: "梅花易数测算完整报告",
    summary: "此卦以当下问题为中心，先看本卦定位现状，再看动爻与变卦判断转折，适合用来做短线决策和行动窗口判断。",
    sections: [
      { title: "现状判断", content: "当前局势宜先观察，不宜急推。真正的关键在于厘清体用关系，分辨自己能控制的部分和外部变化。" },
      { title: "趋势推演", content: "变卦显示事情会有转圜空间，但需要等待沟通窗口和节奏变化，避免在阻力最大时硬碰硬。" },
      { title: "行动建议", content: "先整理资料、确认边界、选择吉时推进。若涉及财务、法律、健康等事项，请同步咨询专业人士。" }
    ]
  },
  紫微斗数命盘详细解析报告: {
    title: "紫微斗数命盘详细解析报告",
    summary: "此命盘以命宫格局为主轴，结合身宫、大限、流年与十二宫状态，帮助看清事业、财富、关系与人生阶段节奏。",
    sections: [
      { title: "命宫总论", content: "命宫主个性、格局与人生主轴。此盘适合以专业、责任、资源整合为核心，先建立长期可信度，再逐步扩大影响力。" },
      { title: "事业财帛", content: "官禄宫与财帛宫显示适合系统化服务、管理、顾问、教育与商业运营。财运宜从正财、长期合作和可复制产品中累积。" },
      { title: "行动建议", content: "重要阶段先看大限，再看流年触发点。重大合作、投资或转型需保留复盘、预算和风险边界。" }
    ]
  },
  数字命理测算完整报告: {
    title: "数字命理测算完整报告",
    summary: "数字命理以出生日期与姓名能量为基础，读取生命路径、命运数、灵魂渴望与年度节奏，帮助你看清优势、课题与行动方向。",
    sections: [
      { title: "核心数字", content: "生命路径数看人生主线，命运数看外在使命，灵魂渴望数看内在驱动力，人格数看外界感知。" },
      { title: "能量分布", content: "1-9 数字能量可观察表达力、行动力、关系力、秩序感与灵性直觉，缺失数字代表需要主动训练的课题。" },
      { title: "行动建议", content: "把优势变成稳定习惯，把缺口变成训练计划。重要年份先设目标，再用季度复盘校准方向。" }
    ]
  },
  综合命理决策报告: {
    title: "综合命理决策报告",
    summary: "综合报告以八字看底层命局，紫微看人生宫位与阶段，梅花易数看当前问题趋势，数字命理看人格节奏，最后整合成可执行策略。",
    sections: [
      { title: "四术交叉判断", content: "八字负责五行强弱与人生基础，紫微负责十二宫与阶段趋势，梅花负责当下问题的动爻转折，数字命理负责个人节奏与行为模式。" },
      { title: "当前策略", content: "先用八字与紫微判断长期方向，再以梅花确认短线时机，以数字命理校准执行习惯，避免只看单一系统导致判断偏差。" },
      { title: "行动建议", content: "重大决策建议分三步：先看方向是否匹配，再看时机是否成熟，最后看资源、人和、风险边界是否完整。" }
    ]
  },
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
const reportProfileStorageKey = "ai-fengshui-report-subject-profiles";
const sigilStorageKey = "ai-fengshui-sigil-vault";
const sigilCost = 88;
const divinationStorageKey = "ai-fengshui-jiuyun-divinations";
const divinationCheckInKey = "ai-fengshui-jiuyun-checkins";
const divinationCost = 36;
const hexagram64StorageKey = "ai-fengshui-hexagram64-one-word";
const hexagram64Cost = 8;
type Hexagram64Mode = "daily" | "question" | "deep";
const hexagram64ModeOptions: Array<{
  id: Hexagram64Mode;
  title: string;
  desc: string;
  cost: number;
  badge: string;
}> = [
  { id: "daily", title: "今日一字", desc: "每日状态提醒", cost: 8, badge: "高频" },
  { id: "question", title: "问事一字", desc: "针对一个具体问题", cost: 18, badge: "精准" },
  { id: "deep", title: "深度解字", desc: "一字 + 线索 + 行动策略", cost: 36, badge: "推荐" }
];
const placeholderBirthDates = new Set(["2000-01-01"]);
const placeholderBirthTimes = new Set(["08:30", "08:30 AM", "--:--"]);

function parseHourFromTime(time?: string) {
  const trimmed = (time || "").trim();

  if (!trimmed) {
    return null;
  }

  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const period = amPmMatch[3].toUpperCase();

    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour;
  }

  const match = trimmed.match(/^(\d{1,2})(?::\d{2})?/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
}

function getChineseHourBranch(time?: string) {
  const hour = parseHourFromTime(time);

  if (hour === null) {
    return "时辰未填写";
  }

  if (hour >= 23 || hour < 1) return "子时";
  if (hour < 3) return "丑时";
  if (hour < 5) return "寅时";
  if (hour < 7) return "卯时";
  if (hour < 9) return "辰时";
  if (hour < 11) return "巳时";
  if (hour < 13) return "午时";
  if (hour < 15) return "未时";
  if (hour < 17) return "申时";
  if (hour < 19) return "酉时";
  if (hour < 21) return "戌时";
  return "亥时";
}

function normalizeDateForInput(date?: string) {
  const trimmed = (date || "").trim();

  if (!trimmed) {
    return "";
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return trimmed;
}

function buildLocalDate(birthDate?: string, birthTime?: string) {
  const normalizedDate = normalizeDateForInput(birthDate);
  const [year, month, day] = normalizedDate.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const hour = parseHourFromTime(birthTime) ?? 12;
  const minuteMatch = (birthTime || "").match(/:(\d{2})/);
  const minute = minuteMatch ? Number(minuteMatch[1]) : 0;

  return new Date(year, month - 1, day, hour, minute);
}

function getAutoLunarDate(birthDate?: string, birthTime?: string, calendarType: "Gregorian" | "Lunar" = "Gregorian") {
  return getAutoLunarDateText(birthDate, birthTime, calendarType);
}

function attachLunarFields<T extends { birthDate: string; birthTime: string; calendarType?: "Gregorian" | "Lunar"; lunarDate?: string; birthHourBranch?: string }>(input: T): T {
  const birthDate = normalizeDateForInput(input.birthDate);
  const birthTime = input.birthTime;
  const calendarType = input.calendarType || "Gregorian";

  return {
    ...input,
    birthDate,
    lunarDate: getAutoLunarDate(birthDate, birthTime, calendarType),
    birthHourBranch: getMingliCalendar(birthDate, birthTime, calendarType)?.birthHourBranch || getChineseHourBranch(birthTime)
  };
}

function preferProfileDate(current: string, profileValue: string) {
  const normalizedCurrent = normalizeDateForInput(current);
  const normalizedProfile = normalizeDateForInput(profileValue);

  if (!normalizedProfile) {
    return normalizedCurrent;
  }

  if (!normalizedCurrent || placeholderBirthDates.has(normalizedCurrent)) {
    return normalizedProfile;
  }

  return normalizedCurrent;
}

function preferProfileTime(current: string, profileValue: string) {
  if (!profileValue) {
    return current;
  }

  if (!current || placeholderBirthTimes.has(current)) {
    return profileValue;
  }

  return current;
}

type SigilArtifact = {
  id: string;
  title: string;
  hash: string;
  path: string;
  gridPath?: string;
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
  bodyUseRelation: string;
  finalRelation: string;
  score: number;
  energyBoard: {
    stage: string;
    status: string;
    value: number;
    note: string;
  }[];
  clues: {
    trigram: string;
    title: string;
    people: string;
    behavior: string;
    space: string;
    bodyHint: string;
    prompt: string;
  }[];
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

type Hexagram64Reading = {
  id: string;
  createdAt: string;
  dateKey: string;
  timeKey: string;
  mode: Hexagram64Mode;
  modeLabel: string;
  question: string;
  cost: number;
  hexagram: string;
  hexagramTitle: string;
  upper: Trigram;
  lower: Trigram;
  word: string;
  theme: string;
  explanation: string;
  action: string;
  oracle: string;
  clue: string;
  element: Trigram["element"];
  score: number;
};

function formatReportText(report: SavedReport, memberProfile: MemberProfile) {
  const content = normalizedReportContent(report);

  return [
    `AI Feng Shui Master - ${report.title}`,
    `分析对象：${memberProfile.name}`,
    `出生资料：${memberProfile.birthDate}，${memberProfile.birthTimeLabel}，${memberProfile.gender}`,
    `联系方式：${memberProfile.email}${memberProfile.phone ? ` / ${memberProfile.phone}` : ""}`,
    `生成时间：${report.createdAt}`,
    `类型：${report.tag}`,
    "",
    "报告摘要",
    content.summary,
    "",
    ...content.sections.flatMap((section) => [section.title, section.content, ""]),
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

function defaultBaziReportInput(memberProfile: MemberProfile): BaziReportInput {
  return attachLunarFields({
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: normalizeDateForInput(memberProfile.birthDate),
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    calendarType: "Gregorian",
    focus: "career"
  });
}

function defaultMeihuaReportInput(memberProfile: MemberProfile): MeihuaReportInput {
  return attachLunarFields({
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: normalizeDateForInput(memberProfile.birthDate),
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    questionCategory: "business",
    specificQuestion: "我现在是否适合推进这个重要计划？",
    divinationDateTime: new Date().toISOString().slice(0, 16),
    manualNumbers: "8, 6, 3",
    mode: "time"
  });
}

function defaultZiweiReportInput(memberProfile: MemberProfile): ZiweiReportInput {
  return attachLunarFields({
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: normalizeDateForInput(memberProfile.birthDate),
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    calendarType: "Gregorian",
    focus: "career"
  });
}

function defaultNumerologyReportInput(memberProfile: MemberProfile): NumerologyReportInput {
  return attachLunarFields({
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: normalizeDateForInput(memberProfile.birthDate),
    birthTime: memberProfile.birthTime,
    focus: "personal growth"
  });
}

function defaultIntegratedReportInput(memberProfile: MemberProfile): IntegratedReportInput {
  return attachLunarFields({
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: normalizeDateForInput(memberProfile.birthDate),
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    calendarType: "Gregorian",
    focus: "business",
    questionCategory: "business",
    specificQuestion: "我现在最重要的下一步应该怎么选择？",
    divinationDateTime: new Date().toISOString().slice(0, 16),
    manualNumbers: "8, 6, 3",
    mode: "time"
  });
}

function focusForGeneralReport(title: string): IntegratedReportInput["focus"] {
  if (title.includes("财")) return "wealth";
  if (title.includes("感") || title.includes("合盘")) return "relationship";
  if (title.includes("流年")) return "yearly luck";
  if (title.includes("开业") || title.includes("公司") || title.includes("商业")) return "business";
  return "career";
}

function questionCategoryForGeneralReport(title: string): MeihuaReportInput["questionCategory"] {
  if (title.includes("财")) return "wealth";
  if (title.includes("感") || title.includes("合盘")) return "relationship";
  if (title.includes("公司") || title.includes("开业")) return "business";
  return "career";
}

function questionForGeneralReport(title: string) {
  const questions: Record<string, string> = {
    财运报告: "我接下来 90 天的财务机会、现金流风险与行动重点是什么？",
    事业报告: "我当前事业应该主动推进、调整方向，还是先稳定基础？",
    合盘报告: "这段关系或合作的真实状态、适配度与沟通重点是什么？",
    流年报告: "我今年的主要机会、风险与阶段行动重点是什么？",
    开业择日报告: "这个开业计划的时机、风险与启动策略是否合适？",
    公司风水初步分析: "公司当前空间、团队与业务节奏最需要先调整什么？"
  };

  return questions[title] || `请围绕「${title}」给出四术合参分析。`;
}

function generalReportInputFromMember(reportTitle: string, memberProfile: MemberProfile): IntegratedReportInput {
  return {
    ...defaultIntegratedReportInput(memberProfile),
    focus: focusForGeneralReport(reportTitle),
    questionCategory: questionCategoryForGeneralReport(reportTitle),
    specificQuestion: questionForGeneralReport(reportTitle)
  };
}

function subjectProfileFromIntegratedInput(input: IntegratedReportInput): ReportSubjectProfile {
  return {
    id: `${input.fullName || "profile"}-${input.birthDate || Date.now()}-${Date.now()}`,
    label: `${input.fullName || "未命名"}｜${input.birthDate || "未填生日"}`,
    fullName: input.fullName,
    gender: input.gender,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthLocation: input.birthLocation,
    calendarType: input.calendarType
  };
}

function applySubjectProfileToIntegratedInput(current: IntegratedReportInput, profile: ReportSubjectProfile): IntegratedReportInput {
  return {
    ...current,
    fullName: profile.fullName,
    gender: profile.gender,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    calendarType: profile.calendarType
  };
}

function createBaziDestinyReport(input: BaziReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">, baziAnalysis?: BaziAnalysis): SavedReport {
  const normalizedInput = attachLunarFields(input);
  const focusLabel = focusLabels[input.focus];

  return {
    id: `bazi-destiny-${Date.now()}`,
    title: "八字命理测算完整报告",
    tag: "命盘",
    points: baziReportCost,
    metadata: {
      kind: "bazi_destiny",
      baziInput: normalizedInput,
      baziAnalysis
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary: aiContent?.summary || `${normalizedInput.fullName} 的八字报告已围绕「${focusLabel}」生成。整体命局重视稳定、规划与长期累积，适合先建立标准，再借流动资源打开机会。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          {
            title: "命局总论",
            content: `以公历 ${normalizedInput.birthDate} ${normalizedInput.birthTime || "未提供时辰"}（${normalizedInput.lunarDate || "农历待换算"}）、${normalizedInput.birthLocation || "未提供出生地"} 为基础，报告从四柱、十神、五行强弱、大运与流年综合判断，重点观察${focusLabel}相关趋势。`
          },
          {
            title: "重点方向",
            content: "当前适合先整理资源、现金流、合作边界与执行节奏。若要扩大事业或投资，应先看清风险、时间窗口与自身承载力。"
          },
          {
            title: "实用建议",
            content: "用木水之气疏通成长与财流，用金的规则感建立表达与系统，用土的稳定性做长期复盘。避免因急于证明自己而过度承诺。"
          }
        ]
  };
}

function createMeihuaDivinationReport(input: MeihuaReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">): SavedReport {
  const normalizedInput = attachLunarFields(input);
  const category = meihuaCategoryLabels[input.questionCategory];

  return {
    id: `meihua-divination-${Date.now()}`,
    title: "梅花易数测算完整报告",
    tag: "占断",
    points: meihuaReportCost,
    metadata: {
      kind: "meihua_divination",
      meihuaInput: normalizedInput
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary:
      aiContent?.summary ||
      `${normalizedInput.fullName} 的梅花易数报告已围绕「${category}」问题生成。本卦看现状，动爻看转折，变卦看趋势，重点是选择合适时机和行动方式。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "现状判断", content: `问题：${normalizedInput.specificQuestion || category}。当前宜先观局势，确认体用关系，不宜急于硬推。` },
          { title: "转折趋势", content: "动爻提示事情会在沟通、时间或资源配置上出现变化，先守后动更稳。" },
          { title: "行动建议", content: "先整理资料与边界，选择有利时间窗口推进；若遇冲突，以缓和沟通和证据整理为先。" }
        ]
  };
}

function createZiweiDestinyReport(input: ZiweiReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">, ziweiChart?: ZiweiChartSnapshot): SavedReport {
  const normalizedInput = attachLunarFields(input);
  const focusLabel = ziweiFocusLabels[input.focus];

  return {
    id: `ziwei-destiny-${Date.now()}`,
    title: "紫微斗数命盘详细解析报告",
    tag: "紫微",
    points: ziweiReportCost,
    metadata: {
      kind: "ziwei_destiny",
      ziweiInput: normalizedInput,
      ziweiChart
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary:
      aiContent?.summary ||
      `${normalizedInput.fullName} 的紫微斗数命盘已围绕「${focusLabel}」生成。报告重点读取命宫、身宫、官禄宫、财帛宫、大限与流年触发。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "命宫总论", content: "命宫主个性、格局与人生主轴。此盘适合以专业、责任和资源整合为核心，稳步建立影响力。" },
          { title: "事业财帛", content: "事业适合系统化服务、管理、顾问、教育与商业运营。财运宜走长期合作与可复制产品路线。" },
          { title: "行动建议", content: "先看大限阶段，再看流年触发。重大决策需保留预算、风险边界和复盘节奏。" }
        ]
  };
}

function createNumerologyLifePathReport(input: NumerologyReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">): SavedReport {
  const normalizedInput = attachLunarFields(input);
  const focusLabel = numerologyFocusLabels[input.focus];

  return {
    id: `numerology-life-path-${Date.now()}`,
    title: "数字命理测算完整报告",
    tag: "数字",
    points: numerologyReportCost,
    metadata: {
      kind: "numerology_life_path",
      numerologyInput: normalizedInput
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary:
      aiContent?.summary ||
      `${normalizedInput.fullName} 的数字命理报告已围绕「${focusLabel}」生成。报告重点读取生命路径数、命运数、灵魂渴望数、人格数、生日数、成熟数与个人年数。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "核心数字", content: "生命路径数代表人生主线，命运数代表外在使命，灵魂渴望数代表内在驱动力，人格数代表外界感知。" },
          { title: "能量分布", content: "1-9 数字能量显示表达、行动、关系、稳定、自由、责任、洞察、财富与完成力。缺失数字是可训练的成长课题。" },
          { title: "行动建议", content: "把天赋转化为固定节奏，把年度主题拆成季度行动。重要合作前先确认边界、资源与时间表。" }
        ]
  };
}

function createIntegratedDestinyReport(input: IntegratedReportInput, aiContent?: IntegratedAiContent): SavedReport {
  const normalizedInput = attachLunarFields(input);
  const focusLabel = integratedFocusLabels[input.focus];
  const ziweiFocus = input.focus === "yearly luck" ? "annual luck" : input.focus;
  const numerologyFocus = input.focus === "health" ? "personal growth" : input.focus;

  return {
    id: `integrated-destiny-${Date.now()}`,
    title: "综合命理合参完整报告",
    tag: "综合",
    points: integratedReportCost,
    metadata: {
      kind: "integrated_destiny",
      integratedInput: normalizedInput,
      baziInput: {
        fullName: normalizedInput.fullName,
        gender: normalizedInput.gender,
        birthDate: normalizedInput.birthDate,
        birthTime: normalizedInput.birthTime,
        birthLocation: normalizedInput.birthLocation,
        calendarType: normalizedInput.calendarType,
        lunarDate: normalizedInput.lunarDate,
        birthHourBranch: normalizedInput.birthHourBranch,
        focus: input.focus
      },
      ziweiInput: {
        fullName: normalizedInput.fullName,
        gender: normalizedInput.gender,
        birthDate: normalizedInput.birthDate,
        birthTime: normalizedInput.birthTime,
        birthLocation: normalizedInput.birthLocation,
        calendarType: normalizedInput.calendarType,
        lunarDate: normalizedInput.lunarDate,
        birthHourBranch: normalizedInput.birthHourBranch,
        focus: ziweiFocus
      } as ZiweiReportInput,
      meihuaInput: {
        fullName: normalizedInput.fullName,
        gender: normalizedInput.gender,
        birthDate: normalizedInput.birthDate,
        birthTime: normalizedInput.birthTime,
        birthLocation: normalizedInput.birthLocation,
        lunarDate: normalizedInput.lunarDate,
        birthHourBranch: normalizedInput.birthHourBranch,
        questionCategory: input.questionCategory,
        specificQuestion: input.specificQuestion,
        divinationDateTime: input.divinationDateTime,
        manualNumbers: input.manualNumbers,
        mode: input.mode
      },
      numerologyInput: {
        fullName: normalizedInput.fullName,
        gender: normalizedInput.gender,
        birthDate: normalizedInput.birthDate,
        birthTime: normalizedInput.birthTime,
        lunarDate: normalizedInput.lunarDate,
        birthHourBranch: normalizedInput.birthHourBranch,
        focus: numerologyFocus
      } as NumerologyReportInput,
      integratedScores: aiContent?.scores,
      integratedActions: aiContent?.actions
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary:
      aiContent?.summary ||
      `${normalizedInput.fullName} 的个人命理综合报告已围绕「${focusLabel}」生成。报告会从个人底层性格、当前阶段、关键问题、风险处理、通关方式、产品与仪式建议等角度给出完整拆解。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "一、个人命格总论", content: "你适合先建立稳定结构，再逐步打开机会。优势在于能观察细节、整理资源、累积长期信任；弱点是压力大时容易想太多，导致行动变慢或沟通不够直接。" },
          { title: "二、当前阶段状态", content: `围绕「${input.specificQuestion || "当前关键问题"}」，现在更像整理与校准期。适合先确认目标、资源、人和与风险边界，不宜因为一时焦虑而做不可逆决定。` },
          { title: "三、事业与财富建议", content: "事业上适合走专业化、流程化、可复制的方向。财务上要优先管理现金流、合约、预算与回款节奏。任何合作都要先写清楚角色、分账、责任和退出机制。" },
          { title: "四、关系与健康提醒", content: "关系中要避免承担过多情绪压力。健康方面只作生活提醒：规律睡眠、减少熬夜、固定运动与情绪释放比短期补救更重要；身体不适必须咨询医疗专业人士。" },
          { title: "五、通关与危机处理", content: "遇到阻滞时先暂停 24 小时，把问题写成事实、风险、选择三栏，再做小规模验证。适合用整理空间、清楚边界、固定复盘来通关。" },
          { title: "六、产品与仪式建议", content: "可使用九运香、白水晶、金属收纳或办公室布局用品帮助聚焦，但重点不是物件本身，而是配合固定仪式：点香 9 分钟、写下一件最重要行动、完成后整理桌面。" },
          { title: "七、30 天行动节奏", content: "未来 30 天先做清理与校准：整理资料、确认预算、重排优先级，并把最重要的合作或计划写成可追踪清单。不要一次处理太多方向，先让一个关键事项稳定推进。" },
          { title: "八、60 天资源布局", content: "60 天内适合做小范围测试，例如试跑服务、接触合作对象、复盘客户反馈或优化产品内容。重点不是立刻放大，而是看清谁能配合、什么能成交、哪里需要补强。" },
          { title: "九、90 天扩张判断", content: "90 天后才适合评估是否扩大投入。判断标准包括现金流是否稳定、团队是否能承接、客户是否有复购，以及自己是否还能保持健康节奏。若其中两项不足，应先稳盘再扩张。" },
          { title: "十、最终提醒", content: "命理分析的价值在于帮助你看清节奏，而不是替代现实判断。重要财务、法律、医疗事项必须咨询专业人士；本报告更适合用来做自我觉察、规划排序和行动提醒。" }
        ]
  };
}

function visibleReportSections(report: SavedReport) {
  return report.sections.filter((section) => section.title !== "__metadata");
}

function parseEmbeddedReportPayload(text?: string) {
  if (!text || !text.includes("{") || !text.includes("summary")) {
    return null;
  }

  const candidates = [
    text.trim(),
    text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
    text.match(/\{[\s\S]*\}/)?.[0] || ""
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      let parsed = JSON.parse(candidate) as unknown;

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()) as unknown;
      }

      if (parsed && typeof parsed === "object") {
        const payload = parsed as { summary?: unknown; sections?: unknown };
        const sections = Array.isArray(payload.sections)
          ? payload.sections
              .map((section) => {
                if (!section || typeof section !== "object") {
                  return null;
                }

                const item = section as { title?: unknown; content?: unknown };
                const title = typeof item.title === "string" ? item.title.trim() : "";
                const content = typeof item.content === "string" ? item.content.trim() : "";

                return title && content ? { title, content } : null;
              })
              .filter((section): section is SavedReport["sections"][number] => Boolean(section))
          : [];

        return {
          summary: typeof payload.summary === "string" ? payload.summary.trim() : "",
          sections
        };
      }
    } catch {
      // Existing saved reports may contain raw JSON fragments; try the next candidate.
    }
  }

  return null;
}

function normalizedReportContent(report: SavedReport) {
  const directSections = visibleReportSections(report);
  const embedded =
    parseEmbeddedReportPayload(report.summary) ||
    parseEmbeddedReportPayload(directSections[0]?.content);

  return {
    summary: embedded?.summary || report.summary,
    sections: embedded?.sections?.length ? embedded.sections : directSections
  };
}

function reportSubjectName(report: SavedReport) {
  return (
    report.metadata?.integratedInput?.fullName ||
    report.metadata?.baziInput?.fullName ||
    report.metadata?.ziweiInput?.fullName ||
    report.metadata?.meihuaInput?.fullName ||
    report.metadata?.numerologyInput?.fullName ||
    "未命名对象"
  );
}

function reportExecutiveSummary(report: SavedReport) {
  const content = normalizedReportContent(report);
  const firstSection = content.sections[0]?.content || content.summary;
  const secondSection = content.sections[1]?.content || "建议先稳住节奏，整理资源、边界和行动次序，再判断是否扩大投入。";

  return [
    ["核心判断", content.summary],
    ["当前关键", firstSection],
    ["行动方向", secondSection]
  ] as const;
}

function reportProfessionalMetrics(report: SavedReport) {
  const scores = report.metadata?.integratedScores;

  if (scores) {
    return [
      ["整体格局", scores.overall ?? 86],
      ["事业", scores.career ?? 84],
      ["财运", scores.wealth ?? 82],
      ["感情", scores.relationship ?? 78],
      ["健康", scores.health ?? 76],
      ["时机", scores.timing ?? 80]
    ] as const;
  }

  return [
    ["整体格局", 86],
    ["事业", 84],
    ["财运", 82],
    ["感情", 78],
    ["健康", 76],
    ["时机", 80]
  ] as const;
}

function reportTableOfContents(report: SavedReport) {
  const fixedItems = ["个人资料", "报告核心摘要", "命理指标", "重点结论", "7 日通关计划"];
  const sectionItems = normalizedReportContent(report).sections.map((section) =>
    section.title.replace(/^[一二三四五六七八九十]+、/, "")
  );

  return [...fixedItems, ...sectionItems].slice(0, 12);
}

function reportKeyConclusionCards(report: SavedReport) {
  const actions = report.metadata?.integratedActions;
  const summary = normalizedReportContent(report).summary || "先看清当前节奏，再决定下一步行动。";

  return [
    ["核心判断", summary],
    ["现在适合", actions?.now?.[0] || "先整理目标、资源、预算与合作边界，再做小范围验证。"],
    ["暂不适合", actions?.avoid?.[0] || "避免冲动签约、过度承诺、同时推进太多方向。"],
    ["关键风险", "现金流压力、沟通误解、节奏过急与资源分散，是近期最需要先处理的地方。"]
  ] as const;
}

function reportSevenDayPlan(report: SavedReport) {
  const actions = report.metadata?.integratedActions;

  return [
    ["Day 1", "整理资料", "把当前目标、资金、合作对象与待办事项写成清单，先看清现实盘面。"],
    ["Day 2", "复盘现金流", "列出收入、支出、应收款与未来 30 天预算，避免情绪化投入。"],
    ["Day 3", "确认人和", actions?.now?.[0] || "联系关键客户、合作方或贵人，确认下一步是否有真实支持。"],
    ["Day 4", "调整空间", "整理办公桌、文件和财位；以青绿、蓝色或金色小物提醒自己稳定行动。"],
    ["Day 5", "静心定向", actions?.ritual?.[0] || "静坐或点香 9 分钟，写下一件最重要但最容易逃避的行动。"],
    ["Day 6", "小步验证", "选择一个低风险动作先执行，例如邀约、报价、测试服务或确认合作条款。"],
    ["Day 7", "总结取舍", "检查这一周的阻力、成果与情绪变化，决定继续推进、调整或暂缓。"]
  ] as const;
}

function reportRiskRadar(report: SavedReport) {
  const scores = report.metadata?.integratedScores;
  const wealthRisk = scores?.wealth && scores.wealth < 70 ? "高" : "中";
  const timingRisk = scores?.timing && scores.timing < 70 ? "高" : "中";
  const relationshipRisk = scores?.relationship && scores.relationship < 72 ? "中高" : "中";

  return [
    ["现金流风险", wealthRisk, "先看预算、回款、合约与固定支出，避免为了机会过早放大投入。"],
    ["决策时机", timingRisk, "重大决定先等信息齐全；适合用小范围验证取代一次性押注。"],
    ["人际合作", relationshipRisk, "合作前先谈清角色、分账、责任边界与退出机制。"],
    ["身心消耗", "中", "近期不宜长期熬夜或高压硬撑，稳定作息会直接影响判断质量。"]
  ] as const;
}

function reportDecisionChecklist(report: SavedReport) {
  const actions = report.metadata?.integratedActions;

  return [
    ["优先处理", actions?.now?.[0] || "确认当前最重要目标，只保留 1-2 个主线推进。"],
    ["需要等待", "涉及大额投入、长期合约或复杂合作时，先等资料、条件与人和更完整。"],
    ["可以推进", "低成本测试、邀约沟通、内部整理、产品优化、客户复盘与学习升级。"],
    ["必须避开", actions?.avoid?.[0] || "情绪化承诺、冲动签约、借钱扩张、边界不清的合作。"]
  ] as const;
}

function reportSolutionStack(report: SavedReport) {
  const actions = report.metadata?.integratedActions;

  return [
    ["空间", "整理东南或北方工作区，保留文件、计划表、收纳盒与一个稳定光源。"],
    ["颜色", "主用青绿、蓝、金；若压力大，减少大面积红色和强烈橙色。"],
    ["仪式", actions?.ritual?.[0] || "每日固定 9 分钟静心，写下一件最重要行动，完成后整理桌面。"],
    ["产品", "适合搭配九运香、白水晶、五行饰品或办公室布局用品；以提醒行动为主，不夸大功效。"],
    ["课程/咨询", "若问题涉及事业转型、开业、合作或长期布局，建议升级为深度报告或预约大师咨询。"]
  ] as const;
}

function reportWealthRadar(report: SavedReport) {
  const scores = report.metadata?.integratedScores;
  const wealth = scores?.wealth ?? 82;
  const career = scores?.career ?? 84;
  const timing = scores?.timing ?? 79;
  const relationship = scores?.relationship ?? 80;
  const riskControl = scores?.risk ?? 78;
  const overall = scores?.overall ?? 84;

  return [
    ["正财运", Math.min(96, Math.round((career + overall) / 2)), "主业与稳定收入能力"],
    ["偏财运", Math.max(58, Math.round((wealth + timing) / 2) - 4), "投资、机会财与外部项目"],
    ["守财力", Math.max(52, riskControl), "现金流留存与预算纪律"],
    ["资源整合", Math.min(95, Math.round((relationship + overall) / 2)), "人脉、客户与合作变现"],
    ["行动爆发", Math.min(94, Math.round((career + timing) / 2)), "执行速度与落地能力"],
    ["抗险能力", Math.max(55, Math.round((riskControl + timing) / 2)), "防破财、防误判能力"]
  ] as const;
}

function reportTimingBoard(report: SavedReport) {
  const focus = report.metadata?.integratedInput?.focus || "business";
  const focusText = integratedFocusLabels[focus] || "综合方向";

  return [
    ["红榜", "未来 2-4 周", `适合整理报价、回收账款、确认合作条款，并把「${focusText}」相关资源做成清单。`],
    ["黑榜", "情绪压力高峰日", "不宜冲动签约、借钱扩张或答应模糊分账；凡是催你马上决定的人，先缓一晚。"],
    ["观察窗", "未来 30 天", "若连续两次出现同一类阻力，说明问题不在运气，而在流程、边界或预算结构。"]
  ] as const;
}

function reportPeopleGuide(report: SavedReport) {
  const actions = report.metadata?.integratedActions;

  return [
    ["财富贵人", "留意做事直接、重视规则、愿意把条件讲清楚的人；他们能帮你把模糊机会变成可执行方案。"],
    ["风险对象", "远离画大饼、不断制造焦虑、催你立刻掏钱或不愿写清责任边界的人。"],
    ["借力动作", actions?.now?.[0] || "本周主动联系一位专业人士或稳定客户，请对方帮你看一次方案风险。"]
  ] as const;
}

function formatStructuredReportContent(content: string) {
  const lines = content
    .split(/(?=【[^】]+】)|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 1 ? lines : [content];
}

const baziStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const baziBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const baziStemElements: Record<string, Trigram["element"]> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};
const baziBranchHiddenStems: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"]
};
const naYinPairs = [
  "海中金",
  "炉中火",
  "大林木",
  "路旁土",
  "剑锋金",
  "山头火",
  "涧下水",
  "城头土",
  "白蜡金",
  "杨柳木",
  "泉中水",
  "屋上土",
  "霹雳火",
  "松柏木",
  "长流水",
  "砂中金",
  "山下火",
  "平地木",
  "壁上土",
  "金箔金",
  "佛灯火",
  "天河水",
  "大驿土",
  "钗钏金",
  "桑柘木",
  "大溪水",
  "沙中土",
  "天上火",
  "石榴木",
  "大海水"
];

function normalizeCycleIndex(index: number) {
  return ((index % 60) + 60) % 60;
}

function getStemBranchFromIndex(index: number) {
  const normalized = normalizeCycleIndex(index);
  return {
    stem: baziStems[normalized % 10],
    branch: baziBranches[normalized % 12],
    index: normalized
  };
}

function getCycleIndexFromStemBranch(stem: string, branch: string) {
  return Array.from({ length: 60 }, (_, index) => index).find((index) => baziStems[index % 10] === stem && baziBranches[index % 12] === branch) ?? 0;
}

function getApproxSolarYear(date: Date) {
  const year = date.getFullYear();
  const beforeLiChun = date.getMonth() === 0 || (date.getMonth() === 1 && date.getDate() < 4);
  return beforeLiChun ? year - 1 : year;
}

function getApproxSolarMonthIndex(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 2 && day >= 4) return 0;
  if (month === 3 && day >= 6) return 1;
  if (month === 4 && day >= 5) return 2;
  if (month === 5 && day >= 6) return 3;
  if (month === 6 && day >= 6) return 4;
  if (month === 7 && day >= 7) return 5;
  if (month === 8 && day >= 8) return 6;
  if (month === 9 && day >= 8) return 7;
  if (month === 10 && day >= 8) return 8;
  if (month === 11 && day >= 7) return 9;
  if (month === 12 && day >= 7) return 10;
  if (month === 1 && day >= 6) return 11;

  return month === 1 ? 10 : Math.max(0, month - 3);
}

function getMonthStemStart(yearStem: string) {
  if (yearStem === "甲" || yearStem === "己") return 2;
  if (yearStem === "乙" || yearStem === "庚") return 4;
  if (yearStem === "丙" || yearStem === "辛") return 6;
  if (yearStem === "丁" || yearStem === "壬") return 8;
  return 0;
}

function getJulianDayNumber(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getTenGod(dayStem: string, targetStem: string) {
  if (dayStem === targetStem) return "日主";

  const stemPolarity: Record<string, "阳" | "阴"> = {
    甲: "阳",
    乙: "阴",
    丙: "阳",
    丁: "阴",
    戊: "阳",
    己: "阴",
    庚: "阳",
    辛: "阴",
    壬: "阳",
    癸: "阴"
  };
  const elementCreates: Record<Trigram["element"], Trigram["element"]> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const elementControls: Record<Trigram["element"], Trigram["element"]> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  const dayElement = baziStemElements[dayStem];
  const targetElement = baziStemElements[targetStem];
  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];

  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (elementCreates[targetElement] === dayElement) return samePolarity ? "偏印" : "正印";
  if (elementCreates[dayElement] === targetElement) return samePolarity ? "食神" : "伤官";
  if (elementControls[dayElement] === targetElement) return samePolarity ? "偏财" : "正财";
  return samePolarity ? "七杀" : "正官";
}

function getNaYin(index: number) {
  return naYinPairs[Math.floor(normalizeCycleIndex(index) / 2)] || "纳音待校准";
}

function getEmptyBranch(index: number) {
  return ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"][Math.floor(normalizeCycleIndex(index) / 10)] || "待校准";
}

function getBaziPillars(input?: BaziReportInput): BaziPillar[] {
  const calendar = getMingliCalendar(input?.birthDate, input?.birthTime, input?.calendarType || "Gregorian");

  if (!calendar) {
    return [
      { label: "年柱", stem: "待", branch: "定", hiddenStems: "请填写出生日期", tenGods: "待排盘", naYin: "待校准", emptyBranch: "待校准" },
      { label: "月柱", stem: "待", branch: "定", hiddenStems: "请填写出生日期", tenGods: "待排盘", naYin: "待校准", emptyBranch: "待校准" },
      { label: "日柱", stem: "待", branch: "定", hiddenStems: "请填写出生日期", tenGods: "待排盘", naYin: "待校准", emptyBranch: "待校准" },
      { label: "时柱", stem: "待", branch: "定", hiddenStems: "请填写出生时间", tenGods: "待排盘", naYin: "待校准", emptyBranch: "待校准" }
    ];
  }

  return calendar.pillars.map((pillar) => ({
    label: pillar.label,
    stem: pillar.stem,
    branch: pillar.branch,
    hiddenStems: pillar.hiddenStems.join(" / ") || "无",
    tenGods: [pillar.stemTenGod, ...pillar.branchTenGods].filter(Boolean).join(" / ") || (pillar.label === "日柱" ? "日主" : "待排盘"),
    naYin: pillar.naYin,
    emptyBranch: pillar.emptyBranch
  }));
}

function getBaziElementRows(pillars: BaziPillar[]) {
  const totals: Record<Trigram["element"], number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };

  pillars.forEach((pillar) => {
    const stemElement = baziStemElements[pillar.stem];
    if (stemElement) totals[stemElement] += 1;

    (baziBranchHiddenStems[pillar.branch] || []).forEach((stem, index) => {
      const element = baziStemElements[stem];
      if (element) totals[element] += index === 0 ? 0.8 : 0.35;
    });
  });

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;
  const tones: Record<Trigram["element"], string> = {
    金: "表达、规则、专业输出与制度感。",
    木: "成长、学习、规划与长期项目。",
    水: "财流、智慧、沟通与流动资源。",
    火: "曝光、行动力、热度与名声。",
    土: "承载、稳定、管理与现实基础。"
  };

  return (["金", "木", "水", "火", "土"] as const).map((element) => ({
    element,
    value: Math.round((totals[element] / total) * 100),
    tone: tones[element]
  }));
}

function getTenYearLuckRows() {
  return [
    ["5-14", "1985-1994", "癸", "未", "正财", "学习基础期，家庭与稳定感影响较深。"],
    ["15-24", "1995-2004", "甲", "申", "七杀", "竞争变强，适合训练胆识与纪律。"],
    ["25-34", "2005-2014", "乙", "酉", "正官", "事业规则建立，名声与责任逐步提高。"],
    ["35-44", "2015-2024", "丙", "戌", "偏印", "适合沉淀专业，重整事业模式。"],
    ["45-54", "2025-2034", "丁", "亥", "正印", "学习、品牌、系统化服务有利，宜稳中扩张。"],
    ["55-64", "2035-2044", "戊", "子", "比肩", "资源整合与团队协作成为重点。"],
    ["65-74", "2045-2054", "己", "丑", "劫财", "宜守成、传承、资产保全。"],
    ["75-84", "2055-2064", "庚", "寅", "食神", "适合分享经验、教学与顾问输出。"]
  ];
}

function getAnnualLuckRows() {
  const startYear = new Date().getFullYear();
  const stems = ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙"];
  const branches = ["午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"];
  const themes = ["整理方向", "合作扩张", "现金流优化", "规则升级", "品牌输出", "资源整合", "学习转型", "稳固资产", "开创新线", "人脉放大", "复盘收成"];

  return Array.from({ length: 11 }, (_, index) => ({
    year: startYear + index,
    stemBranch: `${stems[index]}${branches[index]}`,
    theme: themes[index],
    career: index % 3 === 0 ? "稳中推进" : index % 3 === 1 ? "利合作" : "宜系统化",
    wealth: index % 2 === 0 ? "正财优先" : "注意预算",
    relationship: index % 2 === 0 ? "沟通顺畅" : "避免误会",
    reminder: index % 3 === 2 ? "重大决定先复盘风险" : "先定目标再行动"
  }));
}

function getBaziScoreRows() {
  return [
    ["整体命格", 82],
    ["事业", 86],
    ["财运", 78],
    ["感情", 72],
    ["健康", 70],
    ["贵人运", 80]
  ] as const;
}

function getMeihuaHexagramLines(variant: "main" | "change" = "main") {
  return variant === "main" ? [1, 1, 1, 0, 0, 0] : [1, 1, 0, 1, 0, 0];
}

function getMeihuaScoreRows() {
  return [
    ["整体卦势", 78],
    ["事业", 76],
    ["财运", 72],
    ["感情", 70],
    ["健康倾向", 74],
    ["行动时机", 82]
  ] as const;
}

function getZiweiPalaceRows(input?: ZiweiReportInput) {
  const calendar = getMingliCalendar(input?.birthDate, input?.birthTime, input?.calendarType || "Gregorian");
  const palaceNames = ["命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫", "迁移宫", "交友宫", "官禄宫", "田宅宫", "福德宫", "父母宫"];
  const branchOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  const mingBranch = (calendar?.mingGong || "寅").slice(-1);
  const mingIndex = Math.max(0, branchOrder.indexOf(mingBranch));
  const palaces = Array.from({ length: 12 }, (_, index) => {
    const branch = branchOrder[(mingIndex + index) % branchOrder.length];
    return `${palaceNames[index]} · ${branch}`;
  });
  const starSeed = Math.max(0, baziBranches.indexOf((calendar?.pillars[2].branch || "午") as (typeof baziBranches)[number]));
  const starGroups = ["紫微 天府", "天机 太阴", "贪狼 红鸾", "天同 天梁", "武曲 禄存", "巨门 天刑", "太阳 文昌", "七杀 左辅", "廉贞 天相", "破军 右弼", "太阴 天魁", "天梁 天钺"];
  const stars = Array.from({ length: 12 }, (_, index) => starGroups[(index + starSeed) % starGroups.length]);
  const minor = ["文昌", "文曲", "红鸾", "天喜", "禄存", "陀罗", "天马", "左辅", "右弼", "地空", "天魁", "天钺"];
  const transforms = ["化禄", "", "化科", "", "化权", "化忌", "", "", "化禄", "", "化科", ""];
  const summaries = [
    "观察自我定位、性格底盘与人生主轴。",
    "观察手足同辈、同侪资源与合作分寸。",
    "观察伴侣关系、长期合作与亲密沟通。",
    "观察子女、作品、下属与延伸成果。",
    "观察收入模式、现金流与财富承载。",
    "观察健康倾向、压力来源与生活节律。",
    "观察外出发展、迁移机会与市场连接。",
    "观察朋友团队、客户群与人脉品质。",
    "观察事业定位、职场角色与经营能力。",
    "观察资产、空间、家庭基础与稳定度。",
    "观察内在满足、福气来源与精神状态。",
    "观察长辈支持、制度资源与早年影响。"
  ];

  return palaces.map((palace, index) => ({
    index,
    palace,
    palaceName: palaceNames[index],
    branch: palace.split(" · ")[1] || branchOrder[index],
    stem: calendar?.pillars[index % 4]?.stem || "待",
    age: `${index * 10 + 3}-${index * 10 + 12}`,
    majorStars: stars[index].split(" "),
    minorStars: [minor[index]],
    stars: stars[index],
    minor: minor[index],
    transform: transforms[index] || "平",
    flying: [],
    summary: summaries[index] || "先观察，再择机行动。"
  }));
}

function getZiweiLuckRows(input?: ZiweiReportInput) {
  return [
    ["3-12", "命宫", "紫微 天府", "基础稳定，重视学习与家庭影响。"],
    ["13-22", "兄弟宫", "天机 太阴", "思维活跃，人际与学习变化多。"],
    ["23-32", "夫妻宫", "贪狼 红鸾", "关系与合作机会增加，需定边界。"],
    ["33-42", "子女宫", "天同 天梁", "适合沉淀专业，建立服务模式。"],
    ["43-52", "财帛宫", "武曲 禄存", "财务结构变强，利正财与资产配置。"],
    ["53-62", "疾厄宫", "巨门 天刑", "注意压力管理与作息规律。"],
    ["63-72", "迁移宫", "太阳 文昌", "外部机会增加，利教学与顾问。"],
    ["73-82", "交友宫", "七杀 左辅", "团队资源需筛选，重视信任机制。"]
  ];
}

function getZiweiAnnualRows(input?: ZiweiReportInput) {
  const startYear = new Date().getFullYear();
  const palaces = ["官禄宫", "财帛宫", "夫妻宫", "迁移宫", "福德宫", "命宫", "田宅宫", "交友宫", "父母宫", "疾厄宫", "子女宫"];

  return Array.from({ length: 11 }, (_, index) => ({
    year: startYear + index,
    palace: palaces[index % palaces.length],
    theme: index % 3 === 0 ? "事业布局" : index % 3 === 1 ? "财务整理" : "关系调整",
    career: index % 2 === 0 ? "利规划与升维" : "宜稳守执行",
    wealth: index % 2 === 0 ? "正财稳进" : "投资需保守",
    relationship: index % 2 === 0 ? "贵人助力" : "沟通需慢",
    reminder: index % 3 === 1 ? "先审预算再扩大" : "重要决定先复盘"
  }));
}

function getZiweiScoreRows() {
  return [
    ["整体命格", 88],
    ["事业", 86],
    ["财运", 82],
    ["感情", 76],
    ["健康", 72],
    ["贵人运", 84]
  ] as const;
}

function reduceNumerologyNumber(value: number) {
  let total = Math.abs(value);
  while (total > 9) {
    total = String(total)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return total || 9;
}

function numberValueFromChar(char: string) {
  const normalized = char.toUpperCase();
  if (normalized >= "A" && normalized <= "Z") {
    return ((normalized.charCodeAt(0) - 65) % 9) + 1;
  }
  return (char.charCodeAt(0) % 9) + 1;
}

function sumNameNumbers(name: string, mode: "all" | "soul" | "personality" = "all") {
  const chars = Array.from(name.replace(/\s/g, ""));
  const vowels = new Set(["A", "E", "I", "O", "U"]);

  return chars.reduce((sum, char, index) => {
    const upper = char.toUpperCase();
    const isRoman = upper >= "A" && upper <= "Z";
    const isSoul = isRoman ? vowels.has(upper) : index % 2 === 0;
    if (mode === "soul" && !isSoul) return sum;
    if (mode === "personality" && isSoul) return sum;
    return sum + numberValueFromChar(char);
  }, 0);
}

function getBirthDigits(birthDate: string) {
  return birthDate.replace(/\D/g, "").split("").map(Number).filter((digit) => digit > 0);
}

function getNumerologyCore(input?: NumerologyReportInput) {
  const birthDate = input?.birthDate || new Date().toISOString().slice(0, 10);
  const name = input?.fullName || "用户";
  const [, month = "6", day = "14"] = birthDate.split("-");
  const dateDigits = birthDate.replace(/\D/g, "");
  const lifePath = reduceNumerologyNumber(dateDigits.split("").reduce((sum, digit) => sum + Number(digit), 0));
  const destiny = reduceNumerologyNumber(sumNameNumbers(name));
  const soulUrge = reduceNumerologyNumber(sumNameNumbers(name, "soul"));
  const personality = reduceNumerologyNumber(sumNameNumbers(name, "personality") || destiny);
  const birthday = reduceNumerologyNumber(Number(day));
  const maturity = reduceNumerologyNumber(lifePath + destiny);
  const personalYear = reduceNumerologyNumber(
    String(new Date().getFullYear()).split("").reduce((sum, digit) => sum + Number(digit), 0) + Number(month) + Number(day)
  );

  return { lifePath, destiny, soulUrge, personality, birthday, maturity, personalYear };
}

function getNumerologyMeaning(number: number) {
  const meanings: Record<number, { title: string; strength: string; weakness: string; lesson: string }> = {
    1: { title: "开创与领导", strength: "独立、果断、敢开始", weakness: "容易急躁或太想掌控", lesson: "学习把主见变成稳定带领" },
    2: { title: "合作与感受", strength: "敏锐、温和、善协调", weakness: "容易犹豫或过度在意别人", lesson: "学习表达真实需求" },
    3: { title: "表达与创造", strength: "创意、沟通、感染力", weakness: "容易分散或情绪化", lesson: "学习把灵感落地成作品" },
    4: { title: "秩序与执行", strength: "稳定、纪律、重细节", weakness: "容易僵化或压力过重", lesson: "学习在规则中保留弹性" },
    5: { title: "自由与变化", strength: "适应快、机会感强", weakness: "容易不安定或三分钟热度", lesson: "学习选择值得长期投入的方向" },
    6: { title: "责任与照顾", strength: "可靠、温暖、重承诺", weakness: "容易过度承担", lesson: "学习照顾别人前先照顾自己" },
    7: { title: "洞察与研究", strength: "分析、直觉、深度学习", weakness: "容易封闭或想太多", lesson: "学习把洞察说清楚" },
    8: { title: "资源与成就", strength: "商业、管理、目标感", weakness: "容易用结果定义自己", lesson: "学习平衡成果与价值观" },
    9: { title: "整合与影响", strength: "格局、同理、完成力", weakness: "容易理想化或边界不清", lesson: "学习有边界地付出" }
  };
  return meanings[number] || meanings[9];
}

function getNumerologyEnergyRows(input?: NumerologyReportInput) {
  const core = getNumerologyCore(input);
  const counts = Array.from({ length: 9 }, () => 0);
  [...getBirthDigits(input?.birthDate || "1980-06-14"), ...Object.values(core)].forEach((value) => {
    counts[value - 1] += 1;
  });

  return counts.map((count, index) => ({
    number: index + 1,
    count,
    strength: Math.min(100, 20 + count * 20),
    label: count === 0 ? "缺失" : count >= 3 ? "重复强" : count === 2 ? "稳定" : "基础"
  }));
}

function getNumerologyCycleRows(input?: NumerologyReportInput) {
  const core = getNumerologyCore(input);
  const startYear = Number((input?.birthDate || "1980-06-14").slice(0, 4));
  const cycles = [
    ["0-28", startYear, core.lifePath, "打底与自我认知", 72, "建立基础能力，找到最自然的表达方式。"],
    ["29-36", startYear + 29, core.destiny, "事业定位", 80, "把经验整理成专业，减少无效试探。"],
    ["37-45", startYear + 37, core.maturity, "资源整合", 86, "适合品牌、团队、产品化与长期合作。"],
    ["46-54", startYear + 46, core.personalYear, "成果放大", 83, "以复盘与管理能力承接更大机会。"],
    ["55+", startYear + 55, reduceNumerologyNumber(core.lifePath + core.maturity), "传承与影响", 78, "适合教学、顾问、分享经验与稳定资产。"]
  ] as const;

  return cycles.map(([age, year, number, theme, score, advice]) => ({
    age,
    yearRange: `${year}-${year + (age === "55+" ? 9 : 7)}`,
    number,
    theme,
    score,
    advice
  }));
}

function getNumerologyAnnualRows(input?: NumerologyReportInput) {
  const birthDate = input?.birthDate || "1980-06-14";
  const [, month = "6", day = "14"] = birthDate.split("-");
  const startYear = new Date().getFullYear();
  const themes = ["开创", "合作", "表达", "打底", "变化", "责任", "研究", "资源", "整合"];

  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    const number = reduceNumerologyNumber(
      String(year).split("").reduce((sum, digit) => sum + Number(digit), 0) + Number(month) + Number(day)
    );

    return {
      year,
      number,
      theme: themes[number - 1],
      career: number === 1 || number === 8 ? "利主动争取" : number === 4 ? "宜稳扎稳打" : "先沟通再推进",
      wealth: number === 8 ? "财务机会强" : number === 5 ? "避免冲动消费" : "正财与预算优先",
      relationship: number === 2 || number === 6 ? "利修复关系" : "保持清楚边界",
      reminder: number === 9 ? "适合收尾与断舍离" : "把主题拆成季度行动"
    };
  });
}

function getNumerologyScoreRows(input?: NumerologyReportInput) {
  const core = getNumerologyCore(input);
  const base = 68 + core.lifePath;
  return [
    ["整体", Math.min(96, base + 8)],
    ["事业", Math.min(94, base + (core.destiny >= 7 ? 10 : 5))],
    ["财富", Math.min(92, base + (core.destiny === 8 ? 12 : 3))],
    ["关系", Math.min(90, base + (core.soulUrge === 2 || core.soulUrge === 6 ? 10 : 2))],
    ["健康", Math.min(88, base + (core.personality === 4 ? 6 : 1))],
    ["个人成长", Math.min(95, base + (core.maturity >= 7 ? 9 : 4))]
  ] as const;
}

function HexagramLines({ lines }: { lines: number[] }) {
  return (
    <div className="grid justify-center gap-3 py-4">
      {lines.map((solid, index) => (
        <div key={`${solid}-${index}`} className="flex justify-center gap-3">
          {solid ? (
            <span className="h-2 w-36 rounded bg-[#102F38]" />
          ) : (
            <>
              <span className="h-2 w-16 rounded bg-[#102F38]" />
              <span className="h-2 w-16 rounded bg-[#102F38]" />
            </>
          )}
        </div>
      ))}
    </div>
  );
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

function reportTemplateType(report: SavedReport) {
  if (report.metadata?.kind === "integrated_destiny" || report.metadata?.integratedInput) {
    return "综合命理";
  }

  if (report.title.includes("综合")) {
    return "综合命理";
  }

  if (report.title.includes("数字")) {
    return "数字命理";
  }

  if (report.title.includes("梅花")) {
    return "梅花易数";
  }

  if (report.title.includes("流年") || report.title.includes("事业")) {
    return "紫微斗数";
  }

  if (report.title.includes("开业") || report.title.includes("择日")) {
    return "梅花易数";
  }

  return "八字命理";
}

function downloadReportSvg(report: SavedReport, memberProfile: MemberProfile) {
  const template = reportTemplateType(report);
  const content = normalizedReportContent(report);
  const lines = [
    content.summary,
    ...content.sections.map((section) => `${section.title}：${section.content}`)
  ].join(" ").slice(0, 260);
  const safe = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1680" viewBox="0 0 1200 1680">
  <rect width="1200" height="1680" fill="#F5FAFA"/>
  <rect x="36" y="36" width="1128" height="1608" fill="#fffaf0" stroke="#C79A54" stroke-width="4"/>
  <rect x="72" y="72" width="1056" height="220" fill="#F5FAFA" stroke="#C79A54" stroke-width="2"/>
  <text x="600" y="150" text-anchor="middle" font-size="54" font-weight="700" fill="#063F4A">${safe(report.title)} 完整报告</text>
  <text x="600" y="210" text-anchor="middle" font-size="28" fill="#C79A54">${safe(template)} · AI Feng Shui Master</text>
  <text x="96" y="350" font-size="30" font-weight="700" fill="#102F38">分析对象：${safe(memberProfile.name)}</text>
  <text x="96" y="396" font-size="24" fill="#102F38">生日：${safe(memberProfile.birthDate)}　时辰：${safe(memberProfile.birthTimeLabel)}　性别：${safe(memberProfile.gender)}</text>
  <text x="96" y="442" font-size="24" fill="#102F38">生成时间：${safe(report.createdAt)}　消耗点数：${report.points}</text>
  <rect x="96" y="500" width="420" height="420" fill="#fff" stroke="#C79A54" stroke-width="2"/>
  <text x="306" y="570" text-anchor="middle" font-size="34" font-weight="700" fill="#063F4A">${safe(template)}盘</text>
  <circle cx="306" cy="715" r="116" fill="none" stroke="#C79A54" stroke-width="8"/>
  <circle cx="306" cy="715" r="62" fill="none" stroke="#063F4A" stroke-width="4"/>
  <text x="306" y="728" text-anchor="middle" font-size="54" font-weight="700" fill="#C79A54">82</text>
  <text x="306" y="800" text-anchor="middle" font-size="22" fill="#102F38">综合评分</text>
  <rect x="560" y="500" width="544" height="420" fill="#fff" stroke="#C79A54" stroke-width="2"/>
  <text x="592" y="565" font-size="32" font-weight="700" fill="#063F4A">核心摘要</text>
  <foreignObject x="592" y="600" width="480" height="250"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:24px;line-height:1.65;color:#102F38;font-family:Arial,'Microsoft YaHei',sans-serif;">${safe(lines)}</div></foreignObject>
  ${content.sections
    .map((section, index) => {
      const y = 980 + index * 180;
      return `<rect x="96" y="${y}" width="1008" height="140" rx="12" fill="#F5FAFA" stroke="#C79A54" stroke-width="1.5"/>
  <text x="124" y="${y + 46}" font-size="28" font-weight="700" fill="#063F4A">${safe(section.title)}</text>
  <foreignObject x="124" y="${y + 62}" width="940" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:22px;line-height:1.5;color:#102F38;font-family:Arial,'Microsoft YaHei',sans-serif;">${safe(section.content)}</div></foreignObject>`;
    })
    .join("")}
  <text x="600" y="1602" text-anchor="middle" font-size="20" fill="#6C8790">本报告为 AI 命理与风水辅助建议，仅供参考。</text>
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.title}-${report.createdAt.replace(/[/:\\s]/g, "-")}.svg`;
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

const elementControls: Record<Trigram["element"], Trigram["element"]> = {
  金: "木",
  木: "土",
  土: "水",
  水: "火",
  火: "金"
};

const trigramClues: Record<string, Omit<DivinationReading["clues"][number], "trigram">> = {
  乾: {
    title: "权威与规则",
    people: "父亲、老板、长辈、制度制定者、专业顾问、掌权者。",
    behavior: "定规则、签署文件、授权、审批、决断、建立标准。",
    space: "西北方、高处、办公室主位、会议室、金属物较多的位置。",
    bodyHint: "留意头部、压力、睡眠紧绷与过度承担。",
    prompt: "这件事是否卡在权责不清、上级未拍板，或你需要先把规则讲明？"
  },
  兑: {
    title: "沟通与缺口",
    people: "年轻女性、下属、销售、讲师、律师、靠表达吃饭的人。",
    behavior: "沟通、谈判、饭局、口舌、承诺、娱乐、带有缺口或破损的物品。",
    space: "正西方、水泽旁、湿地、餐桌、低洼处、谈话频繁的位置。",
    bodyHint: "留意口腔、牙齿、呼吸道与表面开心、内心空虚的情绪。",
    prompt: "这个转机或阻碍，是否和一位善言辞的人有关，或需要通过请客、沟通、说服来破局？"
  },
  离: {
    title: "曝光与判断",
    people: "中年女性、文化教育者、媒体人、设计师、看重形象与名声的人。",
    behavior: "曝光、发布、看清真相、文件审阅、传播、包装、名声与舆论。",
    space: "正南方、明亮处、屏幕前、灯光强的位置、展示区。",
    bodyHint: "留意眼睛、心火、血压、焦虑与急于证明自己的状态。",
    prompt: "这件事是否需要先公开表达，或先把隐藏信息照亮，而不是继续模糊推进？"
  },
  震: {
    title: "启动与震动",
    people: "长男、行动派、创业者、主动开口的人、容易急躁的人。",
    behavior: "启动、宣布、冲刺、搬动、争执、惊动、快速变化。",
    space: "正东方、门口、走廊、声音大的地方、正在施工或移动的位置。",
    bodyHint: "留意肝胆、筋骨、惊恐、冲动和突发压力。",
    prompt: "你是否太急着启动？现在要分清是机会发动，还是情绪被惊动。"
  },
  巽: {
    title: "资源与渗透",
    people: "长女、顾问、媒介、合作介绍人、温和但影响力持续的人。",
    behavior: "谈资源、引荐、渗透、传播、跟进、文件与合约细节。",
    space: "东南方、通风处、花草植物旁、文件柜、网络渠道。",
    bodyHint: "留意神经紧绷、肠胃风气、犹豫不决与反复沟通。",
    prompt: "这件事的入口是否不是硬攻，而是通过资源、介绍、长期跟进慢慢打开？"
  },
  坎: {
    title: "风险与流动",
    people: "中男、流动行业者、财务人员、物流、技术、隐藏信息较多的人。",
    behavior: "现金流、隐藏风险、流动、等待、陷入、反复确认。",
    space: "正北方、水边、暗处、仓库、后台系统、低温或湿冷处。",
    bodyHint: "留意肾水、泌尿、恐惧感、拖延和安全感不足。",
    prompt: "你是否忽略了现金流、暗账、隐藏条款或情绪上的不安全感？"
  },
  艮: {
    title: "停止与门槛",
    people: "少男、保安、宗教人士、内向谨慎的人、守门人。",
    behavior: "停止、阻隔、审批、守住边界、靠山、不动产、制度门槛。",
    space: "东北方、山、门槛、柜子、墙角、静止不动的位置。",
    bodyHint: "留意脾胃、肩颈、背部、固执和迟迟不动的状态。",
    prompt: "你目前是否遇到无法逾越的大山、制度门槛或一个关键守门人？"
  },
  坤: {
    title: "承载与积累",
    people: "母亲、年长女性、团队后勤、执行支持者、稳定型伙伴。",
    behavior: "承接、整理、等待、照顾、务实落地、长期积累。",
    space: "西南方、土地、仓储、厨房、后勤区、稳定厚重的位置。",
    bodyHint: "留意脾胃、疲累、水肿、过度迁就与承担过多。",
    prompt: "这件事是否需要先补后勤、补资源、补耐心，而不是急着冲结果？"
  }
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

function getElementRelation(bodyElement: Trigram["element"], useElement: Trigram["element"]) {
  if (bodyElement === useElement) {
    return {
      key: "比和",
      label: "体用比和（次吉）",
      score: 76,
      status: "次吉",
      meaning: "谋事可成，局势平稳，多得朋友或身边资源助力，但仍要明确下一步。"
    };
  }

  if (elementBridge[bodyElement] === useElement) {
    return {
      key: "体生用",
      label: "体生用（小凶/耗）",
      score: 55,
      status: "小凶/耗",
      meaning: "主泄气、破耗、多做少成、为人作嫁，精力容易被事件分散。"
    };
  }

  if (elementBridge[useElement] === bodyElement) {
    return {
      key: "用生体",
      label: "用生体（大吉）",
      score: 84,
      status: "大吉",
      meaning: "主有进益、顺遂、贵人相助，外部环境或事件本身对你有助力。"
    };
  }

  if (elementControls[bodyElement] === useElement) {
    return {
      key: "体克用",
      label: "体克用（小吉/平）",
      score: 62,
      status: "小吉/平",
      meaning: "事情在掌控中，但求谋劳碌、诸事多迟延，属于克得辛苦。"
    };
  }

  return {
    key: "用克体",
    label: "用克体（大凶）",
    score: 38,
    status: "大凶",
    meaning: "主压力极大、官非、阻碍、疾病或事情败坏，外部局势正在压制自己。"
  };
}

function getPassElementForRelation(bodyElement: Trigram["element"], useElement: Trigram["element"]) {
  const relation = getElementRelation(bodyElement, useElement).key;

  if (relation === "体克用") return elementBridge[bodyElement];
  if (relation === "用克体") return elementBridge[useElement];
  if (relation === "体生用") return bodyElement;
  if (relation === "用生体") return useElement;

  return elementBridge[bodyElement];
}

function getHexagramTheme(upper: Trigram, lower: Trigram) {
  const key = `${upper.name}${lower.name}`;
  const themes: Record<string, string> = {
    震艮: "小过之象：宜小不宜大，先处理细节与门槛，不可贪快。",
    兑巽: "大过之象：压力过重、结构承载不足，中段会有高压或方向剧烈调整。",
    震离: "丰卦之象：声势变大、信息曝光，但易名高利微，需防虚火和内耗。",
    乾坤: "泰否之间：天地定位，重点在权责、制度和上下是否通气。",
    坎离: "水火相冲：情绪与判断拉扯，必须先降噪再决策。",
    离坎: "既济未济：看似有结果，但细节仍需补齐。"
  };

  return themes[key] || `${upper.name}${lower.name}之象：上卦代表外显趋势，下卦代表根基与执行场景，需结合体用生克判断吉凶。`;
}

function createDivinationClues(trigramsInChart: Trigram[]) {
  const uniqueNames = Array.from(new Set(trigramsInChart.map((trigram) => trigram.name)));

  return uniqueNames
    .map((name) => {
      const clue = trigramClues[name];
      return clue ? { trigram: name, ...clue } : null;
    })
    .filter(Boolean)
    .slice(0, 4) as DivinationReading["clues"];
}

function createDivinationDate(dateValue: string, timeValue: string) {
  const now = new Date();
  const date = dateValue || now.toISOString().slice(0, 10);
  const time = timeValue || `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const selected = new Date(`${date}T${time}`);

  return Number.isNaN(selected.getTime()) ? now : selected;
}

function createDivinationReading(rawNumbers: [string, string, string], selectedDate = new Date()): DivinationReading {
  const numbers: [number, number, number] = [
    normalizeDivinationNumber(rawNumbers[0], 3),
    normalizeDivinationNumber(rawNumbers[1], 8),
    normalizeDivinationNumber(rawNumbers[2], 9)
  ];
  const hourBranch = getCurrentHourBranch(selectedDate);
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
  const originalRelation = getElementRelation(bodyTrigram.element, useTrigram.element);
  const changingUseTrigram = movingLine <= 3 ? changingLower : changingUpper;
  const changingRelation = getElementRelation(bodyTrigram.element, changingUseTrigram.element);
  const mutualRelation = getElementRelation(mutualUpper.element, mutualLower.element);
  const passElement = getPassElementForRelation(bodyTrigram.element, useTrigram.element);
  const ritual = elementRituals[passElement];
  const score = Math.max(36, Math.min(92, Math.round((originalRelation.score + mutualRelation.score + changingRelation.score) / 3)));
  const energyBoard = [
    {
      stage: "当下（本卦）",
      status: originalRelation.status,
      value: originalRelation.score,
      note: `${originalRelation.label}：${originalRelation.meaning}`
    },
    {
      stage: "过程（互卦）",
      status: mutualRelation.status,
      value: Math.max(30, mutualRelation.score - 6),
      note: `${getHexagramTheme(mutualUpper, mutualLower)} ${mutualRelation.label}，中段需防暗线压力。`
    },
    {
      stage: "结果（变卦）",
      status: changingRelation.status,
      value: changingRelation.score,
      note: `${getHexagramTheme(changingUpper, changingLower)} ${changingRelation.label}，看最后是否值得继续投入。`
    }
  ];
  const clues = createDivinationClues([upper, lower, mutualUpper, mutualLower, changingUpper, changingLower]);

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
    }).format(selectedDate),
    originalHexagram: composeHexagramName(upper, lower),
    mutualHexagram: composeHexagramName(mutualUpper, mutualLower),
    changingHexagram: composeHexagramName(changingUpper, changingLower),
    bodyTrigram,
    useTrigram,
    movingLine,
    passElement,
    bodyUseRelation: originalRelation.label,
    finalRelation: changingRelation.label,
    score,
    energyBoard,
    clues,
    situation: `本卦为${composeHexagramName(upper, lower)}，核心是「${bodyTrigram.name}体遇${useTrigram.name}用」，五行关系为${originalRelation.label}。白话说：${originalRelation.meaning} ${getHexagramTheme(upper, lower)}`,
    process: `互卦为${composeHexagramName(mutualUpper, mutualLower)}，它代表事情中段的隐秘夹层与不可控因素。${getHexagramTheme(mutualUpper, mutualLower)} 五行上呈${mutualRelation.label}，说明过程不是直线推进，需防资源承载、沟通压力或方向调整。`,
    outcome: `变卦为${composeHexagramName(changingUpper, changingLower)}，代表最终演变。用卦由${useTrigram.name}转向${changingUseTrigram.name}，与体卦形成${changingRelation.label}：${changingRelation.meaning} 不宜只看表面热闹，要评估实际回报。`,
    mindset: `整体定局：${energyBoard[0].status}起局，${energyBoard[1].status}过关，${energyBoard[2].status}收尾。今日战略心法是：先承认现实压力，再用「${passElement}」通关，把克制、泄气或压迫转成可执行的步骤。`,
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

type HexagramOneWordMeta = {
  title: string;
  word: string;
  theme: string;
  situation: string;
  keyPoint: string;
  action: string;
  clue: string;
};

const hexagram64Dictionary: Record<string, HexagramOneWordMeta> = {
  "qian-qian": { title: "乾为天", word: "破茧", theme: "主导权、上升、出手时机", situation: "你已经站在临界点，心里知道自己不能再躲在幕后。", keyPoint: "真正的卡点不是能力不足，而是你还在等别人允许你开始。", action: "今天主动开口争取一次资源，把主导权拿回来。", clue: "留意高处、金色或负责人" },
  "qian-dui": { title: "天泽履", word: "试探", theme: "谨慎前行、礼数、边界", situation: "你正踩在一条细线之上，机会在前，但一步错就容易失分。", keyPoint: "最大隐患是太急于证明自己，忽略了规矩和对方感受。", action: "今天先确认规则，再推进请求；说话留三分余地。", clue: "留意饭局中的一句提醒" },
  "qian-li": { title: "天火同人", word: "结盟", theme: "公开合作、共同目标、圈层", situation: "你需要的不是单打独斗，而是找到同频的人站到同一边。", keyPoint: "卡点在于目标还不够公开，别人看不懂你要往哪里去。", action: "今天把你的计划讲清楚，主动约一个关键伙伴。", clue: "留意屏幕、会议或南方消息" },
  "qian-zhen": { title: "天雷无妄", word: "止妄", theme: "真实动机、突发变化、不乱求", situation: "事情正在提醒你回到真实，不要被一时冲动带偏。", keyPoint: "隐患在于你把焦虑误认为机会，越急越容易走错。", action: "今天暂停一个临时决定，只做已经验证过的事。", clue: "留意突然响起的电话" },
  "qian-xun": { title: "天风姤", word: "相遇", theme: "意外人事、诱惑、入口", situation: "一个突然出现的人或机会正在搅动你的判断。", keyPoint: "转机是真的，但其中也夹着诱惑和不对等条件。", action: "今天先听对方说完，不马上承诺，留下查证时间。", clue: "留意介绍人或东南方讯息" },
  "qian-kan": { title: "天水讼", word: "争界", theme: "争议、合约、立场", situation: "你心里已有不服，只是还没把边界说清楚。", keyPoint: "最大的风险是口头承诺太多，后面变成责任争执。", action: "今天把条件写下来，所有重要沟通留下记录。", clue: "留意黑色文件或聊天记录" },
  "qian-gen": { title: "天山遯", word: "撤身", theme: "退场、止损、远离消耗", situation: "你正在面对一个看似还能撑、其实正在消耗你的局。", keyPoint: "真正的智慧不是硬赢，而是及时从不值得的战场抽身。", action: "今天减少解释，先撤出一个低回报承诺。", clue: "留意门口、墙角或山形物" },
  "qian-kun": { title: "天地否", word: "闭塞", theme: "上下不通、停滞、错频", situation: "你感觉明明做了很多，但回应迟迟不到位。", keyPoint: "卡点在于上下不同频，继续硬推只会增加误会。", action: "今天先换沟通对象或渠道，不要在原地重复解释。", clue: "留意沉默的年长女性" },
  "dui-qian": { title: "泽天夬", word: "决断", theme: "切割、公告、临门一刀", situation: "你已经忍到极限，内心其实知道必须做一个明确切割。", keyPoint: "隐患是拖延会让问题继续发酵，最后由别人替你决定。", action: "今天删掉一个模糊选项，只保留最重要的路径。", clue: "留意白色金属物或通知" },
  "dui-dui": { title: "兑为泽", word: "开口", theme: "沟通、喜悦、口舌", situation: "事情的转机藏在一句话里，但风险也藏在一句话里。", keyPoint: "最大卡点是你想讨好所有人，反而让真正立场变模糊。", action: "今天只说事实和需求，避免玩笑式试探。", clue: "留意年轻女性或饭局" },
  "dui-li": { title: "泽火革", word: "换皮", theme: "改革、更新、换身份", situation: "旧的角色已经装不下你，新局正在逼你换一种活法。", keyPoint: "卡点不是变化本身，而是你还想用旧方法解决新问题。", action: "今天改掉一个旧流程，公开一个新标准。", clue: "留意红色招牌或证件" },
  "dui-zhen": { title: "泽雷随", word: "跟势", theme: "顺势、跟随、关系节奏", situation: "你现在不适合硬带方向，反而要先观察势头往哪里走。", keyPoint: "转机在于顺势借力，隐患在于盲目跟风。", action: "今天跟进一个已经有动能的人或项目，但保留判断。", clue: "留意群组里最先行动的人" },
  "dui-xun": { title: "泽风大过", word: "重负", theme: "压力超载、硬撑、减负", situation: "你撑得太久，表面还能笑，内部结构却已经吃力。", keyPoint: "最大隐患是继续把别人的责任背在自己身上。", action: "今天拒绝一个额外请求，把最重的任务拆小。", clue: "留意梁柱、肩颈或长桌" },
  "dui-kan": { title: "泽水困", word: "卡局", theme: "资源受限、困住、低谷", situation: "你不是没有能力，而是眼前资源被锁住，越挣扎越耗。", keyPoint: "卡点在现金流、情绪低谷或对方不回应。", action: "今天先求小通，不求大成；解决一个最现实的缺口。", clue: "留意水边、账目或黑色物品" },
  "dui-gen": { title: "泽山咸", word: "电光", theme: "感应、吸引、第一反应", situation: "你对某个人或某件事已有强烈直觉，身体比理性更早知道答案。", keyPoint: "转机在感应，隐患在把短暂心动误当长期承诺。", action: "今天相信第一反应，但先用小行动验证。", clue: "留意微笑、香气或西方消息" },
  "dui-kun": { title: "泽地萃", word: "聚场", theme: "聚集、人脉、资源汇合", situation: "你身边资源正在聚拢，但还缺一个清楚的中心。", keyPoint: "卡点是人多意见多，热闹不等于成交。", action: "今天定一个共同目标，让大家围绕结果而不是情绪发言。", clue: "留意聚会或团队群讯息" },
  "li-qian": { title: "火天大有", word: "显丰", theme: "拥有、曝光、收获", situation: "你的资源并不少，只是需要被看见、被整理、被使用。", keyPoint: "隐患是太在意表面成绩，忽略后续承接能力。", action: "今天盘点可用资源，选一个最有把握的公开展示。", clue: "留意灯光下的贵人" },
  "li-dui": { title: "火泽睽", word: "错频", theme: "分歧、各看各的、误解", situation: "你和对方都觉得自己有理，但看的其实不是同一件事。", keyPoint: "最大卡点不是谁对谁错，而是频道不同。", action: "今天先复述对方立场，再表达你的底线。", clue: "留意争论、屏幕或女性意见" },
  "li-li": { title: "离为火", word: "聚焦", theme: "看清、曝光、断舍离", situation: "你的心思太散，太多声音正在分走你的注意力。", keyPoint: "转机在聚焦，隐患在热度过高导致判断失真。", action: "今天只做一件能被看见的关键事，其余先放下。", clue: "留意红色、灯光或眼睛疲劳" },
  "li-zhen": { title: "火雷噬嗑", word: "破障", theme: "咬断阻碍、执行、纪律", situation: "你面前有一个硬结，不处理就一直卡住。", keyPoint: "卡点在规则、责任或某个必须面对的难题。", action: "今天直接处理最难开口的部分，不再绕路。", clue: "留意合同、牙齿或突发声响" },
  "li-xun": { title: "火风鼎", word: "炼成", theme: "升级、重组、成器", situation: "你正在被重新调配，旧材料要经过火候才能成新局。", keyPoint: "转机在重组资源，隐患是急着出成果而火候不足。", action: "今天优化流程或包装，不急着对外承诺。", clue: "留意厨房、香气或三脚器物" },
  "li-kan": { title: "火水未济", word: "未竟", theme: "未完成、冷热冲突、临门差一步", situation: "事情看似快完成，但关键环节还没有真正闭合。", keyPoint: "最大风险是以为已经稳了，提前放松或庆祝。", action: "今天补上最后一个检查清单，别急着宣布结果。", clue: "留意冷热交替或未读消息" },
  "li-gen": { title: "火山旅", word: "漂泊", theme: "外地、临时、无根感", situation: "你像站在别人的场域里，能发挥但不宜久留。", keyPoint: "卡点是缺少根基，短期机会不能当长期归宿。", action: "今天明确临时目标，不把临时关系过度投入。", clue: "留意旅途、酒店或陌生场地" },
  "li-kun": { title: "火地晋", word: "晋升", theme: "被看见、上升、推进", situation: "你正在被推到更亮的位置，之前的积累开始有回声。", keyPoint: "转机在曝光，隐患是基础没跟上名声。", action: "今天主动提交成果，让正确的人看见。", clue: "留意日出、证书或上级目光" },
  "zhen-qian": { title: "雷天大壮", word: "壮行", theme: "力量上升、冲劲、慎勇", situation: "你现在气势很强，内心想立刻冲出去证明自己。", keyPoint: "隐患是力量大于耐心，容易因过猛而折损。", action: "今天可以推进，但必须先设边界和刹车。", clue: "留意运动、车辆或高声争执" },
  "zhen-dui": { title: "雷泽归妹", word: "错位", theme: "关系错位、名分不稳、急嫁急合", situation: "这件事有吸引力，却可能不是最稳的组合。", keyPoint: "卡点在位置不正或承诺太快，后续容易失衡。", action: "今天不要急着定名分，先看责任是否对等。", clue: "留意临时邀约或年轻女性" },
  "zhen-li": { title: "雷火丰", word: "虚盛", theme: "表面繁荣、虚火、防盛极必衰", situation: "眼前看起来热闹、机会多，但内部消耗也正在上升。", keyPoint: "最大隐患是名声有了，实际回报未必跟上。", action: "今天只选能产生实际现金流或成果的事。", clue: "留意闪光、广告或热闹场面" },
  "zhen-zhen": { title: "震为雷", word: "惊动", theme: "突发、启动、震荡", situation: "某个变化正在敲醒你，拖延已经不再舒服。", keyPoint: "转机在启动，隐患在被情绪推着乱跑。", action: "今天先做第一个动作，但不要连开三条战线。", clue: "留意雷声、消息提示或东方" },
  "zhen-xun": { title: "雷风恒", word: "恒守", theme: "长期关系、持续、守节奏", situation: "你正在问一件需要长期经营的事，不能只看今天的情绪。", keyPoint: "卡点在忽冷忽热，缺少稳定节奏。", action: "今天设定一个可持续的小习惯，坚持七天。", clue: "留意重复出现的名字" },
  "zhen-kan": { title: "雷水解", word: "松绑", theme: "解除、破冰、脱困", situation: "你正处于长期内耗与捆绑中，进退两难。", keyPoint: "转机已至，真正卡点是你过度留恋过去的沉没成本。", action: "今天斩断一个不再滋养你的关系或任务，动作越快越好。", clue: "留意黑衣人或东方消息" },
  "zhen-gen": { title: "雷山小过", word: "低飞", theme: "小有过度、宜下不宜上、注意细节", situation: "你想冲高，但现实提醒你先把脚边的小事处理好。", keyPoint: "隐患在小处失分，尤其是细节、礼数和时间点。", action: "今天不做大承诺，只修正一个最明显的小错误。", clue: "留意门槛、车声或东北方" },
  "zhen-kun": { title: "雷地豫", word: "预热", theme: "准备、动员、情绪带动", situation: "机会还没完全打开，但氛围已经可以先被你带起来。", keyPoint: "转机在提前布局，隐患是沉迷兴奋而不落地。", action: "今天先做预告、邀约或排练，把团队情绪调动起来。", clue: "留意音乐、活动或群众反应" },
  "xun-qian": { title: "风天小畜", word: "蓄势", theme: "小积累、未可大成、等待风口", situation: "你已经有想法，但力量还没积到可以一次突破。", keyPoint: "卡点在资源未满，急推会被现实拉回。", action: "今天先补一个资料、一个联系人或一个预算缺口。", clue: "留意风、文件或云层" },
  "xun-dui": { title: "风泽中孚", word: "取信", theme: "信任、诚意、口碑", situation: "事情能不能成，关键不在技巧，而在对方信不信你。", keyPoint: "转机在真诚表达，隐患是包装过度。", action: "今天拿出一个真实证据，比说十句好听话更有用。", clue: "留意鸟声、合约或推荐人" },
  "xun-li": { title: "风火家人", word: "内修", theme: "家宅、内部秩序、角色", situation: "外面的局要顺，先要把内部关系和分工理清。", keyPoint: "卡点在自己人之间的期待没有说开。", action: "今天处理一个家里或团队内部的小矛盾。", clue: "留意厨房、女性长辈或群聊" },
  "xun-zhen": { title: "风雷益", word: "增益", theme: "增长、帮助、互利", situation: "你正进入一个越付出越有回流的窗口。", keyPoint: "转机在先给价值，隐患是只想拿不想投入。", action: "今天主动帮一个关键人解决小问题。", clue: "留意东南方的合作邀请" },
  "xun-xun": { title: "巽为风", word: "渗透", theme: "柔进、传播、影响", situation: "这件事不能硬攻，需要像风一样慢慢进入对方系统。", keyPoint: "卡点是你想一次说服，但对方需要持续感受。", action: "今天做一次温和跟进，不逼单、不施压。", clue: "留意风口、植物或顾问" },
  "xun-kan": { title: "风水涣", word: "散结", theme: "分散、释怀、重组", situation: "原本纠结的能量正在散开，但也容易人心不齐。", keyPoint: "转机在释放旧情绪，隐患在团队散掉。", action: "今天把问题摊开讲清楚，再重新分配责任。", clue: "留意水雾、旅行或远方消息" },
  "xun-gen": { title: "风山渐", word: "渐进", theme: "循序、成长、慢成", situation: "这件事有前景，但它不会因为你急就立刻成熟。", keyPoint: "卡点在节奏，过快会破坏本来能成的关系。", action: "今天只推进一个阶段目标，留足观察空间。", clue: "留意阶梯、山路或学习资料" },
  "xun-kun": { title: "风地观", word: "观局", theme: "观察、品牌、被观察", situation: "你以为自己在看别人，其实别人也正在看你。", keyPoint: "转机在形象与站位，隐患是动作太多显得不稳。", action: "今天少说多看，整理你的对外呈现。", clue: "留意公众场合或西南方" },
  "kan-qian": { title: "水天需", word: "待机", theme: "等待、补给、时机未到", situation: "你已经准备往前，但眼前仍需要等一个合适窗口。", keyPoint: "卡点不是不能做，而是补给和时机还没到齐。", action: "今天先补资源，不急着冲结果。", clue: "留意饮品、雨水或贵人约饭" },
  "kan-dui": { title: "水泽节", word: "节制", theme: "限度、预算、规则", situation: "你的能量正在提醒你：不是所有欲望都值得满足。", keyPoint: "隐患在支出、承诺或情绪表达失去节制。", action: "今天设一个上限，钱、时间、话都要收住。", clue: "留意杯子、账单或西方" },
  "kan-li": { title: "水火既济", word: "成局", theme: "完成、平衡、收尾风险", situation: "事情看似已经成形，最容易在收尾时松懈。", keyPoint: "最大隐患是完成感太早，细节却还没锁死。", action: "今天做复盘和确认，不再新增变量。", clue: "留意冷热交替或完成通知" },
  "kan-zhen": { title: "水雷屯", word: "初难", theme: "开局艰难、混乱、萌芽", situation: "你正在新局开端，混乱不是失败，而是生长前的阻力。", keyPoint: "卡点在基础秩序未成，急着扩大会更乱。", action: "今天先建立最小可行步骤，不求完美。", clue: "留意新项目、婴儿或车辆" },
  "kan-xun": { title: "水风井", word: "源头", theme: "资源井、长期供给、系统", situation: "答案不在表面热闹，而在你长期取水的源头。", keyPoint: "转机在修复系统，隐患是只换包装不清井。", action: "今天整理客户池、知识库或现金流来源。", clue: "留意井、水槽或老客户" },
  "kan-kan": { title: "坎为水", word: "暗流", theme: "陷阱、隐藏风险、反复试炼", situation: "你脚下有看不见的暗流，直觉已经提醒你不要冒进。", keyPoint: "最大隐患是盲目信任、冲动投资或低估风险。", action: "今天先踩刹车，查证一项关键资料。", clue: "留意黑色、夜晚或水声" },
  "kan-gen": { title: "水山蹇", word: "险阻", theme: "路难、受阻、求助", situation: "你不是不努力，而是这条路本身暂时不好走。", keyPoint: "卡点在外部阻力，硬闯只会消耗更多。", action: "今天换路线，向有经验的人求一个具体建议。", clue: "留意坡道、腿脚或东北方" },
  "kan-kun": { title: "水地比", word: "靠拢", theme: "结伴、归属、联盟", situation: "你现在需要找到可信赖的队伍，而不是独自承受。", keyPoint: "转机在靠近正确的人，隐患是为了归属感选错圈子。", action: "今天筛选伙伴，只靠近价值观稳定的人。", clue: "留意团队合照或年长女性" },
  "gen-qian": { title: "山天大畜", word: "厚蓄", theme: "储备、克制、大资源", situation: "你的力量正在积累，但还没到完全释放的时候。", keyPoint: "转机在蓄养实力，隐患是太早亮牌。", action: "今天把资源藏好、计划写深，不急着公开。", clue: "留意仓库、证照或高墙" },
  "gen-dui": { title: "山泽损", word: "减法", theme: "舍弃、减负、换取更大", situation: "你拥有的太多反而拖慢了你，删减才会带来清明。", keyPoint: "卡点在舍不得，尤其是不再产生价值的关系或支出。", action: "今天砍掉一个低效成本，换回专注。", clue: "留意破损物或账单" },
  "gen-li": { title: "山火贲", word: "修饰", theme: "包装、形象、外美内实", situation: "你需要被看见，但不能只靠外表撑场。", keyPoint: "隐患是包装大于内容，容易让人期待落空。", action: "今天优化呈现，同时补一项真实能力证明。", clue: "留意照片、衣着或灯光" },
  "gen-zhen": { title: "山雷颐", word: "养口", theme: "饮食、语言、滋养", situation: "你最近吸收了太多杂讯，身心都需要重新喂养。", keyPoint: "卡点在口：说错话、吃错东西、听错信息。", action: "今天少争辩，吃一顿干净的饭，输入高质量内容。", clue: "留意餐桌、牙齿或一句话" },
  "gen-xun": { title: "山风蛊", word: "清腐", theme: "旧问题、腐败、整理根源", situation: "眼前的问题不是今天才有，而是旧结构积久成疾。", keyPoint: "转机在清理根源，隐患是继续粉饰太平。", action: "今天处理一个拖了很久的历史问题。", clue: "留意旧文件、霉味或长辈" },
  "gen-kan": { title: "山水蒙", word: "启蒙", theme: "不明、学习、请教", situation: "你现在并非没有路，而是信息还不足以做成熟判断。", keyPoint: "卡点在认知盲区，装懂会让你付学费。", action: "今天向专业人士问一个具体问题。", clue: "留意老师、儿童或书本" },
  "gen-gen": { title: "艮为山", word: "止步", theme: "停止、边界、静观", situation: "所有信号都在提醒你先停下来，不是每个门都要推开。", keyPoint: "转机在停止，隐患是固执地把停滞误判成失败。", action: "今天不新增承诺，先守住边界。", clue: "留意门槛、山形或安静的人" },
  "gen-kun": { title: "山地剥", word: "剥落", theme: "削弱、旧壳脱落、保核心", situation: "外层资源正在剥落，留下来的才是真正核心。", keyPoint: "隐患是想保住所有东西，反而连根基都被拖累。", action: "今天保护最重要的人、钱和信用，其余让它掉。", clue: "留意脱落、墙皮或西南方" },
  "kun-qian": { title: "地天泰", word: "通达", theme: "上下相通、顺流、开局", situation: "阻塞正在打开，你会发现上下之间开始有了回应。", keyPoint: "转机在顺势连接，隐患是太舒服后忘了巩固。", action: "今天推进一个早已准备好的合作。", clue: "留意桥、通道或好消息" },
  "kun-dui": { title: "地泽临", word: "靠近", theme: "临近、指导、机会靠近", situation: "机会正在走近你，但它会先观察你的态度和稳定度。", keyPoint: "转机在主动靠近，隐患是姿态过高或准备不足。", action: "今天拜访一个关键人，带着方案而不是空手。", clue: "留意上级、老师或西方" },
  "kun-li": { title: "地火明夷", word: "藏光", theme: "受伤、低调、隐藏锋芒", situation: "你的光暂时不适合太亮，越显眼越容易受伤。", keyPoint: "隐患在被误解、被压制或过早暴露底牌。", action: "今天低调完成关键事，不争一时名声。", clue: "留意黄昏、伤痕或暗灯" },
  "kun-zhen": { title: "地雷复", word: "回春", theme: "复苏、回归、重新开始", situation: "沉寂之后，新的动能正在从底层慢慢回来。", keyPoint: "转机在回到初心，隐患是急着一次恢复全部。", action: "今天重启一个小习惯，让身体先动起来。", clue: "留意旧人回讯或东方" },
  "kun-xun": { title: "地风升", word: "升阶", theme: "上升、累积、被提拔", situation: "你正处在可以往上走的阶段，但必须一步一步搭梯子。", keyPoint: "卡点在基础，不稳的上升会很快回落。", action: "今天完成一个能证明专业度的交付。", clue: "留意楼梯、植物或推荐" },
  "kun-kan": { title: "地水师", word: "整队", theme: "团队、纪律、带兵", situation: "事情已经不是个人情绪，而是需要组织和纪律。", keyPoint: "转机在整队，隐患是人多但没有统一号令。", action: "今天明确负责人、目标和期限。", clue: "留意制服、群组或北方" },
  "kun-gen": { title: "地山谦", word: "低身", theme: "谦逊、低姿态、稳胜", situation: "你越低调，越容易获得真正的支持。", keyPoint: "卡点在面子；放下面子，事情反而更容易成。", action: "今天主动请教或道谢，把姿态放柔。", clue: "留意安静的贵人或东北方" },
  "kun-kun": { title: "坤为地", word: "承载", theme: "守成、包容、厚积", situation: "现在不宜强攻，真正的力量来自稳定承接。", keyPoint: "转机在耐心与配合，隐患是委屈自己承担过量。", action: "今天整理资源和后勤，先把基础铺稳。", clue: "留意土地、母亲或米色物品" }
};

function getHexagram64Meta(upper: Trigram, lower: Trigram) {
  return (
    hexagram64Dictionary[`${upper.key}-${lower.key}`] || {
      title: `${upper.name}${lower.name}合象`,
      word: "观局",
      theme: "观察局势、收束行动、等待清晰信号",
      situation: "你正站在一段信息未明的路口，直觉已经提醒你不要急着下结论。",
      keyPoint: "真正的卡点在于你还没有看清谁是助力、谁是消耗。",
      action: "今天先收集事实，暂停冲动承诺，再做一个可逆的小决定。",
      clue: "留意重复出现的名字"
    }
  );
}

function buildHexagramOracle(meta: HexagramOneWordMeta, mode: Hexagram64Mode, question: string) {
  const questionPrefix = mode === "daily" || !question.trim() ? "" : `你问的是「${question.trim()}」。`;
  const depth =
    mode === "deep"
      ? "不要急着求一个漂亮答案，先确认自己是否愿意为真正的转变付出代价。"
      : "";

  return `${questionPrefix}${meta.situation}${meta.keyPoint}${meta.action}${depth}【今日线索】：${meta.clue}`;
}

function createHexagram64Reading(selectedDate = new Date(), mode: Hexagram64Mode = "daily", question = ""): Hexagram64Reading {
  const modeOption = hexagram64ModeOptions.find((item) => item.id === mode) || hexagram64ModeOptions[0];
  const hourBranch = getCurrentHourBranch(selectedDate);
  const questionSeed = question
    .trim()
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const dateSeed =
    selectedDate.getFullYear() * 10000 +
    (selectedDate.getMonth() + 1) * 100 +
    selectedDate.getDate() +
    selectedDate.getHours() * 7 +
    selectedDate.getMinutes() +
    questionSeed;
  const randomSeed = Math.floor(Math.random() * 64) + 1;
  const upper = trigrams[(dateSeed + randomSeed) % 8];
  const lower = trigrams[(Math.floor(dateSeed / 3) + randomSeed * 2) % 8];
  const dominantElement = upper.element === lower.element ? upper.element : lower.element;
  const meta = getHexagram64Meta(upper, lower);
  const hexagram = composeHexagramName(upper, lower);
  const score = 64 + ((dateSeed + randomSeed * 5) % 28);
  const oracle = buildHexagramOracle(meta, mode, question);

  return {
    id: `hexagram64-${Date.now()}`,
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(selectedDate),
    dateKey: selectedDate.toISOString().slice(0, 10),
    timeKey: `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`,
    mode,
    modeLabel: modeOption.title,
    question: question.trim(),
    cost: modeOption.cost,
    hexagram,
    hexagramTitle: meta.title,
    upper,
    lower,
    word: meta.word,
    theme: meta.theme,
    explanation: `此刻抽得「${meta.title}」，系统以当下日期、时辰与随机卦象合参，取「${meta.word}」作为此刻命理关键字。这个字不是卦名，而是这卦在现代生活里的核心显化现象。`,
    action: meta.action,
    oracle,
    clue: meta.clue,
    element: dominantElement,
    score
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

function polarPoint(cx: number, cy: number, radius: number, degree: number) {
  const radian = (degree * Math.PI) / 180;

  return {
    x: Number((cx + Math.cos(radian) * radius).toFixed(2)),
    y: Number((cy + Math.sin(radian) * radius).toFixed(2))
  };
}

function svgPolygonPath(points: { x: number; y: number }[], close = true) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + (close ? " Z" : "");
}

function buildSigilPath(distilled: string, hash: string) {
  const chars = Array.from(distilled);
  const seed = parseInt(hash.slice(0, 8), 16) || 1;
  const centerX = 120;
  const centerY = 120;
  const sourceChars = chars.length >= 3 ? chars : Array.from(`${distilled}SACREDGEOMETRY`).slice(0, 10);
  const radii = [34, 56, 78];
  const sectors = [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
  const leftDegrees = [150, 180, 210, 240];
  const start = polarPoint(centerX, centerY, 78, -90);
  const finish = polarPoint(centerX, centerY, 78, 90);
  const leftDots = sourceChars.slice(0, 3).map((char, index) => {
    const code = char.charCodeAt(0);
    return polarPoint(centerX, centerY, radii[(code + index + seed) % radii.length], leftDegrees[(code + seed + index) % leftDegrees.length]);
  });
  const rightDots = leftDots
    .map((dot) => ({
      x: Number((centerX + (centerX - dot.x)).toFixed(2)),
      y: dot.y
    }))
    .reverse();
  const centerGate = sourceChars[3]
    ? polarPoint(centerX, centerY, radii[(sourceChars[3].charCodeAt(0) + seed) % radii.length], sectors[(sourceChars[3].charCodeAt(0) + seed) % sectors.length])
    : { x: centerX, y: centerY };
  const lowerGate = sourceChars[4]
    ? polarPoint(centerX, centerY, 56, sectors[(sourceChars[4].charCodeAt(0) + seed + 5) % sectors.length])
    : { x: centerX, y: centerY + 56 };
  const dots = [start, ...leftDots, centerGate, ...rightDots, lowerGate, finish].reduce<{ x: number; y: number }[]>((items, dot) => {
    const exists = items.some((item) => Math.abs(item.x - dot.x) < 4 && Math.abs(item.y - dot.y) < 4);
    return exists ? items : [...items, dot];
  }, []);
  const linePath = dots.map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`).join(" ");
  const end = dots[dots.length - 1];
  const endMark = `M ${end.x - 13} ${end.y} L ${end.x + 13} ${end.y}`;
  const outerStar = svgPolygonPath(Array.from({ length: 12 }, (_, index) => polarPoint(centerX, centerY, index % 2 === 0 ? 101 : 88, -90 + index * 30)));
  const hexagon = svgPolygonPath(Array.from({ length: 6 }, (_, index) => polarPoint(centerX, centerY, 78, -90 + index * 60)));
  const triangleUp = svgPolygonPath([polarPoint(centerX, centerY, 64, -90), polarPoint(centerX, centerY, 64, 30), polarPoint(centerX, centerY, 64, 150)]);
  const triangleDown = svgPolygonPath([polarPoint(centerX, centerY, 64, 90), polarPoint(centerX, centerY, 64, 210), polarPoint(centerX, centerY, 64, 330)]);
  const vesicaCircles = Array.from({ length: 6 }, (_, index) => {
    const point = polarPoint(centerX, centerY, 34, -90 + index * 60);
    return svgCirclePath(point.x, point.y, 34);
  }).join(" ");
  const radialLines = Array.from({ length: 12 }, (_, index) => {
    const inner = polarPoint(centerX, centerY, 22, -90 + index * 30);
    const outer = polarPoint(centerX, centerY, 96, -90 + index * 30);
    return `M ${inner.x} ${inner.y} L ${outer.x} ${outer.y}`;
  }).join(" ");
  const gridPath = [
    svgCirclePath(centerX, centerY, 34),
    svgCirclePath(centerX, centerY, 56),
    svgCirclePath(centerX, centerY, 78),
    svgCirclePath(centerX, centerY, 96),
    vesicaCircles,
    outerStar,
    hexagon,
    radialLines
  ].join(" ");
  const topCircle = svgCirclePath(dots[0].x, dots[0].y, 8.5);
  const centerCircle = svgCirclePath(centerX, centerY, 18);
  const lowerCircle = svgCirclePath(centerX, centerY + 56, 13);
  const sideCircles = [polarPoint(centerX, centerY, 66, 180), polarPoint(centerX, centerY, 66, 0)]
    .map((point) => svgCirclePath(point.x, point.y, 15))
    .join(" ");
  const verticalAxis = `M ${centerX} 42 L ${centerX} 198`;
  const horizontalAxis = `M ${centerX - 78} ${centerY} L ${centerX + 78} ${centerY}`;
  const goldenArc =
    seed % 2 === 0
      ? `M 74 155 A 72 72 0 0 1 166 85 M 74 85 A 72 72 0 0 0 166 155`
      : `M 88 62 A 62 62 0 0 1 152 62 M 88 178 A 62 62 0 0 0 152 178`;

  return {
    path: `${linePath} ${endMark}`,
    gridPath,
    ornamentPath: `${triangleUp} ${triangleDown} ${topCircle} ${centerCircle} ${lowerCircle} ${sideCircles} ${verticalAxis} ${horizontalAxis} ${goldenArc}`,
    dots
  };
}

function createSigilArtifact(intent: string): SigilArtifact {
  const distilled = distillSigilIntent(intent);
  const hash = hashIntent(`${intent}-${Date.now()}`);
  const { path, gridPath, ornamentPath, dots } = buildSigilPath(distilled, hash);

  return {
    id: `sigil-${Date.now()}`,
    title: `符印 ${hash.slice(0, 4)}`,
    hash,
    path,
    gridPath,
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
  const nodeDots = artifact.dots.filter((_, index) => index === 0 || index === artifact.dots.length - 1 || index % 2 === 0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.05" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="goldAura" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E8D4A8" stop-opacity=".22"/><stop offset="70%" stop-color="#C79A54" stop-opacity=".06"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="240" height="240" fill="#ffffff"/><rect width="240" height="240" fill="url(#goldAura)"/><path d="${artifact.gridPath || ""}" fill="none" stroke="#C79A54" stroke-opacity=".16" stroke-width=".75" stroke-linecap="round" stroke-linejoin="round"/><circle cx="120" cy="120" r="96" fill="none" stroke="#C79A54" stroke-opacity=".74" stroke-width="2.4"/><circle cx="120" cy="120" r="78" fill="none" stroke="#C79A54" stroke-opacity=".32" stroke-width="1.2"/><path d="${artifact.ornamentPath || ""}" fill="none" stroke="#C79A54" stroke-opacity=".74" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="${artifact.path}" fill="none" stroke="#9B741C" stroke-opacity=".98" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#goldGlow)"/>${nodeDots
    .map((dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="5.3" fill="#C79A54" stroke="#ffffff" stroke-width="1.8"/>`)
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

function isProfileReady(profile: MemberProfile) {
  return Boolean(
    profile.name &&
      profile.name !== "未填写" &&
      profile.birthDate &&
      profile.birthDate !== "2000-01-01" &&
      profile.gender &&
      profile.gender !== "未填写"
  );
}

function MemberOnboardingGuide({
  memberProfile,
  onOpenModule,
  onSelectPrompt,
  onSelectReport,
  onDismiss
}: {
  memberProfile: MemberProfile;
  onOpenModule: (module: DashboardModule) => void;
  onSelectPrompt: (prompt: string, module: DashboardModule) => void;
  onSelectReport: (preset: ReportDemandPreset) => void;
  onDismiss: () => void;
}) {
  const profileReady = isProfileReady(memberProfile);
  const steps = [
    {
      title: "建立个人命理资料",
      desc: profileReady ? "资料已建立，AI 和报告会读取这份档案。" : "先填写姓名、生日、时辰、性别与地区，让分析更像专属建议。",
      action: "去填写",
      done: profileReady,
      onClick: () => onOpenModule("profile")
    },
    {
      title: "查看今日运势",
      desc: "先看今日评分、宜忌、吉时与吉方，再决定今天先做什么。",
      action: "看今日",
      done: false,
      onClick: () => onOpenModule("fortune")
    },
    {
      title: "问 AI 一个关键问题",
      desc: "用一句具体问题开始，例如事业、财运、感情或合作判断。",
      action: "开始问",
      done: false,
      onClick: () => onSelectPrompt("请根据我的资料，帮我判断今天最应该先处理的一个事业、财运或关系问题。", "ai")
    },
    {
      title: "生成第一份报告",
      desc: "当你需要做决定时，把分析保存成可回看的完整报告。",
      action: "生成报告",
      done: false,
      onClick: () => onSelectReport(demandReportCards[4].preset)
    }
  ];

  return (
    <section className="mt-6 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">First Visit Guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">第一次使用，从这 4 步开始</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
            不需要一次看完所有功能。先建立资料、看今日、问一个问题，再生成一份报告。
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink/55 transition hover:border-[#C79A54]"
        >
          暂时隐藏
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={step.onClick}
            className="rounded border border-[#C79A54]/25 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54] hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#063F4A] text-sm font-semibold text-white">{index + 1}</span>
              {step.done ? <CheckCircle2 className="size-5 text-[#1495A0]" /> : <ChevronRight className="size-5 text-[#C79A54]" />}
            </div>
            <h3 className="mt-4 font-semibold text-[#063F4A]">{step.title}</h3>
            <p className="mt-2 min-h-12 text-xs leading-5 text-ink/55">{step.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#7A1F16]">
              {step.done ? "已完成" : step.action} <ChevronRight className="size-3.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MobileBottomNav({
  categories,
  activeCategory,
  onOpenCategory
}: {
  categories: typeof dashboardCategories;
  activeCategory: DashboardCategory;
  onOpenCategory: (category: DashboardCategory) => void;
}) {
  const iconMap: Record<DashboardCategory, typeof CalendarDays> = {
    today: CalendarDays,
    ai: Bot,
    reports: FileText,
    wallet: WalletCards,
    profile: UserRound,
    partner: Trophy
  };
  const navItems = categories.map((category) => ({ ...category, icon: iconMap[category.id] }));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#CFE2E5] bg-white/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-18px_45px_rgba(6,63,74,0.14)] backdrop-blur-xl md:hidden">
      <div className={`grid gap-1 ${navItems.length > 5 ? "grid-cols-6" : "grid-cols-5"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeCategory === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenCategory(item.id)}
              className={`rounded-2xl px-1.5 py-2 text-center text-[11px] font-semibold transition ${active ? "bg-[#063F4A] text-white shadow-[0_12px_24px_rgba(6,63,74,0.22)]" : "text-ink/55"}`}
            >
              <Icon className={`mx-auto mb-1 size-4 ${active ? "text-[#C79A54]" : "text-[#063F4A]"}`} />
              {item.title}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ModuleCard({
  module,
  active,
  onClick,
  locked = false,
  lockLabel = "需购买"
}: {
  module: (typeof modules)[number];
  active: boolean;
  onClick: () => void;
  locked?: boolean;
  lockLabel?: string;
}) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(6,63,74,0.12)] ${
        active
          ? "border-[#C79A54]/70 bg-gradient-to-br from-[#063F4A] to-[#022B33] text-white shadow-[0_20px_50px_rgba(6,63,74,0.24)]"
          : "border-[#CFE2E5] bg-white/92 text-ink shadow-[0_12px_32px_rgba(6,63,74,0.08)] hover:border-[#C79A54]/55"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-10 place-items-center rounded-2xl ${
            active ? "bg-white/12 text-[#C79A54]" : locked ? "bg-[#F5FAFA] text-ink/35" : "bg-[#DDEFF2] text-[#063F4A]"
          }`}
        >
          {locked ? <LockKeyhole className="size-5" /> : <Icon className="size-5" />}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            active ? "bg-[#C79A54] text-[#063F4A]" : "bg-[#F5FAFA] text-ink/55"
          }`}
        >
          {locked ? lockLabel : module.metric}
        </span>
      </div>
      <h3 className="mt-4 font-semibold">{module.title}</h3>
      <p className={`mt-1 text-xs ${active ? "text-white/62" : "text-ink/48"}`}>{module.desc}</p>
      <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${active ? "text-[#C79A54]" : "text-[#063F4A]"}`}>
        {locked ? "购买创业配套后开放" : "打开"} <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function ScoreRing({ score, label, desc }: { score: number; label: string; desc: string }) {
  return (
    <div className="grid place-items-center">
      <div
        className="grid size-40 place-items-center rounded-full shadow-[0_22px_48px_rgba(199,154,84,0.24)]"
        style={{ background: `conic-gradient(#C79A54 ${score * 3.6}deg, #DDEFF2 0deg)` }}
      >
        <div className="grid size-32 place-items-center rounded-full border border-[#E8D4A8]/55 bg-gradient-to-br from-white to-[#F8F1DF] text-center shadow-inner">
          <span className="text-5xl font-semibold text-[#063F4A]">{score}</span>
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
  hasPartnerAccess,
  onOpenModule
}: {
  currentPlan: (typeof membershipTiers)[number];
  currentPoints: number;
  hasPartnerAccess: boolean;
  onOpenModule: (module: DashboardModule) => void;
}) {
  return (
    <section className="premium-card premium-glow relative p-5 md:p-6">
      <span className="premium-ring -right-28 -top-28 hidden lg:block" />
      <div className="grid gap-6 lg:grid-cols-[0.78fr_1fr_0.9fr]">
        <div className="rounded-3xl border border-white/70 bg-white/58 p-5 shadow-[0_18px_45px_rgba(6,63,74,0.08)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Today</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">今日行动中心</h1>
          <p className="mt-3 text-sm leading-6 text-ink/58">先看分数、宜忌、吉时与吉方，再决定今天最稳的下一步。</p>
          <div className="mt-5">
            <StatusPill>{currentPlan.name} · {currentPoints.toLocaleString("en-US")} 点</StatusPill>
          </div>
          {hasPartnerAccess ? (
            <button
              type="button"
              onClick={() => onOpenModule("partner")}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#063F4A]/15 bg-white px-3 py-2 text-xs font-semibold text-[#063F4A] shadow-[0_10px_24px_rgba(6,63,74,0.08)]"
            >
              创业中心 <ChevronRight className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="premium-gold-card grid gap-4 p-5 sm:grid-cols-[176px_1fr]">
          <ScoreRing score={89} label="Score" desc="稳中有进" />
          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              {fortuneScores.map(([label, score, note]) => (
                <div key={label} className="rounded-2xl border border-[#CFE2E5]/80 bg-white/86 p-3 shadow-[0_10px_25px_rgba(6,63,74,0.06)]">
                  <p className="text-xs text-ink/45">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#063F4A]">{score}</p>
                  <p className="mt-1 text-xs text-ink/50">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#CFE2E5]/80 bg-white/86 p-3">
                <p className="text-xs text-ink/45">今日宜</p>
                <p className="mt-1 font-semibold text-[#063F4A]">复盘、整理资源、谈合作</p>
              </div>
              <div className="rounded-2xl border border-[#E8D4A8]/80 bg-white/86 p-3">
                <p className="text-xs text-ink/45">今日忌</p>
                <p className="mt-1 font-semibold text-[#7A1F16]">冲动承诺、夜间大额决策</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card-dark p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Quick Read</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/8 bg-white/8 p-3">
              <p className="text-xs text-white/45">吉时</p>
              <p className="mt-1 text-xl font-semibold text-[#C79A54]">09:00 - 11:00</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/8 p-3">
              <p className="text-xs text-white/45">吉方</p>
              <p className="mt-1 text-xl font-semibold text-[#C79A54]">东南</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/8 bg-white/8 p-3">
              <p className="text-xs text-white/45">今日建议</p>
              <p className="mt-1 text-sm leading-6 text-white/72">先整理方向与资源，再判断下一步行动。</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenModule("ai")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C79A54] px-4 py-3 text-sm font-semibold text-[#063F4A] shadow-[0_14px_28px_rgba(199,154,84,0.25)] transition hover:-translate-y-0.5"
          >
            问 AI 风水命理师 <Bot className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenModule("wallet")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/8"
          >
            生成今日建议报告 <FileText className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenModule("sigil")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C79A54]/45 bg-white/8 px-4 py-3 text-sm font-semibold text-[#C79A54] transition hover:-translate-y-0.5 hover:bg-[#C79A54]/10"
          >
            生成 Sigil 符印 <Sparkles className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function MembershipPlanPanel({
  currentTier,
  onRequestUpgrade
}: {
  currentTier: MembershipTier;
  onRequestUpgrade: (tier: MembershipTier) => void;
}) {
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const tierRank: Record<MembershipTier, number> = { free: 0, tactical: 1, strategic: 2 };
  const upgradeOptions = membershipTiers.filter((tier) => tierRank[tier.id] > tierRank[currentTier]);
  const visibleFeatures = activeTier.features.slice(0, 3);

  return (
    <section className="mt-4 rounded border border-black/10 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Current Plan</p>
            <StatusPill>{activeTier.name}</StatusPill>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-[#063F4A]">{activeTier.positioning}</h2>
          <p className="mt-1 text-sm leading-6 text-ink/58">
            {activeTier.dataDepth}。{currentTier === "free" ? "升级后可解锁 AI 深度解读、每周/月趋势和高级报告额度。" : "当前方案已按付款结果锁定，升级会由支付成功后自动开通。"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleFeatures.map((feature) => (
              <span key={feature} className="rounded-full bg-[#DDEFF2] px-3 py-1 text-xs font-semibold text-[#063F4A]">
                {feature}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {upgradeOptions.length ? upgradeOptions.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => onRequestUpgrade(tier.id)}
              className={tier.id === "strategic" ? "inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white" : "inline-flex items-center gap-2 rounded border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2.5 text-sm font-semibold text-[#063F4A]"}
            >
              {tier.id === "tactical" ? "升级进阶版" : "升级高阶版"} <CreditCard className="size-4" />
            </button>
          )) : (
            <span className="rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white">已是最高会员方案</span>
          )}
        </div>
      </div>
    </section>
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

function TodayAssistantPanel({
  onOpenModule,
  onSelectPrompt,
  onSelectReport
}: {
  onOpenModule: (module: DashboardModule) => void;
  onSelectPrompt: (prompt: string, module: DashboardModule) => void;
  onSelectReport: (preset: ReportDemandPreset) => void;
}) {
  const [selectedMood, setSelectedMood] = useState<(typeof moodOptions)[number]>(moodOptions[1]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(onboardingProgressStorageKey);
      if (stored) {
        setCompletedSteps(JSON.parse(stored) as number[]);
      }
    } catch {
      window.localStorage.removeItem(onboardingProgressStorageKey);
    }
  }, []);

  function completeStep(index: number) {
    setCompletedSteps((current) => {
      const next = Array.from(new Set([...current, index])).sort((a, b) => a - b);
      window.localStorage.setItem(onboardingProgressStorageKey, JSON.stringify(next));
      return next;
    });
  }

  function handleOnboardingStep(step: (typeof onboardingSteps)[number], index: number) {
    completeStep(index);

    if (step.module === "wallet") {
      onSelectReport(demandReportCards[4].preset);
      return;
    }

    if (step.module === "ai") {
      onSelectPrompt("请根据我的资料，帮我判断今天最应该先处理的一个事业、财运或关系问题。", "ai");
      return;
    }

    onOpenModule(step.module);
  }

  const progress = Math.round((completedSteps.length / onboardingSteps.length) * 100);

  return (
    <section className="mt-5 rounded border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#C79A54]" />
          <div>
            <h2 className="text-lg font-semibold text-[#063F4A]">今日助手</h2>
            <p className="text-sm text-ink/55">完成资料、选状态、进入最适合的下一步。</p>
          </div>
        </div>
        <StatusPill>新手路径 · 今日推荐</StatusPill>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1fr_1.1fr]">
        <div className="rounded border border-[#C79A54]/25 bg-rice p-4">
          <p className="text-sm font-semibold text-[#063F4A]">1. 今天你的状态？</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {moodOptions.slice(0, 6).map((mood) => {
              const active = selectedMood.label === mood.label;
              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={active ? "rounded border border-[#C79A54] bg-[#C79A54]/15 px-3 py-2 text-left" : "rounded border border-black/10 bg-white px-3 py-2 text-left"}
                >
                  <span className="block text-lg font-semibold text-[#063F4A]">{mood.label}</span>
                  <span className="block text-xs text-ink/50">{mood.desc}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onSelectPrompt(selectedMood.prompt, "ai")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white"
          >
            用这个状态问 AI <Bot className="size-4" />
          </button>
        </div>

        <div className="rounded border border-black/10 bg-[#F5FAFA] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#063F4A]">2. 新会员先做这 4 件事</p>
            <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#063F4A]">{completedSteps.length}/{onboardingSteps.length}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 grid gap-2">
            {onboardingSteps.map((step, index) => {
              const done = completedSteps.includes(index);

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => handleOnboardingStep(step, index)}
                  className={done ? "group flex items-center gap-3 rounded border border-[#C79A54]/45 bg-[#C79A54]/10 p-3 text-left transition hover:border-[#C79A54]" : "group flex items-center gap-3 rounded border border-black/10 bg-white p-3 text-left transition hover:border-[#C79A54]/55"}
                >
                  <span className={done ? "grid size-7 shrink-0 place-items-center rounded bg-[#C79A54] text-xs font-semibold text-[#063F4A]" : "grid size-7 shrink-0 place-items-center rounded bg-[#DDEFF2] text-xs font-semibold text-[#063F4A]"}>
                    {done ? <CheckCircle2 className="size-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{step.title}</span>
                    <span className="block truncate text-xs text-ink/48">{done ? "已完成，可再次查看" : step.desc}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink/35 transition group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-[#063F4A] p-4 text-white">
          <p className="text-sm font-semibold text-[#C79A54]">3. 系统建议你现在做</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {recommendedActions.slice(0, 3).map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => onOpenModule(action.module)}
                  className="group flex items-center gap-3 rounded border border-white/10 bg-white/8 p-3 text-left transition hover:border-[#C79A54]/60"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded bg-white/10 text-[#C79A54]">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{action.title}</span>
                    <span className="block truncate text-xs text-white/50">{action.desc}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-white/35 transition group-hover:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function AccountSummaryBar({
  accountStats,
  partnerPackage,
  membershipMessage,
  pointBalance,
  onOpenWallet,
  onOpenInvite
}: {
  accountStats: ReturnType<typeof compactAccountStats>;
  partnerPackage: PartnerPackage;
  membershipMessage: string;
  pointBalance: number;
  onOpenWallet: () => void;
  onOpenInvite: () => void;
}) {
  const primaryStats = accountStats.filter((stat) => ["当前点数", "今日 AI 次数", "推荐收益", "待完成报告"].includes(stat.label));

  return (
    <section className="mt-5 rounded border border-black/10 bg-white p-4 shadow-sm">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStats.map((stat) => (
            <article key={stat.label} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
              <p className="text-xs font-medium text-ink/48">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#063F4A]">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold text-[#1495A0]">{stat.change}</p>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            type="button"
            onClick={onOpenWallet}
            className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052F38]"
          >
            充值 / 生成报告 <CreditCard className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenInvite}
            className="inline-flex items-center gap-2 rounded border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2.5 text-sm font-semibold text-[#063F4A]"
          >
            邀请好友 <Share2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {walletQuickRows.map(([label, value]) => (
          <div key={label} className="rounded border border-black/10 bg-[#F5FAFA] px-3 py-2 text-sm">
            <span className="text-ink/48">{label}</span>
            <span className="ml-2 font-semibold text-[#063F4A]">{value === "pointBalance" ? `${pointBalance.toLocaleString("en-US")} 点` : value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded border border-[#C79A54]/25 bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#063F4A]">
        {membershipMessage}
        <span className="mt-1 block text-xs font-medium text-ink/55">创业配套状态：{partnerPackageLabels[partnerPackage]}</span>
      </div>
    </section>
  );
}

function AiQuestionStarter({ onSelectPrompt }: { onSelectPrompt: (prompt: string, module: DashboardModule) => void }) {
  return (
    <section className="mt-5 rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">AI Master</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">你今天想问什么？</h2>
          <p className="mt-2 text-sm text-ink/55">像 ChatGPT 一样直接问，不懂命理也能开始。</p>
        </div>
        <button
          type="button"
          onClick={() => onSelectPrompt("", "ai")}
          className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white"
        >
          打开 AI 对话 <Bot className="size-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {aiQuestionPrompts.map((prompt) => (
          <button
            key={prompt.title}
            type="button"
            onClick={() => onSelectPrompt(prompt.title, prompt.module)}
            className="group rounded border border-black/10 bg-[#F5FAFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:bg-white hover:shadow-sm"
          >
            <p className="font-semibold text-[#063F4A]">{prompt.title}</p>
            <p className="mt-2 text-xs leading-5 text-ink/55">{prompt.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1495A0]">
              开始分析 <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ReportDemandPanel({ onSelectReport }: { onSelectReport: (preset: ReportDemandPreset) => void }) {
  return (
    <section className="mt-5 rounded border border-black/10 bg-[#F5FAFA] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Report Center</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">你想解决哪一类问题？</h2>
          <p className="mt-2 text-sm leading-6 text-ink/55">先选需求，不需要先懂八字、紫微、梅花或数字命理。</p>
        </div>
        <StatusPill>四术合参 · 自动保存</StatusPill>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {demandReportCards.map((report) => (
          <button
            key={report.title}
            type="button"
            onClick={() => onSelectReport(report.preset)}
            className="rounded border border-black/10 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm"
          >
            <p className="font-semibold text-[#063F4A]">{report.title}</p>
            <p className="mt-2 text-xs leading-5 text-ink/55">{report.desc}</p>
            <p className="mt-3 rounded bg-[#DDEFF2] px-2 py-1 text-xs font-semibold text-[#063F4A]">{report.cost}</p>
            <p className="mt-2 text-xs text-ink/42">结合八字、紫微、梅花、数字命理生成</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfileOverviewPanel({ memberProfile, onOpenProfile }: { memberProfile: MemberProfile; onOpenProfile: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mt-5 rounded border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">My Destiny File</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#063F4A]">我的资料与命盘</h2>
          <p className="mt-2 text-sm text-ink/55">AI、每日运势和报告都会读取这份基础资料。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setExpanded((current) => !current)} className="rounded border border-[#063F4A]/15 bg-[#DDEFF2] px-4 py-2 text-sm font-semibold text-[#063F4A]">
            {expanded ? "收起" : "展开命盘"}
          </button>
          <button type="button" onClick={onOpenProfile} className="rounded bg-[#063F4A] px-4 py-2 text-sm font-semibold text-white">
            编辑资料
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-6">
        {[
          ["姓名", memberProfile.name],
          ["生日", memberProfile.birthDate],
          ["出生时间", memberProfile.birthTimeLabel],
          ["性别", memberProfile.gender],
          ["地区", memberProfile.region],
          ["年度关键词", destinyKeywords[0]]
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-black/10 bg-[#F5FAFA] p-3">
            <p className="text-xs text-ink/45">{label}</p>
            <p className="mt-1 truncate font-semibold text-[#063F4A]">{value}</p>
          </div>
        ))}
      </div>
      {expanded ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded border border-black/10 bg-[#F5FAFA] p-4">
            <p className="font-semibold text-[#063F4A]">五行状态</p>
            <div className="mt-3 grid gap-3">
              {fiveElementProfile.map(([element, score, desc]) => (
                <div key={element}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{element}</span>
                    <span className="text-[#063F4A]">{score}/100</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${score}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-ink/50">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-black/10 bg-[#F5FAFA] p-4">
            <p className="font-semibold text-[#063F4A]">十二宫简表</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {palaceExplanations.slice(0, 12).map((palace) => (
                <button key={palace.name} type="button" onClick={onOpenProfile} className="rounded bg-white px-3 py-2 text-left text-sm font-semibold text-[#063F4A]">
                  {palace.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TodayFortune({ currentTier, memberProfile }: { currentTier: MembershipTier; memberProfile: MemberProfile }) {
  const [aiFortune, setAiFortune] = useState<DailyFortuneResponse | null>(null);
  const [isLoadingFortune, setIsLoadingFortune] = useState(false);
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const matrix = aiFortune?.matrix || buildDailyFortuneMatrix(memberProfile, activeTier.name);
  const dailyScores = [matrix.wealth, matrix.career, matrix.relationship];
  const weatherToneClass =
    matrix.weather.tone === "clear"
      ? "border-[#C79A54]/45 bg-[#C79A54]/12 text-[#C79A54]"
      : matrix.weather.tone === "cloudy"
        ? "border-white/15 bg-white/10 text-[#DDEFF2]"
        : "border-[#E8D4A8]/35 bg-[#E8D4A8]/12 text-[#E8D4A8]";

  async function getMemberAccessToken() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return "";
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function generateDailyFortune() {
    setIsLoadingFortune(true);

    try {
      const accessToken = await getMemberAccessToken();

      if (!accessToken) {
        return;
      }

      const response = await fetch("/api/daily-fortune", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
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

  useEffect(() => {
    generateDailyFortune();
  }, [memberProfile.name, memberProfile.birthDate, memberProfile.birthTime, memberProfile.gender, currentTier]);

  return (
    <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/58">每日紫微气象站 · {matrix.dateLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{matrix.headline}</h2>
            <p className="mt-2 text-xs text-white/45">
              {memberProfile.name} · {memberProfile.birthDate} · {memberProfile.birthTimeLabel} · {memberProfile.gender} · {matrix.lunarDate}
            </p>
          </div>
          <CalendarDays className="size-9 text-[#C79A54]" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr]">
          <div className="rounded border border-[#C79A54]/35 bg-[#C79A54]/12 p-4">
            <p className="text-xs text-white/55">今日评分</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-semibold leading-none text-[#C79A54]">{matrix.overall}</span>
              <span className="pb-1 text-sm text-white/52">/100</span>
            </div>
            <p className="mt-3 text-xs text-white/62">{matrix.weather.description}</p>
          </div>
          <div className="rounded border border-white/12 bg-white/8 p-4 sm:hidden">
            <p className="text-xs text-white/55">今日天气</p>
            <p className="mt-2 text-2xl text-[#C79A54]">{matrix.weather.label}</p>
            <p className="mt-2 text-xs text-white/58">宜：{matrix.yi.slice(0, 2).join("、")}；忌：{matrix.ji.join("、")}。</p>
          </div>
          <div className="rounded border border-white/12 bg-white/8 p-4">
            <div className="grid gap-4">
              {dailyScores.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-white">{item.label}</span>
                    <span className="text-[#C79A54]">{item.score}/100</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/12">
                    <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${item.score}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-white/52">{item.advice}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["今日宜", matrix.yi.join("、")],
            ["今日忌", matrix.ji.join("、")],
            ["吉时", matrix.luckyHour],
            ["避开", matrix.avoidWindow]
          ].map(([label, value]) => (
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
              <p className="text-sm">幸运色：{matrix.luckyColor}</p>
            </div>
          </div>
          <div className="rounded bg-white/8 p-3">
            <TrendingUp className="size-4 text-[#C79A54]" />
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full border border-[#C79A54]/45 text-[10px] text-[#C79A54]">{matrix.nobleDirection.slice(0, 1)}</span>
              <p className="text-sm">贵人方：{matrix.nobleDirection}</p>
            </div>
          </div>
          <div className="rounded bg-white/8 p-3">
            <Flame className="size-4 text-[#C79A54]" />
            <p className="mt-2 text-sm">吉方：{matrix.luckyDirection}</p>
          </div>
        </div>

        <div className={`mt-5 rounded border p-4 ${weatherToneClass}`}>
          <p className="text-sm font-semibold">今日开运秘方</p>
          <p className="mt-2 text-sm leading-6 text-white/75">{matrix.actionSecret}</p>
          <p className="mt-2 text-xs leading-5 text-white/52">今日线索：{matrix.clue}</p>
        </div>

        <div className="mt-6 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#C79A54]">底层算法</p>
              <p className="mt-1 text-sm text-white/65">{matrix.method}</p>
            </div>
          <button
            type="button"
              onClick={generateDailyFortune}
              disabled={isLoadingFortune}
              className="rounded bg-[#C79A54] px-4 py-2 text-sm font-semibold text-[#063F4A] disabled:opacity-60"
            >
              {isLoadingFortune ? "生成中..." : currentTier === "free" ? "刷新今日气象" : "AI 生成今日解读"}
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
              {currentTier === "free" ? <p className="mt-3 text-xs leading-5 text-[#E8D4A8]">{matrix.upgradeHint}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Daily Signals</p>
              <h3 className="mt-2 text-xl font-semibold">今日评分来源</h3>
            </div>
            <StatusPill>{matrix.weather.label}</StatusPill>
          </div>
          <div className="mt-4 grid gap-3">
            {dailyScores.map((item) => (
              <div key={item.key} className="rounded border border-black/10 bg-rice p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.palace}</p>
                  <span className="rounded bg-[#C79A54]/15 px-2 py-1 text-xs font-semibold text-[#063F4A]">{item.score}</span>
                </div>
                <p className="mt-1 text-sm text-ink/65">{item.signals.join(" / ")}</p>
                <p className="mt-1 text-xs leading-5 text-ink/48">风险：{item.risks.join("、")}</p>
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

function DestinyProfileModule({
  memberProfile,
  onProfileUpdated
}: {
  memberProfile: MemberProfile;
  onProfileUpdated: (profile: MemberProfile) => void;
}) {
  const [selectedPalace, setSelectedPalace] = useState<(typeof palaceExplanations)[number] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [draftProfile, setDraftProfile] = useState({
    name: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: memberProfile.birthDate,
    birthTime: memberProfile.birthTime,
    email: memberProfile.email,
    phone: memberProfile.phone,
    region: memberProfile.region
  });

  useEffect(() => {
    if (!isEditing) {
      setDraftProfile({
        name: memberProfile.name,
        gender: memberProfile.gender,
        birthDate: memberProfile.birthDate,
        birthTime: memberProfile.birthTime,
        email: memberProfile.email,
        phone: memberProfile.phone,
        region: memberProfile.region
      });
    }
  }, [isEditing, memberProfile]);

  async function getMemberAccessToken() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return "";
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  async function saveProfile() {
    setProfileMessage("");

    if (!draftProfile.name.trim() || !draftProfile.birthDate || !draftProfile.gender) {
      setProfileMessage("请填写姓名、出生日期与性别。");
      return;
    }

    setIsSaving(true);

    try {
      const accessToken = await getMemberAccessToken();

      if (!accessToken) {
        setProfileMessage("登录状态已过期，请重新登录后再保存。");
        return;
      }

      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(draftProfile)
      });
      const result = await response.json();

      if (!response.ok) {
        setProfileMessage(result.error || "资料保存失败，请稍后再试。");
        return;
      }

      onProfileUpdated(profileRowToMemberProfile(result.profile));
      setIsEditing(false);
      setProfileMessage("资料已更新，今日运势、AI 风水命理师和报告会读取新资料。");
    } catch {
      setProfileMessage("资料保存失败，请检查网络后再试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/55">Personal Destiny Profile</p>
            <h2 className="mt-2 text-3xl font-semibold">{memberProfile.name} 的个人命盘</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
              会员注册后必须填写基础资料。今日运势、AI 风水命理师和报告中心都会读取这份档案来做命理分析。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileMessage("");
              setIsEditing((current) => !current);
            }}
            className="rounded bg-white px-4 py-2 text-sm font-semibold text-[#063F4A] transition hover:bg-[#E8D4A8]"
          >
            {isEditing ? "取消编辑" : "编辑资料"}
          </button>
        </div>

        {isEditing ? (
          <div className="mt-6 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-white/75">
                姓名
                <input
                  value={draftProfile.name}
                  onChange={(event) => setDraftProfile((current) => ({ ...current, name: event.target.value }))}
                  className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
                />
              </label>
              <label className="text-sm font-semibold text-white/75">
                性别
                <select
                  value={draftProfile.gender}
                  onChange={(event) => setDraftProfile((current) => ({ ...current, gender: event.target.value }))}
                  className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="未填写">未填写</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-white/75">
                出生日期
                <input
                  type="date"
                  value={draftProfile.birthDate}
                  onChange={(event) => setDraftProfile((current) => ({ ...current, birthDate: event.target.value }))}
                  className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
                />
              </label>
              <label className="text-sm font-semibold text-white/75">
                出生时辰
                <input
                  type="time"
                  value={draftProfile.birthTime}
                  onChange={(event) => setDraftProfile((current) => ({ ...current, birthTime: event.target.value }))}
                  className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
                />
              </label>
              <label className="text-sm font-semibold text-white/75">
                Email
                <input
                  value={draftProfile.email}
                  disabled
                  className="mt-2 w-full rounded border border-white/20 bg-white/75 px-3 py-3 text-[#102F38] outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-white/75">
                手机号
                <input
                  value={draftProfile.phone}
                  onChange={(event) => setDraftProfile((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="选填"
                  className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
                />
              </label>
            </div>
            <label className="text-sm font-semibold text-white/75">
              地区
              <input
                value={draftProfile.region}
                onChange={(event) => setDraftProfile((current) => ({ ...current, region: event.target.value }))}
                className="mt-2 w-full rounded border border-white/20 bg-white px-3 py-3 text-[#102F38] outline-none focus:border-[#C79A54]"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="rounded bg-[#C79A54] px-5 py-3 text-sm font-semibold text-[#063F4A] disabled:opacity-60"
              >
                {isSaving ? "保存中..." : "保存资料"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setProfileMessage("");
                }}
                className="rounded border border-white/20 px-5 py-3 text-sm font-semibold text-white"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["姓名", memberProfile.name],
              ["性别", memberProfile.gender],
              ["出生日期", memberProfile.birthDate || "未填写"],
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
        )}

        {profileMessage ? (
          <div className="mt-4 rounded border border-[#C79A54]/35 bg-white/10 p-3 text-sm leading-6 text-white/78">
            {profileMessage}
          </div>
        ) : null}

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
            <span className="rounded bg-white px-2 py-1 text-xs text-ink/55">点击看解释</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palaceExplanations.map((palace) => (
              <button
                key={palace.name}
                type="button"
                onClick={() => setSelectedPalace(palace)}
                className="rounded bg-white p-3 text-left text-sm font-semibold text-[#063F4A] transition hover:-translate-y-0.5 hover:border-[#C79A54]/45 hover:bg-[#C79A54]/10 hover:shadow-sm"
              >
                {palace.name}
                <span className="mt-1 block text-xs font-normal text-ink/45">点击查看</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-ink/52">
            后续接真实排盘库后，每个宫位会写入主星、辅星、煞曜、四化状态和权重分。
          </p>
        </div>
      </div>
      {selectedPalace ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0A0A0A]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded border border-[#C79A54]/35 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Ziwei Palace</p>
                <h3 className="mt-2 text-3xl font-semibold text-[#063F4A]">{selectedPalace.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPalace(null)}
                className="grid size-10 place-items-center rounded bg-[#F5FAFA] text-ink/58"
                aria-label="关闭宫位解释"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded border border-black/10 bg-[#F5FAFA] p-4">
                <p className="text-sm font-semibold text-[#063F4A]">代表什么</p>
                <p className="mt-2 text-sm leading-6 text-ink/68">{selectedPalace.meaning}</p>
              </div>
              <div className="rounded border border-[#1495A0]/20 bg-[#DDEFF2] p-4">
                <p className="text-sm font-semibold text-[#063F4A]">好状态</p>
                <p className="mt-2 text-sm leading-6 text-ink/68">{selectedPalace.good}</p>
              </div>
              <div className="rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
                <p className="text-sm font-semibold text-[#063F4A]">需要注意</p>
                <p className="mt-2 text-sm leading-6 text-ink/68">{selectedPalace.caution}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-ink/45">
              简易解释用于帮助会员理解宫位含义。完整判断仍需结合主星、辅星、四化、流年与当前问题。
            </p>
          </div>
        </div>
      ) : null}
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

function BaziReportPanel({ report, memberProfile }: { report: SavedReport; memberProfile: MemberProfile }) {
  const baziInput = report.metadata?.baziInput;
  const analysis = report.metadata?.baziAnalysis;
  const pillars = getBaziPillars(baziInput);
  const elements = analysis?.elementScores?.length
    ? analysis.elementScores.map((item) => ({
        element: item.element,
        value: item.percentage,
        tone: `${item.level} · ${item.meaning}`
      }))
    : getBaziElementRows(pillars);
  const luckRows = analysis?.luckPillars?.length
    ? analysis.luckPillars.map((row) => [row.ageRange, row.yearRange, row.ganZhi[0] || "-", row.ganZhi[1] || "-", row.tenGod, `${row.theme}：${row.advice}`])
    : getTenYearLuckRows();
  const annualRows = analysis?.annualLuck?.length
    ? analysis.annualLuck.map((row) => ({ ...row, stemBranch: row.ganZhi }))
    : getAnnualLuckRows();
  const scoreRows = getBaziScoreRows();
  const displayName = baziInput?.fullName || memberProfile.name;
  const displayBirthDate = baziInput?.birthDate || memberProfile.birthDate;
  const displayBirthTime = baziInput?.birthTime || memberProfile.birthTimeLabel;
  const displayBirthLocation = baziInput?.birthLocation || memberProfile.region;
  const dayMaster = analysis ? `${analysis.dayMaster}${analysis.dayMasterElement} · ${analysis.dayMasterStrength}` : `${pillars[2]?.stem || "待"}${baziStemElements[pillars[2]?.stem] || ""}`;
  const usefulGods = analysis?.usefulGods?.join("、") || "木、水";
  const avoidGods = analysis?.avoidGods?.join("、") || "火、土";
  const tenGodFocus = analysis?.tenGodDistribution?.slice(0, 4) || [];
  const interactionFocus = analysis?.interactions?.slice(0, 4) || [];
  const structureNotes = analysis?.structureNotes?.slice(0, 4) || [];
  const conicStops = elements.reduce(
    (state, item, index) => {
      const colors = ["#C79A54", "#1495A0", "#9ED8DF", "#B91C1C", "#E8D4A8"];
      const next = state.current + item.value;
      state.parts.push(`${colors[index]} ${state.current}% ${next}%`);
      state.current = next;
      return state;
    },
    { current: 0, parts: [] as string[] }
  );
  const pieStyle = {
    background: `conic-gradient(${conicStops.parts.join(", ")})`
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">一、八字排盘</h4>
            <span className="text-sm font-semibold text-[#063F4A]">日主：{dayMaster}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 overflow-hidden rounded border border-[#C79A54]/35 text-center">
            {pillars.map((pillar) => (
              <div key={pillar.label} className="border-r border-[#C79A54]/25 last:border-r-0">
                <p className="bg-[#F5FAFA] py-2 text-sm font-semibold">{pillar.label}</p>
                <p className="py-3 text-5xl font-semibold text-[#C79A54]">{pillar.stem}</p>
                <p className="py-3 text-5xl font-semibold text-[#7A1F16]">{pillar.branch}</p>
                <div className="border-t border-[#C79A54]/25 px-2 py-3 text-xs leading-5 text-ink/65">
                  <p>藏干：{pillar.hiddenStems}</p>
                  <p>十神：{pillar.tenGods}</p>
                  <p>纳音：{pillar.naYin}</p>
                  <p>空亡：{pillar.emptyBranch}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm leading-6 text-ink/58">
            分析对象：{displayName} · 公历 {displayBirthDate} {displayBirthTime} · 出生地：{displayBirthLocation}
          </p>
          <p className="mt-2 rounded bg-[#fff4d6] p-3 text-xs leading-5 text-ink/55">
            当前四柱由系统按公历日期、节气切换与出生时辰自动推算。{analysis?.verification?.note || "若出生地涉及真太阳时或节气交界日，建议以专业万年历复核。"}
          </p>
        </section>

        <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">二、五行强弱分析</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="grid place-items-center">
              <div className="grid size-40 place-items-center rounded-full shadow-inner" style={pieStyle}>
                <div className="grid size-24 place-items-center rounded-full bg-[#fffaf0] text-center">
                  <p className="text-3xl font-semibold text-[#063F4A]">82</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink/45">Score</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              {elements.map((item) => (
                <div key={item.element} className="grid grid-cols-[36px_1fr_42px] items-center gap-3 text-sm">
                  <span className="font-semibold">{item.element}</span>
                  <span className="h-3 rounded-full bg-[#DDEFF2]">
                    <span className="block h-full rounded-full bg-[#C79A54]" style={{ width: `${Math.max(item.value, 4)}%` }} />
                  </span>
                  <span className="text-right text-ink/55">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-3">
              <p className="text-sm font-semibold text-[#063F4A]">喜用神</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">{usefulGods} 为主要调候方向，用来补节奏、开资源、化压力。</p>
            </div>
            <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-3">
              <p className="text-sm font-semibold text-[#063F4A]">忌神提醒</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">{avoidGods} 过旺时容易消耗承载力，重大决定需先做风险复盘。</p>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["三、命局重点", structureNotes.join(" ") || "日主重承诺、守信用、能承载压力；情绪紧绷时要避免过度控制。"],
          ["四、十神分布", tenGodFocus.length ? tenGodFocus.map((item) => `${item.tenGod}×${item.count}：${item.tone}`).join(" ") : "十神分布较平均，适合长期规划、复盘机制与标准化流程。"],
          ["五、合冲刑害", interactionFocus.length ? interactionFocus.map((item) => `${item.type}${item.pair}：${item.meaning}`).join(" ") : "未见特别集中的合冲刑害，判断重点回到五行强弱、喜忌和流年节奏。"],
          ["六、落地提醒", "适合把命理结果转为行动清单：现金流表、合约边界、复盘制度、健康节律。命理只作文化参考，不构成专业建议。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#7A1F16]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">七、十年大运表</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#063F4A]">
              <tr>{["年龄", "年份", "天干", "地支", "十神", "运势简评"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {luckRows.map((row) => (
                <tr key={row.join("-")}>{row.map((cell, index) => <td key={`${cell}-${index}`} className="px-3 py-2 text-ink/65">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">八、未来十年流年运势</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#063F4A]">
              <tr>{["年份", "干支", "主题", "事业", "财运", "感情", "提醒"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {annualRows.map((row) => (
                <tr key={row.year}>
                  <td className="px-3 py-2 font-semibold">{row.year}</td>
                  <td className="px-3 py-2 text-[#7A1F16]">{row.stemBranch}</td>
                  <td className="px-3 py-2">{row.theme}</td>
                  <td className="px-3 py-2 text-ink/65">{row.career}</td>
                  <td className="px-3 py-2 text-ink/65">{row.wealth}</td>
                  <td className="px-3 py-2 text-ink/65">{row.relationship}</td>
                  <td className="px-3 py-2 text-ink/65">{row.reminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">九、综合评分</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {scoreRows.map(([label, score]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 text-center">
                <p className="text-3xl font-semibold text-[#063F4A]">{score}</p>
                <p className="mt-1 text-xs text-ink/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">十、开运建议与重要提醒</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["幸运颜色", "绿色、蓝色、金色；用于穿搭、办公小物与品牌细节。"],
              ["适合方位", "东方、北方、西北方；适合学习、谈判与复盘。"],
              ["适合行业", "顾问咨询、教育培训、地产空间、系统服务、管理与品牌运营。"],
              ["提升建议", "建立现金流表、合作边界、复盘制度；先稳住结构，再扩大规模。"]
            ].map(([label, content]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                <p className="font-semibold text-[#063F4A]">{label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/65">{content}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-xs leading-5 text-ink/60">{baziDisclaimer}</p>
        </div>
      </section>
    </div>
  );
}

function NumerologyReportPanel({ report }: { report: SavedReport }) {
  const input = report.metadata?.numerologyInput;
  const core = getNumerologyCore(input);
  const energyRows = getNumerologyEnergyRows(input);
  const cycleRows = getNumerologyCycleRows(input);
  const annualRows = getNumerologyAnnualRows(input);
  const scoreRows = getNumerologyScoreRows(input);
  const coreNumbers = [
    ["生命路径数", core.lifePath, "人生主线"],
    ["命运数", core.destiny, "外在使命"],
    ["灵魂渴望数", core.soulUrge, "内在驱动力"],
    ["人格数", core.personality, "外界感知"],
    ["生日数", core.birthday, "天赋入口"],
    ["成熟数", core.maturity, "后天整合"],
    ["个人年数", core.personalYear, "今年主题"]
  ] as const;
  const missingNumbers = energyRows.filter((row) => row.count === 0).map((row) => row.number).join("、") || "无明显缺失";
  const repeatedNumbers = energyRows.filter((row) => row.count >= 3).map((row) => row.number).join("、") || "能量较平均";

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded border border-[#C79A54]/40 bg-[#102F38] text-white">
        <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h4 className="rounded bg-[#C79A54] px-4 py-2 font-semibold text-[#102F38]">一、核心数字计算</h4>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {coreNumbers.map(([label, value, hint]) => (
                <div key={label} className="rounded border border-white/15 bg-white/8 p-3">
                  <p className="text-xs text-white/55">{label}</p>
                  <p className="mt-1 text-4xl font-semibold text-[#E8D4A8]">{value}</p>
                  <p className="mt-1 text-xs text-white/60">{hint}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded border border-white/15 bg-white/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8D4A8]">Life Path Matrix</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {energyRows.map((row) => (
                <div key={row.number} className="grid aspect-square place-items-center rounded border border-white/15 bg-[#0A0A0A]/25 text-center">
                  <span className="text-3xl font-semibold text-[#C79A54]">{row.number}</span>
                  <span className="text-xs text-white/55">{row.count} 次</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              缺失数字：{missingNumbers}。重复数字：{repeatedNumbers}。数字能量用于观察习惯、天赋与需要训练的课题。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">二、核心数字含义</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {coreNumbers.slice(0, 6).map(([label, value]) => {
            const meaning = getNumerologyMeaning(value);
            return (
              <article key={label} className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#102F38]">{label}</p>
                  <span className="grid size-10 place-items-center rounded-full bg-[#C79A54] font-semibold text-white">{value}</span>
                </div>
                <p className="mt-3 font-semibold text-[#3B1B66]">{meaning.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">优势：{meaning.strength}。挑战：{meaning.weakness}。课题：{meaning.lesson}。</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#102F38] px-4 py-2 font-semibold text-white">三、1-9 数字能量分布</h4>
        <div className="mt-4 grid gap-3">
          {energyRows.map((row) => (
            <div key={row.number} className="grid gap-3 rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 md:grid-cols-[60px_1fr_90px] md:items-center">
              <p className="text-2xl font-semibold text-[#3B1B66]">{row.number}</p>
              <div>
                <div className="h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#3B1B66] via-[#1495A0] to-[#C79A54]" style={{ width: `${row.strength}%` }} />
                </div>
                <p className="mt-1 text-xs text-ink/50">{getNumerologyMeaning(row.number).title}</p>
              </div>
              <p className="text-sm font-semibold text-[#102F38]">{row.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["四、生命路径分析", core.lifePath, "你的人生主线适合用稳定行动把天赋变成长期成果。先建立清楚节奏，再放大影响力。"],
          ["五、命运数分析", core.destiny, "外在使命强调可被看见的专业价值。适合把经验整理成产品、内容或服务流程。"],
          ["六、灵魂渴望分析", core.soulUrge, "内在动力来自真实感与意义感。越能把选择和价值观对齐，行动越稳定。"]
        ].map(([title, value, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#3B1B66]">{title}</h4>
            <p className="mt-3 text-5xl font-semibold text-[#C79A54]">{value}</p>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["事业", "适合以专业、沟通、系统化服务与持续输出建立个人品牌。"],
          ["财富", "宜走长期现金流、可复制产品与稳健合作，避免只凭情绪追机会。"],
          ["关系", "关系质量来自清楚表达和稳定边界，别让照顾别人变成过度消耗。"],
          ["健康 / 生活", "注意睡眠、压力节奏与固定运动。本项为生活提醒，不是医疗建议。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#102F38]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">七、人生周期表</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#3B1B66]">
              <tr>{["年龄", "年份", "周期数", "主题", "运势分", "建议"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {cycleRows.map((row) => (
                <tr key={row.age}>
                  <td className="px-3 py-2 font-semibold">{row.age}</td>
                  <td className="px-3 py-2">{row.yearRange}</td>
                  <td className="px-3 py-2 text-[#3B1B66]">{row.number}</td>
                  <td className="px-3 py-2">{row.theme}</td>
                  <td className="px-3 py-2 text-[#C79A54]">{row.score}</td>
                  <td className="px-3 py-2 text-ink/65">{row.advice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#102F38] px-4 py-2 font-semibold text-white">八、未来十年数字流年</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#102F38]">
              <tr>{["年份", "个人年数", "年度主题", "事业建议", "财富建议", "关系建议", "行动提醒"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {annualRows.map((row) => (
                <tr key={row.year}>
                  <td className="px-3 py-2 font-semibold">{row.year}</td>
                  <td className="px-3 py-2 text-[#3B1B66]">{row.number}</td>
                  <td className="px-3 py-2">{row.theme}</td>
                  <td className="px-3 py-2 text-ink/65">{row.career}</td>
                  <td className="px-3 py-2 text-ink/65">{row.wealth}</td>
                  <td className="px-3 py-2 text-ink/65">{row.relationship}</td>
                  <td className="px-3 py-2 text-ink/65">{row.reminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">九、评分摘要</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {scoreRows.map(([label, score]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 text-center">
                <p className="text-3xl font-semibold text-[#3B1B66]">{score}</p>
                <p className="mt-1 text-xs text-ink/55">{label}</p>
                <p className="mt-1 text-xs tracking-widest text-[#C79A54]">★★★★★</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#102F38] px-4 py-2 font-semibold text-white">十、幸运指南与最终建议</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["幸运数字", `${core.lifePath}、${core.destiny}、${core.maturity}`],
              ["幸运颜色", "深蓝、金色、紫色、米白"],
              ["幸运方向", "北方、西北、东南"],
              ["幸运日期", `每月 ${core.lifePath} / ${core.destiny} / ${core.personalYear} 日前后`],
              ["适合行业", "顾问、教育、内容、管理、科技服务、品牌运营"],
              ["合作对象", `生命路径 ${core.destiny}、${core.maturity} 或 ${reduceNumerologyNumber(core.lifePath + 2)} 的伙伴`]
            ].map(([label, content]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                <p className="font-semibold text-[#102F38]">{label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/65">{content}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-sm leading-6 text-ink/65">
            最终建议：先把天赋数字变成可重复的日常节奏。你越能把目标、边界、资源和时间表讲清楚，越容易让机会真正落地。
          </p>
          <p className="mt-3 rounded bg-[#F5FAFA] p-3 text-xs leading-5 text-ink/55">{numerologyDisclaimer}</p>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">十一、AI 综合解析</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {normalizedReportContent(report).sections.map((section) => (
            <div key={section.title} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-4">
              <p className="font-semibold text-[#3B1B66]">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">{section.content}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function IntegratedReportPanel({ report }: { report: SavedReport }) {
  const input = report.metadata?.integratedInput;
  const meihuaInput = report.metadata?.meihuaInput;
  const baziInput = report.metadata?.baziInput;
  const ziweiInput = report.metadata?.ziweiInput;
  const numerologyInput = report.metadata?.numerologyInput;
  const scoreRows = [
    ["长期格局", report.metadata?.integratedScores?.overall ?? 86],
    ["事业机会", report.metadata?.integratedScores?.career ?? 88],
    ["财务节奏", report.metadata?.integratedScores?.wealth ?? 82],
    ["行动时机", report.metadata?.integratedScores?.timing ?? 79],
    ["人和资源", report.metadata?.integratedScores?.relationship ?? 84],
    ["风险控制", report.metadata?.integratedScores?.risk ?? 81]
  ] as const;
  const wealthRadar = reportWealthRadar(report);
  const timingBoard = reportTimingBoard(report);
  const peopleGuide = reportPeopleGuide(report);
  const actionGroups = [
    ["现在先做", report.metadata?.integratedActions?.now],
    ["需要避免", report.metadata?.integratedActions?.avoid],
    ["仪式建议", report.metadata?.integratedActions?.ritual],
    ["产品建议", report.metadata?.integratedActions?.products]
  ].filter(([, items]) => Array.isArray(items) && items.length > 0) as [string, string[]][];
  const systemMatrix = [
    ["命盘底盘", `${baziInput?.birthDate || input?.birthDate || "未填生日"} · ${baziInput?.birthHourBranch || input?.birthHourBranch || "时辰待定"}`, "判断先天性格、五行承载、资源结构与长期运势底色。"],
    ["宫位阶段", ziweiInput?.focus ? ziweiFocusLabels[ziweiInput.focus] : "人生阶段", "观察事业、财富、人际、家庭与当前阶段的触发重点。"],
    ["当下问事", meihuaInput?.specificQuestion || input?.specificQuestion || "当前关键问题", "看现状、阻力、转折与短期行动窗口。"],
    ["行为节奏", numerologyInput?.focus ? numerologyFocusLabels[numerologyInput.focus] : "个人节奏", "校准执行方式、沟通习惯、年度主题与成长课题。"]
  ] as const;
  const destinyChecklist = [
    ["先天格局", "看性格底盘、优势、弱点与承载能力。"],
    ["当前运势", "看近期是否适合推进、等待、修复或调整。"],
    ["现实决策", "把命理信号转成可执行的工作、财务、关系建议。"],
    ["通关方法", "用空间、颜色、行为、仪式和复盘降低阻力。"]
  ] as const;

  return (
    <div className="grid gap-4">
      <section className="rounded border border-[#C79A54]/40 bg-[#102F38] p-5 text-white">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C79A54]">Integrated Metaphysics Engine</p>
            <h4 className="mt-3 text-3xl font-semibold">个人命理综合分析</h4>
            <p className="mt-3 text-sm leading-6 text-white/70">
              本报告把多套命理推演融成一份可执行的个人分析，重点拆解性格底层、当前阶段、关键问题、风险处理、通关方法与行动建议。
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["分析对象", `${input?.fullName || "用户"}｜${input?.gender || "未填"}｜${input?.birthDate || "未填生日"} ${input?.birthTime || ""}`],
              ["当前问题", meihuaInput?.specificQuestion || input?.specificQuestion || "当前关键决策"],
              ["分析重点", input ? integratedFocusLabels[input.focus] : "综合人生方向"]
            ].map(([title, desc]) => (
              <div key={title} className="rounded border border-white/15 bg-white/8 p-4">
                <p className="text-sm font-semibold text-[#E8D4A8]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-white/72">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">一、四术合参矩阵</h4>
          <div className="mt-4 grid gap-3">
            {systemMatrix.map(([label, value, desc]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-[#063F4A]">{label}</p>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#C79A54]">{value}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/62">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">二、专业判断流程</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {destinyChecklist.map(([label, desc], index) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C79A54]">Step {index + 1}</p>
                <p className="mt-2 font-semibold text-[#063F4A]">{label}</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-sm leading-6 text-ink/65">
            本报告不是单一术数的碎片解读，而是先看底层命格，再看阶段触发，最后落到现实行动。重点是帮助你知道“现在该做什么、不该做什么、何时再推进”。
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">财富六维体检</h4>
            <span className="rounded bg-[#DDEFF2] px-3 py-1 text-xs font-semibold text-[#063F4A]">Radar Preview</span>
          </div>
          <div className="mt-4 grid gap-3">
            {wealthRadar.map(([label, value, desc]) => (
              <div key={label} className="grid gap-2 rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 sm:grid-cols-[96px_1fr_42px] sm:items-center">
                <p className="font-semibold text-[#063F4A]">{label}</p>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[#C79A54]" style={{ width: `${value}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-ink/50">{desc}</p>
                </div>
                <p className="text-right text-lg font-semibold text-[#063F4A]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
            <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">财运红黑榜</h4>
            <div className="mt-4 grid gap-3">
              {timingBoard.map(([label, window, desc]) => (
                <div key={label} className="rounded border border-[#C79A54]/20 bg-[#fffaf0] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#063F4A]">{label}</p>
                    <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#C79A54]">{window}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
            <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">贵人与防小人指南</h4>
            <div className="mt-4 grid gap-3">
              {peopleGuide.map(([label, desc]) => (
                <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                  <p className="font-semibold text-[#063F4A]">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["三、命格总论", "读取个人底层性格、优势、弱点与人生主线，判断适合用什么方式累积成果。"],
          ["四、阶段判断", "判断当前处于扩张、整理、等待、转向或修复状态，避免误用力。"],
          ["五、关键问题", `围绕「${meihuaInput?.specificQuestion || input?.specificQuestion || "当前关键决策"}」拆解现状、阻力与下一步。`],
          ["六、通关方法", "提供颜色、方位、空间整理、日常行为与心法建议，把分析转成行动。"],
          ["七、危机处理", "给出遇到冲突、破财、误判、情绪波动时的处理步骤。"],
          ["八、产品仪式", "结合九运香、水晶、五行饰品、办公室布局或课程咨询，给出克制建议。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#063F4A]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4">
          <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">九、综合评分</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {scoreRows.map(([label, score]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 text-center">
                <p className="text-3xl font-semibold text-[#063F4A]">{score}</p>
                <p className="mt-1 text-xs text-ink/55">{label}</p>
              </div>
            ))}
          </div>
          </div>
          {actionGroups.length > 0 ? (
            <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
              <h4 className="rounded bg-[#C79A54] px-4 py-2 font-semibold text-[#102F38]">十、行动清单</h4>
              <div className="mt-4 grid gap-3">
                {actionGroups.map(([label, items]) => (
                  <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                    <p className="font-semibold text-[#063F4A]">{label}</p>
                    <ul className="mt-2 grid gap-1 text-sm leading-6 text-ink/62">
                      {items.slice(0, 4).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">十一、完整个人分析与建议</h4>
          <div className="mt-4 grid gap-4">
            {normalizedReportContent(report).sections.map((section) => (
              <div key={section.title} className="rounded border-l-4 border-[#C79A54] bg-[#F5FAFA] p-4">
                <p className="text-lg font-semibold text-[#063F4A]">{section.title}</p>
                <div className="mt-3 grid gap-2">
                  {formatStructuredReportContent(section.content).map((line, index) => {
                    const match = line.match(/^(【[^】]+】)(.*)$/);

                    return (
                      <p key={`${section.title}-${index}`} className="text-sm leading-7 text-ink/68">
                        {match ? (
                          <>
                            <span className="font-semibold text-[#7A1F16]">{match[1]}</span>
                            {match[2]}
                          </>
                        ) : (
                          line
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-xs leading-5 text-ink/60">
            本综合报告为传统命理、易学与数字命理的文化参考和自我规划工具，不构成金融、法律、医疗或其他专业建议。
          </p>
        </div>
      </section>
    </div>
  );
}

function ZiweiReportPanel({ report }: { report: SavedReport }) {
  const input = report.metadata?.ziweiInput;
  const reportContent = normalizedReportContent(report);
  const calendar = getMingliCalendar(input?.birthDate, input?.birthTime, input?.calendarType || "Gregorian");
  const chart = report.metadata?.ziweiChart;
  const palaceRows = chart?.palaces?.length ? chart.palaces : getZiweiPalaceRows(input);
  const luckRows = chart?.palaces?.length
    ? chart.palaces
        .slice()
        .sort((a, b) => {
          const first = Number(String(a.age).split("-")[0]);
          const next = Number(String(b.age).split("-")[0]);
          return (Number.isFinite(first) ? first : 999) - (Number.isFinite(next) ? next : 999);
        })
        .map((palace) => [palace.age, palace.palaceName, palace.stars, palace.summary])
    : getZiweiLuckRows(input);
  const annualRows = getZiweiAnnualRows(input).map((row, index) => {
    const palace = chart?.currentHoroscope?.[index]?.palaceName?.replace(/^大/, "");
    return palace ? { ...row, palace } : row;
  });
  const scoreRows = getZiweiScoreRows();
  const palaceByBranch = (branch: string) => palaceRows.find((row) => row.branch === branch) || palaceRows[0];
  const chartPalaceRows = ["巳", "午", "未", "申", "辰", "酉", "卯", "戌", "寅", "丑", "子", "亥"].map(palaceByBranch);
  const findPalace = (keyword: string) => palaceRows.find((row) => row.palaceName.includes(keyword));
  const keyPalaceCards = [
    { title: "命宫核心", badge: "人格底盘", palace: findPalace("命宫"), note: "看自我定位、判断方式、格局强弱与长期人生主轴。" },
    { title: "官禄宫", badge: "事业路径", palace: findPalace("官禄"), note: "看职业定位、工作方式、领导潜力与适合经营的赛道。" },
    { title: "财帛宫", badge: "财富模式", palace: findPalace("财帛"), note: "看收入结构、现金流、守财能力和资源变现方式。" },
    { title: "夫妻宫", badge: "关系合作", palace: findPalace("夫妻"), note: "看亲密关系、长期合作、沟通节奏与承诺模式。" },
    { title: "疾厄宫", badge: "身心节律", palace: findPalace("疾厄"), note: "看压力来源、作息提醒和生活习惯风险，不作医疗判断。" },
    { title: "福德宫", badge: "内在能量", palace: findPalace("福德"), note: "看精神状态、抗压能力、内在满足与福气来源。" }
  ];
  const structuredSections = reportContent.sections.length ? reportContent.sections : [];
  const renderReportParagraphs = (content: string) =>
    content
      .split(/(?=【(?:盘面依据|白话判断|优势|潜在卡点|警示|行动|红榜|黑榜|节奏|风水调理|色彩建议|仪式建议)】)/)
      .filter(Boolean)
      .map((paragraph) => {
        const isAction = paragraph.startsWith("【行动】") || paragraph.startsWith("【风水调理】") || paragraph.startsWith("【仪式建议】");
        const isWarning = paragraph.startsWith("【警示】") || paragraph.startsWith("【黑榜】");
        const isBasis = paragraph.startsWith("【盘面依据】");
        const toneClass = isAction
          ? "border-[#C79A54]/25 bg-[#FBF7EE] text-ink/72"
          : isWarning
            ? "border-[#7A1F16]/20 bg-[#FFF7F4] text-[#7A1F16]"
            : isBasis
              ? "border-[#3B1B66]/15 bg-[#F7F4FF] text-[#3B1B66]"
              : "border-transparent bg-transparent text-ink/68";

        return (
          <p key={paragraph} className={`rounded border px-3 py-2 text-sm leading-7 ${toneClass}`}>
            {paragraph}
          </p>
        );
      });
  const renderPalaceCell = (row: (typeof palaceRows)[number], index: number) => (
    <div key={`${row.palace}-${index}`} className="min-h-44 border border-[#C79A54]/25 bg-white p-3 text-sm shadow-[inset_0_0_0_1px_rgba(199,154,84,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-[#3B1B66]">{row.palace}</p>
          <p className="mt-1 text-xs font-semibold text-[#C79A54]">{row.age}</p>
        </div>
        <span className="rounded bg-[#3B1B66]/8 px-2 py-1 text-[11px] font-semibold text-[#3B1B66]">{row.transform}</span>
      </div>
      <p className="mt-3 text-lg font-semibold leading-6 text-[#7A1F16]">{row.stars}</p>
      <p className="mt-2 text-xs leading-5 text-ink/55">辅曜：{row.minor}</p>
      {row.flying?.length ? <p className="mt-2 text-[11px] leading-5 text-[#3B1B66]/70">飞化：{row.flying.slice(0, 4).join(" · ")}</p> : null}
      <p className="mt-2 text-xs leading-5 text-ink/60">{row.summary}</p>
    </div>
  );

  return (
    <div className="grid gap-4">
      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">一、命盘基础资料</h4>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              {[
                ["命宫", chart?.mainPalaceBranch ? `${chart.mainPalaceBranch}宫` : calendar?.mingGong || "待排盘"],
                ["身宫", chart?.bodyPalaceBranch ? `${chart.bodyPalaceBranch}宫` : calendar?.shenGong || "待排盘"],
                ["五行局", chart?.fiveElementName || calendar?.mingGongNaYin || "待校准"],
                ["阴阳性别", input?.gender === "女" ? "阴女" : "阳男"],
                ["四柱", calendar?.fourPillarsText || "待排盘"],
                ["日主", calendar?.dayMaster || "待排盘"],
                ["紫微落宫", chart?.ziweiBranch ? `${chart.ziweiBranch}宫` : "待校准"],
                ["重点", input ? ziweiFocusLabels[input.focus] : "综合命盘"]
              ].map(([label, value]) => (
                <p key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                  <span className="text-ink/52">{label}</span>
                  <span className="ml-2 font-semibold text-[#3B1B66]">{value}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="grid place-items-center rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-5 text-center">
            <p className="text-7xl text-[#3B1B66]">✦</p>
            <p className="mt-3 text-2xl font-semibold text-[#3B1B66]">紫微星曜 · 洞悉天命</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink/60">以十二宫为人生数据桶，读取命宫、身宫、官禄、财帛、夫妻与流年触发，转化为可执行的人生规划。</p>
          </div>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">二、十二宫命盘</h4>
        <div className="mt-4 rounded border border-[#C79A54]/35 bg-[#FBF7EE] p-3">
          <div className="mb-3 grid gap-2 text-xs font-semibold text-[#3B1B66] sm:grid-cols-4">
            {["正南方", "南偏西", "正西方", "北偏西"].map((direction) => (
              <span key={direction} className="rounded bg-white px-3 py-2 text-center">{direction}</span>
            ))}
          </div>
          <div className="grid overflow-hidden rounded border border-[#C79A54]/45 md:grid-cols-4">
            {chartPalaceRows.slice(0, 4).map(renderPalaceCell)}
            {renderPalaceCell(chartPalaceRows[4], 4)}
            <div className="grid min-h-72 place-items-center border border-[#C79A54]/25 bg-gradient-to-br from-white via-[#FBF7EE] to-[#EFE6FF] p-5 text-center md:col-span-2 md:row-span-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C79A54]">Zi Wei Core</p>
                <h5 className="mt-3 text-2xl font-semibold text-[#3B1B66]">{input?.fullName || reportSubjectName(report)}</h5>
                <div className="mx-auto mt-4 grid max-w-md gap-2 text-sm text-ink/65 sm:grid-cols-2">
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">命宫：{chart?.mainPalaceBranch ? `${chart.mainPalaceBranch}宫` : calendar?.mingGong || "待排盘"}</span>
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">身宫：{chart?.bodyPalaceBranch ? `${chart.bodyPalaceBranch}宫` : calendar?.shenGong || "待排盘"}</span>
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">日主：{calendar?.dayMaster || "待排盘"}</span>
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">生肖：{calendar?.zodiac || "待排盘"}</span>
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">五行局：{chart?.fiveElementName || "待校准"}</span>
                  <span className="rounded border border-[#C79A54]/20 bg-white p-2">重点：{input ? ziweiFocusLabels[input.focus] : "综合命盘"}</span>
                </div>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-ink/62">
                  十二宫以命宫为主轴，交叉读取官禄、财帛、夫妻、疾厄与福德宫。中心信息用于校准个人格局，外围宫位用于判断人生领域的强弱与流年触发点。
                </p>
              </div>
            </div>
            {renderPalaceCell(chartPalaceRows[5], 5)}
            {renderPalaceCell(chartPalaceRows[6], 6)}
            {renderPalaceCell(chartPalaceRows[7], 7)}
            {chartPalaceRows.slice(8, 12).map(renderPalaceCell)}
          </div>
          <p className="mt-3 rounded bg-white p-3 text-xs leading-5 text-ink/55">
            注：{chart?.chartNotes || "当前已接入真实万年历与八字基础引擎，命宫/身宫依据出生资料换算。主星、辅星与四化层已模块化。"} 报告用于文化参考与自我规划，不构成专业建议。
          </p>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">三、关键宫位专业拆解</h4>
            <p className="mt-3 text-sm leading-6 text-ink/58">以下内容直接读取本盘十二宫星曜与四化，不使用固定示例文案。</p>
          </div>
          <span className="rounded bg-[#EFE6FF] px-3 py-2 text-xs font-semibold text-[#3B1B66]">{chart?.engine ? "真实排盘" : "基础预览"}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {keyPalaceCards.map(({ title, badge, palace, note }) => (
            <article key={title} className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C79A54]">{badge}</p>
                  <h5 className="mt-2 text-lg font-semibold text-[#3B1B66]">{title}</h5>
                </div>
                <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#3B1B66]">{palace?.branch || "待"}</span>
              </div>
              <div className="mt-4 rounded border border-white bg-white/85 p-3">
                <p className="text-sm font-semibold text-[#7A1F16]">{palace?.stars || "星曜待排盘"}</p>
                <p className="mt-1 text-xs leading-5 text-ink/55">辅曜：{palace?.minor || "待会照"} · 四化：{palace?.transform || "平"}</p>
                {palace?.flying?.length ? <p className="mt-1 text-xs leading-5 text-[#3B1B66]/70">飞化：{palace.flying.slice(0, 4).join(" · ")}</p> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/65">{palace?.summary || note}</p>
              <p className="mt-3 rounded bg-white px-3 py-2 text-xs leading-5 text-ink/52">{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <div className="overflow-hidden rounded border border-[#C79A54]/40 bg-[#FFFDF7]">
          <div className="grid gap-5 bg-[#3B1B66] p-5 text-white lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C79A54]">Zi Wei Strategy Report</p>
              <h4 className="mt-3 text-3xl font-semibold">四、AI 逐宫策略解读</h4>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">
                以下 10 节根据本盘十二宫、星曜、四化与大限节奏整理，采用“盘面依据 → 白话判断 → 风险警示 → 行动清单”的正式报告结构。
              </p>
            </div>
            <div className="rounded border border-white/15 bg-white/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C79A54]">Report Index</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {structuredSections.slice(0, 10).map((section, index) => (
                  <span key={`${section.title}-index`} className="rounded bg-white/10 px-3 py-2 text-white/78">
                    {String(index + 1).padStart(2, "0")} · {section.title.replace(/^[一二三四五六七八九十]+、/, "")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {structuredSections[0] ? (
            <article className="border-b border-[#C79A54]/25 bg-[#FBF7EE] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C79A54]">Core Reading</p>
                  <h5 className="mt-2 text-2xl font-semibold text-[#3B1B66]">{structuredSections[0].title}</h5>
                </div>
                <span className="rounded-full border border-[#C79A54]/40 bg-white px-4 py-2 text-xs font-semibold text-[#3B1B66]">命盘主轴</span>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">{renderReportParagraphs(structuredSections[0].content)}</div>
            </article>
          ) : null}

          <div className="grid gap-0 lg:grid-cols-2">
            {structuredSections.slice(1).map((section, index) => {
              const sectionNo = index + 2;
              const isWide = sectionNo === 8 || sectionNo === 9 || sectionNo === 10;

              return (
                <article
                  key={`${section.title}-${index}`}
                  className={`border-b border-[#C79A54]/20 p-5 ${isWide ? "lg:col-span-2" : index % 2 === 0 ? "lg:border-r lg:border-[#C79A54]/20" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-[#3B1B66] text-sm font-semibold text-white shadow-sm">
                      {String(sectionNo).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C79A54]">Palace Analysis</p>
                      <h5 className="mt-1 text-xl font-semibold text-[#3B1B66]">{section.title}</h5>
                    </div>
                  </div>
                  <div className={`mt-4 grid gap-2 ${isWide ? "lg:grid-cols-2" : ""}`}>{renderReportParagraphs(section.content)}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["专业依据", `${chart?.chartNotes || "真实万年历与紫微排盘资料会写入报告 metadata，供报告中心复查。"} 报告不再依赖固定假星曜。`],
          ["阅读顺序", "先看命宫定人格，再看官禄与财帛定事业财务，最后看夫妻、疾厄、福德与大限节奏。"],
          ["使用提醒", "紫微报告适合做长期规划和自我觉察；重大投资、医疗、法律事项仍应咨询对应专业人士。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#3B1B66]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">五、大限运势表</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#3B1B66]">
              <tr>{["年龄", "宫位", "主星", "运势简评"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {luckRows.map((row) => (
                <tr key={row.join("-")}>{row.map((cell) => <td key={cell} className="px-3 py-2 text-ink/65">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">六、未来十年流年</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#3B1B66]">
              <tr>{["年份", "触发宫位", "主题", "事业", "财运", "感情", "提醒"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {annualRows.map((row) => (
                <tr key={row.year}>
                  <td className="px-3 py-2 font-semibold">{row.year}</td>
                  <td className="px-3 py-2 text-[#3B1B66]">{row.palace}</td>
                  <td className="px-3 py-2">{row.theme}</td>
                  <td className="px-3 py-2 text-ink/65">{row.career}</td>
                  <td className="px-3 py-2 text-ink/65">{row.wealth}</td>
                  <td className="px-3 py-2 text-ink/65">{row.relationship}</td>
                  <td className="px-3 py-2 text-ink/65">{row.reminder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">七、评分摘要</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {scoreRows.map(([label, score]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 text-center">
                <p className="text-3xl font-semibold text-[#3B1B66]">{score}</p>
                <p className="mt-1 text-xs text-ink/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">八、重点星曜与建议</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["紫微", "格局、领导、责任，适合做长期品牌。"],
              ["天府", "资源库、稳定、财库，利资产与管理。"],
              ["武曲", "执行与财务纪律，适合正财累积。"],
              ["贪狼", "人缘与创意，需防过度应酬。"],
              ["幸运色", "紫色、金色、米白。"],
              ["幸运方向", "西北、东南、北方。"],
              ["幸运数字", "5、6、8。"],
              ["风水建议", "办公桌后方宜稳，文件区分明，财务资料不可杂乱。"]
            ].map(([label, content]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                <p className="font-semibold text-[#3B1B66]">{label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/65">{content}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-xs leading-5 text-ink/60">{ziweiDisclaimer}</p>
        </div>
      </section>
    </div>
  );
}

function MeihuaReportPanel({ report }: { report: SavedReport }) {
  const input = report.metadata?.meihuaInput;
  const scoreRows = getMeihuaScoreRows();
  const question = input?.specificQuestion || "当前问题";
  const modeLabel = input?.mode === "random" ? "随机数字起卦" : "时间起卦";

  return (
    <div className="grid gap-4">
      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr_0.8fr]">
          <div>
            <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">一、起卦说明</h4>
            <div className="mt-3 space-y-2 text-sm leading-6 text-ink/65">
              <p>起卦方式：{modeLabel}</p>
              <p>数字：{input?.manualNumbers || "系统按时间取数"}</p>
              <p>起卦时间：{input?.divinationDateTime || "当前时间"}</p>
              <p>问题类别：{input ? meihuaCategoryLabels[input.questionCategory] : "综合"}</p>
            </div>
          </div>
          <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-4 text-center">
            <p className="text-6xl text-[#063F4A]">☯</p>
            <p className="mt-3 text-lg font-semibold text-[#7A1F16]">本卦：天地否 · 变卦：地山谦</p>
            <p className="mt-2 text-sm leading-6 text-ink/60">上卦乾，下卦坤，动爻上六。先闭塞后转谦，宜以柔化刚，等待时机。</p>
          </div>
          <div className="rounded border border-[#C79A54]/25 bg-white p-4">
            <p className="font-semibold text-[#063F4A]">占问事项</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{question}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">二、本卦 · 当前局势</h4>
          <HexagramLines lines={getMeihuaHexagramLines("main")} />
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="rounded bg-[#F5FAFA] p-3">上卦：乾（金）</p>
            <p className="rounded bg-[#F5FAFA] p-3">下卦：坤（土）</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">天地否象，主上下不交、沟通未通。当前宜先守住节奏，厘清事实和资源，不宜急于硬推。</p>
        </article>
        <article className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">三、变卦 · 未来趋势</h4>
          <HexagramLines lines={getMeihuaHexagramLines("change")} />
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p className="rounded bg-[#F5FAFA] p-3">上卦：坤（土）</p>
            <p className="rounded bg-[#F5FAFA] p-3">下卦：艮（土）</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/65">地山谦象，未来靠降低姿态、稳住承诺、逐步推进而得转机。越急越堵，越稳越通。</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["四、动爻解读", "动爻在上六，代表事情已经到达一个必须调整表达方式的位置。转折不在硬冲，而在改变姿态与沟通角度。"],
          ["五、五行生克", "本卦金土重，变卦土气更稳。土生金，利规则、凭证、流程；忌火气过盛导致急躁。喜用木水疏通。"],
          ["六、体用分析", "体卦为坤土，用卦为乾金。用生体，外部资源可用，但需你先承接、整理、定边界。"],
          ["七、时机预测", "短线宜先整理，3-7 天内适合沟通确认，15-30 天内可进入下一步执行窗口。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#7A1F16]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">八、综合解读</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {normalizedReportContent(report).sections.map((section) => (
            <div key={section.title} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-4">
              <p className="font-semibold text-[#063F4A]">{section.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink/62">{section.content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">九、评分摘要</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {scoreRows.map(([label, score]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3 text-center">
                <p className="text-3xl font-semibold text-[#063F4A]">{score}</p>
                <p className="mt-1 text-xs text-ink/55">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">十、方位颜色与行动建议</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["吉方", "东南、北方；利沟通、学习、复盘。"],
              ["忌方", "正南；火气旺时容易急躁。"],
              ["幸运色", "青色、蓝色、金色。"],
              ["避免色", "过多红色、强烈橙色。"],
              ["现在要做", "整理证据、确认目标、约定下一步时间。"],
              ["暂时避免", "冲动签约、夜间决策、口头承诺过多。"]
            ].map(([label, content]) => (
              <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                <p className="font-semibold text-[#063F4A]">{label}</p>
                <p className="mt-1 text-sm leading-6 text-ink/65">{content}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded bg-[#fff4d6] p-3 text-xs leading-5 text-ink/60">{meihuaDisclaimer}</p>
        </div>
      </section>
    </div>
  );
}

function FullReportView({ report, memberProfile, onClose }: { report: SavedReport; memberProfile: MemberProfile; onClose: () => void }) {
  const template = reportTemplateType(report);
  const baziInput = report.metadata?.baziInput;
  const meihuaInput = report.metadata?.meihuaInput;
  const ziweiInput = report.metadata?.ziweiInput;
  const numerologyInput = report.metadata?.numerologyInput;
  const integratedInput = report.metadata?.integratedInput;
  const displayName = baziInput?.fullName && baziInput.fullName !== "未填写" ? baziInput.fullName : memberProfile.name;
  const displayGender = baziInput?.gender && baziInput.gender !== "未填写" ? baziInput.gender : memberProfile.gender;
  const displayBirthDate = preferProfileDate(baziInput?.birthDate || "", memberProfile.birthDate);
  const displayBirthTime = preferProfileTime(baziInput?.birthTime || "", memberProfile.birthTime || memberProfile.birthTimeLabel);
  const displayBirthLocation = baziInput?.birthLocation || memberProfile.region;
  const headerName = meihuaInput?.fullName || displayName;
  const headerGender = meihuaInput?.gender || displayGender;
  const headerBirthDate = preferProfileDate(meihuaInput?.birthDate || displayBirthDate, memberProfile.birthDate);
  const headerBirthTime = preferProfileTime(meihuaInput?.birthTime || displayBirthTime, memberProfile.birthTime || memberProfile.birthTimeLabel);
  const headerBirthLocation = meihuaInput?.birthLocation || displayBirthLocation;
  const finalName = numerologyInput?.fullName || ziweiInput?.fullName || headerName;
  const finalGender = numerologyInput?.gender || ziweiInput?.gender || headerGender;
  const finalBirthDate = preferProfileDate(numerologyInput?.birthDate || ziweiInput?.birthDate || integratedInput?.birthDate || headerBirthDate, memberProfile.birthDate);
  const finalBirthTime = preferProfileTime(numerologyInput?.birthTime || ziweiInput?.birthTime || integratedInput?.birthTime || headerBirthTime, memberProfile.birthTime || memberProfile.birthTimeLabel);
  const finalBirthLocation = ziweiInput?.birthLocation || headerBirthLocation;
  const finalCalendarType = baziInput?.calendarType || ziweiInput?.calendarType || integratedInput?.calendarType || "Gregorian";
  const finalLunarDate =
    integratedInput?.lunarDate ||
    baziInput?.lunarDate ||
    ziweiInput?.lunarDate ||
    meihuaInput?.lunarDate ||
    numerologyInput?.lunarDate ||
    getAutoLunarDate(finalBirthDate, finalBirthTime, finalCalendarType);
  const finalHourBranch =
    integratedInput?.birthHourBranch ||
    baziInput?.birthHourBranch ||
    ziweiInput?.birthHourBranch ||
    meihuaInput?.birthHourBranch ||
    numerologyInput?.birthHourBranch ||
    getChineseHourBranch(finalBirthTime);
  const reportHeading = report.title.includes("完整报告") ? report.title : `${report.title} 完整报告`;
  const executiveSummary = reportExecutiveSummary(report);
  const professionalMetrics = reportProfessionalMetrics(report);
  const tableOfContents = reportTableOfContents(report);
  const keyConclusionCards = reportKeyConclusionCards(report);
  const sevenDayPlan = reportSevenDayPlan(report);
  const riskRadar = reportRiskRadar(report);
  const decisionChecklist = reportDecisionChecklist(report);
  const solutionStack = reportSolutionStack(report);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0A0A]/70 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="no-print sticky top-3 z-10 mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-[#063F4A] p-3 text-white shadow-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Paid Report Preview</p>
            <h3 className="mt-1 text-xl font-semibold">{report.title} · {template}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded bg-white/10 px-3 py-2 text-sm font-semibold">Desktop / Mobile Preview</span>
            <button type="button" onClick={() => window.print()} className="rounded bg-white/10 px-3 py-2 text-sm font-semibold">导出 PDF</button>
            <button type="button" onClick={() => downloadReportSvg(report, memberProfile)} className="rounded bg-[#C79A54] px-3 py-2 text-sm font-semibold text-[#063F4A]">下载 SVG</button>
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded bg-white/10" aria-label="关闭报告">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <article
          className="report-print-area rounded border-4 border-[#C79A54] bg-[#fffaf0] p-5 text-[#102F38] shadow-2xl md:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 8%, rgba(199,154,84,.12), transparent 26%), radial-gradient(circle at 88% 12%, rgba(6,63,74,.08), transparent 25%), linear-gradient(135deg, rgba(255,255,255,.72), rgba(255,250,240,.92))"
          }}
        >
          <header className="grid gap-5 border-b-2 border-[#C79A54]/45 pb-5 md:grid-cols-[0.72fr_1.15fr_0.78fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C79A54]">AI Feng Shui Master</p>
              <h1 className="mt-3 text-5xl font-semibold leading-tight text-[#063F4A]">{finalName}</h1>
              <p className="mt-3 text-sm leading-6 text-ink/55">专业命理合参 · 趋势判断 · 行动建议</p>
            </div>
            <div className="text-sm leading-7">
              <h2 className="text-center text-4xl font-semibold tracking-[0.12em] text-[#063F4A]">{reportHeading}</h2>
              <div className="mt-4 grid gap-1 rounded border border-[#C79A54]/25 bg-white/70 p-4">
                <p>公历：{finalBirthDate || "未填写"}　{finalBirthTime || "未填写"}　{finalHourBranch}</p>
                <p>农历：{finalLunarDate}</p>
                <p>性别：{finalGender}　地区：{finalBirthLocation}</p>
                {meihuaInput ? <p>起卦：{meihuaInput.divinationDateTime}　问题：{meihuaInput.specificQuestion}</p> : null}
                <p>Email：{memberProfile.email}</p>
                <p>生成时间：{report.createdAt}　消耗：{report.points} 点</p>
              </div>
            </div>
            <div className="rounded border border-[#C79A54]/25 bg-white/70 p-4 text-sm leading-6">
              <p className="font-semibold text-[#063F4A]">命理格言</p>
              <p className="mt-2 text-ink/65">命由天定，运由己造。知命而乐，修身而行，趋吉避凶，福慧双修。</p>
            </div>
          </header>

          <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded border border-[#C79A54]/35 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-[#063F4A]">报告核心摘要</h3>
                <span className="rounded bg-[#C79A54]/18 px-3 py-1 text-xs font-semibold text-[#063F4A]">Professional Reading</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {executiveSummary.map(([label, content]) => (
                  <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C79A54]">{label}</p>
                    <p className="mt-2 line-clamp-5 text-sm leading-6 text-ink/68">{content}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-[#C79A54]/35 bg-[#063F4A] p-4 text-white">
              <h3 className="text-xl font-semibold">命理指标</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {professionalMetrics.map(([label, score]) => (
                  <div key={label} className="rounded border border-white/10 bg-white/8 p-3">
                    <p className="text-xs text-white/50">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#E8D4A8]">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="rounded border border-[#C79A54]/35 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-[#063F4A]">报告目录</h3>
                <span className="rounded bg-[#F5FAFA] px-3 py-1 text-xs font-semibold text-ink/55">阅读路径</span>
              </div>
              <div className="mt-4 grid gap-2">
                {tableOfContents.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex items-center gap-3 rounded border border-[#C79A54]/18 bg-[#F5FAFA] px-3 py-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#063F4A] text-xs font-semibold text-white">{index + 1}</span>
                    <span className="text-sm font-semibold text-[#063F4A]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-[#C79A54]/35 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-[#063F4A]">重点结论页</h3>
                <span className="rounded bg-[#C79A54]/18 px-3 py-1 text-xs font-semibold text-[#063F4A]">先看结论，再看细节</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {keyConclusionCards.map(([label, content]) => (
                  <div key={label} className="rounded border-l-4 border-[#C79A54] bg-[#F5FAFA] p-4">
                    <p className="text-sm font-semibold text-[#7A1F16]">{label}</p>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-ink/68">{content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded border border-[#C79A54]/35 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#063F4A]">7 日通关计划</h3>
              <span className="rounded bg-[#fff4d6] px-3 py-1 text-xs font-semibold text-[#7A1F16]">把建议变成每天可做的动作</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {sevenDayPlan.map(([day, title, content]) => (
                <div key={day} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C79A54]">{day}</p>
                  <p className="mt-2 font-semibold text-[#063F4A]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-ink/60">{content}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded border border-[#C79A54]/35 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-[#063F4A]">风险雷达</h3>
                <span className="rounded bg-[#7A1F16] px-3 py-1 text-xs font-semibold text-white">先避凶，再取势</span>
              </div>
              <div className="mt-4 grid gap-3">
                {riskRadar.map(([label, level, content]) => (
                  <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#063F4A]">{label}</p>
                      <span className="rounded bg-[#fff4d6] px-2 py-1 text-xs font-semibold text-[#7A1F16]">风险 {level}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{content}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded border border-[#C79A54]/35 bg-[#063F4A] p-4 text-white">
              <h3 className="text-xl font-semibold">行动优先级</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {decisionChecklist.map(([label, content]) => (
                  <div key={label} className="rounded border border-white/10 bg-white/8 p-4">
                    <p className="text-sm font-semibold text-[#E8D4A8]">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">{content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded border border-[#C79A54]/35 bg-white/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#063F4A]">开运解决方案</h3>
              <span className="rounded bg-[#C79A54]/18 px-3 py-1 text-xs font-semibold text-[#063F4A]">空间 · 颜色 · 仪式 · 产品 · 咨询</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {solutionStack.map(([label, content]) => (
                <div key={label} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-3">
                  <p className="font-semibold text-[#7A1F16]">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-ink/62">{content}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-5">
            {template === "八字命理" ? <BaziReportPanel report={report} memberProfile={memberProfile} /> : null}
            {template === "综合命理" ? <IntegratedReportPanel report={report} /> : null}
            {template === "数字命理" ? <NumerologyReportPanel report={report} /> : null}
            {template === "紫微斗数" ? <ZiweiReportPanel report={report} /> : null}
            {template === "梅花易数" ? <MeihuaReportPanel report={report} /> : null}
          </div>

          <footer className="mt-5 border-t border-[#C79A54]/35 pt-4 text-center text-xs leading-5 text-ink/50">
            注：本报告基于传统命理学理与 AI 辅助分析，仅供文化参考、自我觉察与个人规划，不构成金融、法律、医疗或其他专业建议。
          </footer>
        </article>
      </div>
    </div>
  );
}

function CreditPreview({ points, cost, message }: { points: number; cost: number; message: string }) {
  const enough = points >= cost;

  return (
    <div className="mt-3 grid gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-3 text-xs leading-5 md:grid-cols-3">
      <span className="font-semibold text-[#063F4A]">当前：{points.toLocaleString("en-US")} 点</span>
      <span className="font-semibold text-[#7A1F16]">本次扣点：{cost.toLocaleString("en-US")} 点</span>
      <span className={enough ? "font-semibold text-[#063F4A]" : "font-semibold text-[#7A1F16]"}>
        生成后：{Math.max(points - cost, 0).toLocaleString("en-US")} 点
      </span>
      <span className={`md:col-span-3 ${enough ? "text-ink/55" : "font-semibold text-[#7A1F16]"}`}>{message}</span>
    </div>
  );
}

function WalletAndReports({
  currentTier,
  memberProfile,
  points,
  onCreditBalanceChange,
  reportPreset
}: {
  currentTier: MembershipTier;
  memberProfile: MemberProfile;
  points: number;
  onCreditBalanceChange: (nextBalance: number) => void;
  reportPreset?: ReportDemandPreset | null;
}) {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("生成后的报告会自动保存，之后可随时找回。");
  const [baziActionMessage, setBaziActionMessage] = useState("填写资料后即可生成，报告会自动保存。");
  const [isGeneratingBazi, setIsGeneratingBazi] = useState(false);
  const [baziInput, setBaziInput] = useState<BaziReportInput>(() => defaultBaziReportInput(memberProfile));
  const [meihuaActionMessage, setMeihuaActionMessage] = useState("输入问题后即可起卦生成完整报告。");
  const [isGeneratingMeihua, setIsGeneratingMeihua] = useState(false);
  const [meihuaInput, setMeihuaInput] = useState<MeihuaReportInput>(() => defaultMeihuaReportInput(memberProfile));
  const [ziweiActionMessage, setZiweiActionMessage] = useState("填写资料后即可生成紫微斗数命盘。");
  const [isGeneratingZiwei, setIsGeneratingZiwei] = useState(false);
  const [ziweiInput, setZiweiInput] = useState<ZiweiReportInput>(() => defaultZiweiReportInput(memberProfile));
  const [numerologyActionMessage, setNumerologyActionMessage] = useState("填写资料后即可生成数字命理完整报告。");
  const [isGeneratingNumerology, setIsGeneratingNumerology] = useState(false);
  const [numerologyInput, setNumerologyInput] = useState<NumerologyReportInput>(() => defaultNumerologyReportInput(memberProfile));
  const [integratedActionMessage, setIntegratedActionMessage] = useState("可使用已保存会员资料，也可以为客户临时填写一组新资料。");
  const [isGeneratingIntegrated, setIsGeneratingIntegrated] = useState(false);
  const [integratedInput, setIntegratedInput] = useState<IntegratedReportInput>(() => defaultIntegratedReportInput(memberProfile));
  const [isIntegratedFormOpen, setIsIntegratedFormOpen] = useState(false);
  const [savedSubjectProfiles, setSavedSubjectProfiles] = useState<ReportSubjectProfile[]>([]);
  const [selectedPaidReport, setSelectedPaidReport] = useState<"integrated" | "bazi" | "ziwei" | "meihua" | "numerology">("integrated");
  const [generatingReportTitle, setGeneratingReportTitle] = useState("");
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const strategicReportTitles = new Set(["流年报告", "开业择日报告", "公司风水初步分析报告"]);

  async function getMemberAccessToken() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return "";
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    return session?.access_token || "";
  }

  useEffect(() => {
    setBaziInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === emptyMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === emptyMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: preferProfileDate(current.birthDate, memberProfile.birthDate),
      birthTime: preferProfileTime(current.birthTime, memberProfile.birthTime),
      birthLocation: !current.birthLocation || current.birthLocation === emptyMemberProfile.region ? memberProfile.region : current.birthLocation,
      lunarDate: getAutoLunarDate(preferProfileDate(current.birthDate, memberProfile.birthDate), preferProfileTime(current.birthTime, memberProfile.birthTime), current.calendarType),
      birthHourBranch: getChineseHourBranch(preferProfileTime(current.birthTime, memberProfile.birthTime))
    }));
    setMeihuaInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === emptyMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === emptyMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: preferProfileDate(current.birthDate, memberProfile.birthDate),
      birthTime: preferProfileTime(current.birthTime, memberProfile.birthTime),
      birthLocation: !current.birthLocation || current.birthLocation === emptyMemberProfile.region ? memberProfile.region : current.birthLocation,
      lunarDate: getAutoLunarDate(preferProfileDate(current.birthDate, memberProfile.birthDate), preferProfileTime(current.birthTime, memberProfile.birthTime)),
      birthHourBranch: getChineseHourBranch(preferProfileTime(current.birthTime, memberProfile.birthTime))
    }));
    setZiweiInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === emptyMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === emptyMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: preferProfileDate(current.birthDate, memberProfile.birthDate),
      birthTime: preferProfileTime(current.birthTime, memberProfile.birthTime),
      birthLocation: !current.birthLocation || current.birthLocation === emptyMemberProfile.region ? memberProfile.region : current.birthLocation,
      lunarDate: getAutoLunarDate(preferProfileDate(current.birthDate, memberProfile.birthDate), preferProfileTime(current.birthTime, memberProfile.birthTime), current.calendarType),
      birthHourBranch: getChineseHourBranch(preferProfileTime(current.birthTime, memberProfile.birthTime))
    }));
    setNumerologyInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === emptyMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === emptyMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: preferProfileDate(current.birthDate, memberProfile.birthDate),
      birthTime: preferProfileTime(current.birthTime, memberProfile.birthTime),
      lunarDate: getAutoLunarDate(preferProfileDate(current.birthDate, memberProfile.birthDate), preferProfileTime(current.birthTime, memberProfile.birthTime)),
      birthHourBranch: getChineseHourBranch(preferProfileTime(current.birthTime, memberProfile.birthTime))
    }));
    setIntegratedInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === emptyMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === emptyMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: preferProfileDate(current.birthDate, memberProfile.birthDate),
      birthTime: preferProfileTime(current.birthTime, memberProfile.birthTime),
      birthLocation: !current.birthLocation || current.birthLocation === emptyMemberProfile.region ? memberProfile.region : current.birthLocation,
      lunarDate: getAutoLunarDate(preferProfileDate(current.birthDate, memberProfile.birthDate), preferProfileTime(current.birthTime, memberProfile.birthTime), current.calendarType),
      birthHourBranch: getChineseHourBranch(preferProfileTime(current.birthTime, memberProfile.birthTime))
    }));
  }, [memberProfile]);

  useEffect(() => {
    if (!reportPreset) {
      return;
    }

    setSelectedPaidReport("integrated");
    setIsIntegratedFormOpen(true);
    setIntegratedInput((current) => ({
      ...current,
      focus: reportPreset.focus,
      questionCategory: reportPreset.questionCategory,
      specificQuestion: reportPreset.specificQuestion,
      divinationDateTime: current.divinationDateTime || new Date().toISOString().slice(0, 16),
      mode: "time"
    }));
    setBaziInput((current) => ({ ...current, focus: reportPreset.focus }));
    setZiweiInput((current) => ({
      ...current,
      focus: reportPreset.focus === "yearly luck" ? "annual luck" : reportPreset.focus
    }));
    setMeihuaInput((current) => ({
      ...current,
      questionCategory: reportPreset.questionCategory,
      specificQuestion: reportPreset.specificQuestion,
      divinationDateTime: current.divinationDateTime || new Date().toISOString().slice(0, 16),
      mode: "time"
    }));
    setNumerologyInput((current) => ({
      ...current,
      focus:
        reportPreset.focus === "health"
          ? "personal growth"
          : reportPreset.focus === "yearly luck"
            ? "yearly luck"
            : reportPreset.focus
    }));
    setIntegratedActionMessage(reportPreset.message);
    setReportMessage(`${reportPreset.title} 已准备好，请确认资料后生成。`);
  }, [reportPreset]);

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

  useEffect(() => {
    const stored = window.localStorage.getItem(reportProfileStorageKey);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ReportSubjectProfile[];
      setSavedSubjectProfiles(parsed);
    } catch {
      window.localStorage.removeItem(reportProfileStorageKey);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCloudReports() {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!mounted || !data?.length) return;

      const cloudReports: SavedReport[] = data.map((report) => {
        const metaSection = report.sections.find((section) => section.title === "__metadata");
        let metadata: SavedReport["metadata"];

        try {
          metadata = metaSection ? (JSON.parse(metaSection.content) as SavedReport["metadata"]) : undefined;
        } catch {
          metadata = undefined;
        }

        return {
          id: report.id,
          title: report.title,
          tag: report.tag,
          points: report.points,
          createdAt: new Date(report.created_at).toLocaleString("zh-CN", { hour12: false }),
          summary: report.summary,
          metadata,
          sections: report.sections.filter((section) => section.title !== "__metadata")
        };
      });
      setSavedReports(cloudReports);
      setSelectedReport(cloudReports[0] || null);
      setReportMessage("已读取你的云端报告档案。");
    }

    loadCloudReports();

    return () => {
      mounted = false;
    };
  }, []);

  function isReportLocked(report: (typeof reportTypes)[number]) {
    if (report.title === "八字命理测算完整报告") {
      return false;
    }

    return currentTier === "free" || (currentTier === "tactical" && strategicReportTitles.has(report.title));
  }

  async function persistGeneratedReport(report: SavedReport, source: string, description: string, accessToken: string) {
    let response: Response;
    let payload: {
      error?: string;
      creditBalance?: number;
      report?: {
        id: string;
        created_at: string;
      };
    };

    try {
      response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          report,
          source,
          description
        })
      });
      payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        creditBalance?: number;
        report?: {
          id: string;
          created_at: string;
        };
      };
    } catch {
      setReportMessage("网络连接失败，报告未保存，本次不会扣点。");
      return null;
    }

    if (!response.ok) {
      setReportMessage(payload.error || "报告保存失败，本次不会扣点。");

      if (typeof payload.creditBalance === "number") {
        onCreditBalanceChange(payload.creditBalance);
      }

      return null;
    }

    if (typeof payload.creditBalance === "number") {
      onCreditBalanceChange(payload.creditBalance);
    }

    return {
      ...report,
      id: payload.report?.id || report.id,
      createdAt: payload.report?.created_at
        ? new Date(payload.report.created_at).toLocaleString("zh-CN", { hour12: false })
        : report.createdAt
    };
  }

  async function handleOpenReport(report: (typeof reportTypes)[number]) {
    if (report.title === "八字命理测算完整报告") {
      handleGenerateBaziReport();
      return;
    }

    if (report.title === "数字命理测算完整报告") {
      handleGenerateNumerologyReport();
      return;
    }

    if (isReportLocked(report)) {
      return;
    }

    if (generatingReportTitle) {
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < report.points) {
      setReportMessage("点数不足，请先充值点数后再生成报告。");
      return;
    }

    setGeneratingReportTitle(report.title);
    setReportMessage(`AI 正在用八字、紫微、梅花与数字命理生成${report.title}，请稍候。`);

    const subject = attachLunarFields(generalReportInputFromMember(report.title, memberProfile));
    const baziSubject: BaziReportInput = {
      fullName: subject.fullName,
      gender: subject.gender,
      birthDate: subject.birthDate,
      birthTime: subject.birthTime,
      birthLocation: subject.birthLocation,
      calendarType: subject.calendarType,
      lunarDate: subject.lunarDate,
      birthHourBranch: subject.birthHourBranch,
      focus: subject.focus
    };
    const ziweiSubject: ZiweiReportInput = {
      fullName: subject.fullName,
      gender: subject.gender,
      birthDate: subject.birthDate,
      birthTime: subject.birthTime,
      birthLocation: subject.birthLocation,
      calendarType: subject.calendarType,
      lunarDate: subject.lunarDate,
      birthHourBranch: subject.birthHourBranch,
      focus: subject.focus === "yearly luck" ? "annual luck" : subject.focus
    };
    const numerologySubject: NumerologyReportInput = {
      fullName: subject.fullName,
      gender: subject.gender,
      birthDate: subject.birthDate,
      birthTime: subject.birthTime,
      lunarDate: subject.lunarDate,
      birthHourBranch: subject.birthHourBranch,
      focus: subject.focus === "health" ? "personal growth" : subject.focus
    };
    const meihuaSubject: MeihuaReportInput = {
      fullName: subject.fullName,
      gender: subject.gender,
      birthDate: subject.birthDate,
      birthTime: subject.birthTime,
      birthLocation: subject.birthLocation,
      lunarDate: subject.lunarDate,
      birthHourBranch: subject.birthHourBranch,
      questionCategory: subject.questionCategory,
      specificQuestion: subject.specificQuestion,
      divinationDateTime: subject.divinationDateTime,
      manualNumbers: subject.manualNumbers,
      mode: subject.mode
    };

    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;

    try {
      const response = await fetch("/api/general-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reportTitle: report.title,
          reportTag: report.tag,
          points: report.points,
          subject
        })
      });
      const payload = (await response.json()) as Partial<Pick<SavedReport, "summary" | "sections">>;

      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = {
          summary: payload.summary,
          sections: payload.sections
        };
      }
    } catch {
      aiContent = undefined;
    }

    const baseReport = createSavedReport(report);
    const generated: SavedReport = {
      ...baseReport,
      summary: aiContent?.summary || baseReport.summary,
      sections: aiContent?.sections?.length ? aiContent.sections : baseReport.sections,
      metadata: {
        kind: "integrated_destiny",
        integratedInput: subject,
        baziInput: baziSubject,
        ziweiInput: ziweiSubject,
        meihuaInput: meihuaSubject,
        numerologyInput: numerologySubject
      }
    };
    const persistedReport = await persistGeneratedReport(generated, "report_generation", `生成${report.title}`, accessToken);

    if (!persistedReport) {
      setGeneratingReportTitle("");
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setReportMessage(`${report.title} 已按四术框架生成并保存，点数已完成扣减。`);
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setGeneratingReportTitle("");
  }

  async function handleGenerateBaziReport() {
    if (!baziInput.fullName || !baziInput.birthDate) {
      setBaziActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成八字命理完整报告。");
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setBaziActionMessage("登录状态已过期，请重新登录后再生成报告。");
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < baziReportCost) {
      setBaziActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${baziReportCost} 点。`);
      setReportMessage("点数不足，八字命理完整报告需要 380 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingBazi(true);
    setBaziActionMessage("AI 正在生成报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成八字命理完整报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;
    let baziAnalysis: BaziAnalysis | undefined;

    try {
      const response = await fetch("/api/bazi-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(attachLunarFields(baziInput))
      });
      const payload = await response.json();

      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = {
          summary: payload.summary,
          sections: payload.sections
        };
      }

      if (payload.analysis) {
        baziAnalysis = payload.analysis as BaziAnalysis;
      }
    } catch {
      aiContent = undefined;
      baziAnalysis = undefined;
    }

    const generated = createBaziDestinyReport(attachLunarFields(baziInput), aiContent, baziAnalysis);
    const persistedReport = await persistGeneratedReport(generated, "bazi_destiny_report", "生成八字命理测算完整报告", accessToken);

    if (!persistedReport) {
      setBaziActionMessage("报告保存或扣点失败，请稍后再试。");
      setIsGeneratingBazi(false);
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setBaziActionMessage("报告已生成、扣点并保存。");
    setReportMessage("八字命理测算完整报告已保存，之后可以在报告档案找回。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setIsGeneratingBazi(false);
  }

  async function handleGenerateMeihuaReport() {
    if (!meihuaInput.fullName || !meihuaInput.specificQuestion) {
      setMeihuaActionMessage("请先填写姓名与具体问题。");
      setReportMessage("请先填写姓名与具体问题，才能生成梅花易数完整报告。");
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setMeihuaActionMessage("登录状态已过期，请重新登录后再生成报告。");
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < meihuaReportCost) {
      setMeihuaActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${meihuaReportCost} 点。`);
      setReportMessage("点数不足，梅花易数完整报告需要 260 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingMeihua(true);
    setMeihuaActionMessage("AI 正在起卦生成报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成梅花易数完整报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;

    try {
      const response = await fetch("/api/meihua-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(attachLunarFields(meihuaInput))
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
    } catch {
      aiContent = undefined;
    }

    const generated = createMeihuaDivinationReport(attachLunarFields(meihuaInput), aiContent);
    const persistedReport = await persistGeneratedReport(generated, "meihua_divination_report", "生成梅花易数测算完整报告", accessToken);

    if (!persistedReport) {
      setMeihuaActionMessage("报告保存或扣点失败，请稍后再试。");
      setIsGeneratingMeihua(false);
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setMeihuaActionMessage("报告已生成、扣点并保存。");
    setReportMessage("梅花易数测算完整报告已保存，之后可以在报告档案找回。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setIsGeneratingMeihua(false);
  }

  async function handleGenerateZiweiReport() {
    if (!ziweiInput.fullName || !ziweiInput.birthDate) {
      setZiweiActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成紫微斗数命盘报告。");
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setZiweiActionMessage("登录状态已过期，请重新登录后再生成报告。");
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < ziweiReportCost) {
      setZiweiActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${ziweiReportCost} 点。`);
      setReportMessage("点数不足，紫微斗数命盘报告需要 420 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingZiwei(true);
    setZiweiActionMessage("AI 正在排盘生成报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成紫微斗数命盘详细解析报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;
    let ziweiChart: ZiweiChartSnapshot | undefined;

    try {
      const response = await fetch("/api/ziwei-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(attachLunarFields(ziweiInput))
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
      if (payload.chart) {
        ziweiChart = payload.chart;
      }
    } catch {
      aiContent = undefined;
    }

    const generated = createZiweiDestinyReport(attachLunarFields(ziweiInput), aiContent, ziweiChart);
    const persistedReport = await persistGeneratedReport(generated, "ziwei_destiny_report", "生成紫微斗数命盘详细解析报告", accessToken);

    if (!persistedReport) {
      setZiweiActionMessage("报告保存或扣点失败，请稍后再试。");
      setIsGeneratingZiwei(false);
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setZiweiActionMessage("报告已生成、扣点并保存。");
    setReportMessage("紫微斗数命盘详细解析报告已保存，之后可以在报告档案找回。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setIsGeneratingZiwei(false);
  }

  async function handleGenerateNumerologyReport() {
    if (!numerologyInput.fullName || !numerologyInput.birthDate) {
      setNumerologyActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成数字命理完整报告。");
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setNumerologyActionMessage("登录状态已过期，请重新登录后再生成报告。");
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < numerologyReportCost) {
      setNumerologyActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${numerologyReportCost} 点。`);
      setReportMessage("点数不足，数字命理完整报告需要 220 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingNumerology(true);
    setNumerologyActionMessage("AI 正在计算数字命理报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成数字命理测算完整报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;

    try {
      const response = await fetch("/api/numerology-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(attachLunarFields(numerologyInput))
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
    } catch {
      aiContent = undefined;
    }

    const generated = createNumerologyLifePathReport(attachLunarFields(numerologyInput), aiContent);
    const persistedReport = await persistGeneratedReport(generated, "numerology_life_path_report", "生成数字命理测算完整报告", accessToken);

    if (!persistedReport) {
      setNumerologyActionMessage("报告保存或扣点失败，请稍后再试。");
      setIsGeneratingNumerology(false);
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setNumerologyActionMessage("报告已生成、扣点并保存。");
    setReportMessage("数字命理测算完整报告已保存，之后可以在报告档案找回。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setIsGeneratingNumerology(false);
  }

  function handleUseSavedProfileForIntegrated() {
    setIntegratedInput(defaultIntegratedReportInput(memberProfile));
    setIntegratedActionMessage("已套用会员中心保存的个人资料。");
  }

  function handleClearIntegratedProfile() {
    setIntegratedInput((current) => ({
      ...current,
      fullName: "",
      gender: "男",
      birthDate: "",
      birthTime: "",
      birthLocation: "Malaysia / Kuala Lumpur"
    }));
    setIntegratedActionMessage("已清空个人资料，可为新对象临时填写。");
  }

  function handleApplySavedSubjectProfile(profileId: string) {
    const profile = savedSubjectProfiles.find((item) => item.id === profileId);

    if (!profile) {
      return;
    }

    setIntegratedInput((current) => applySubjectProfileToIntegratedInput(current, profile));
    setIntegratedActionMessage(`已套用 ${profile.label}。`);
  }

  function handleSaveIntegratedProfile() {
    if (!integratedInput.fullName || !integratedInput.birthDate) {
      setIntegratedActionMessage("请先填写姓名与出生日期，才能保存这组资料。");
      return;
    }

    const nextProfile = subjectProfileFromIntegratedInput(integratedInput);
    const deduped = savedSubjectProfiles.filter(
      (profile) =>
        !(
          profile.fullName.trim().toLowerCase() === nextProfile.fullName.trim().toLowerCase() &&
          profile.birthDate === nextProfile.birthDate
        )
    );
    const nextProfiles = [nextProfile, ...deduped].slice(0, 12);

    setSavedSubjectProfiles(nextProfiles);
    window.localStorage.setItem(reportProfileStorageKey, JSON.stringify(nextProfiles));
    setIntegratedActionMessage(`${nextProfile.label} 已保存，下次可直接选择。`);
  }

  async function handleGenerateIntegratedReport() {
    if (!integratedInput.fullName || !integratedInput.birthDate) {
      setIntegratedActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成综合命理决策报告。");
      return;
    }

    const accessToken = await getMemberAccessToken();

    if (!accessToken) {
      setIntegratedActionMessage("登录状态已过期，请重新登录后再生成报告。");
      setReportMessage("登录状态已过期，请重新登录后再生成报告。");
      return;
    }

    if (points < integratedReportCost) {
      setIntegratedActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${integratedReportCost} 点。`);
      setReportMessage("点数不足，综合命理决策报告需要 680 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingIntegrated(true);
    setIntegratedActionMessage("AI 正在整合八字、紫微斗数、梅花易数与数字命理，通常需要 15-40 秒。");
    setReportMessage("AI 正在生成综合命理合参完整报告，请稍候。");
    let aiContent: IntegratedAiContent | undefined;

    try {
      const response = await fetch("/api/integrated-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(attachLunarFields(integratedInput))
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = {
          summary: payload.summary,
          sections: payload.sections,
          scores: payload.scores,
          actions: payload.actions
        };
      }
    } catch {
      aiContent = undefined;
    }

    const generated = createIntegratedDestinyReport(attachLunarFields(integratedInput), aiContent);
    const persistedReport = await persistGeneratedReport(generated, "integrated_destiny_report", "生成综合命理决策报告", accessToken);

    if (!persistedReport) {
      setIntegratedActionMessage("报告保存或扣点失败，请稍后再试。");
      setIsGeneratingIntegrated(false);
      return;
    }

    const nextReports = [persistedReport, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(persistedReport);
    setIsFullReportOpen(true);
    setIntegratedActionMessage("综合报告已生成、扣点并保存。");
    setReportMessage("综合命理合参完整报告已保存，之后可以在报告档案找回。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    setIsGeneratingIntegrated(false);
  }

  function handleSelectSaved(report: SavedReport) {
    setSelectedReport(report);
  }

  return (
    <section className="space-y-5">
      <div className="rounded border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-[#C79A54]" />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#063F4A]">Credit Balance</p>
              </div>
              <p className="mt-2 text-3xl font-semibold text-[#063F4A]">{points.toLocaleString("en-US")} 点</p>
              <p className="mt-1 text-xs text-ink/50">点数只用于平台功能，不可提现。</p>
            </div>
            {walletRecords.slice(0, 2).map(([label, value]) => (
              <div key={label} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
                <p className="text-xs text-ink/45">{label}</p>
                <p className="mt-2 text-lg font-semibold text-[#063F4A]">{value}</p>
                <p className="mt-1 text-xs text-ink/45">正式账务将同步后台流水</p>
              </div>
            ))}
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded bg-[#1495A0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F7F88]">
            充值点数 <CreditCard className="size-4" />
          </button>
        </div>
      </div>

      <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#063F4A]">AI Report Center</p>
            <h2 className="mt-2 text-2xl font-semibold">专业报告生成</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
              先选择你要解决的问题，系统会以综合命理合参生成可保存、可下载、可回看的高级报告。
            </p>
          </div>
          <StatusPill>{activeTier.name} · 云端保存</StatusPill>
        </div>

        <div className="mt-5 grid gap-3 rounded border border-[#063F4A]/10 bg-[#F5FAFA] p-3 md:grid-cols-3">
          {[
            ["01", "选择需求", "先选事业、财运、感情或年度方向"],
            ["02", "确认资料", "使用会员资料或为客户填写新资料"],
            ["03", "生成交付", "扣点后自动保存，可打开和下载"]
          ].map(([step, title, desc]) => (
            <div key={step} className="flex gap-3 rounded bg-white p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded bg-[#063F4A] text-xs font-semibold text-white">{step}</span>
              <span>
                <span className="block text-sm font-semibold text-[#063F4A]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/50">{desc}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div>
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Choose Purpose</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">你想解决什么问题？</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">正式版主推综合命理合参报告，用户不需要先理解术数名称。</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/55">Step 1 / 3</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {demandReportCards.map((item) => {
                  const active = selectedPaidReport === "integrated" && integratedInput.focus === item.preset.focus && integratedInput.specificQuestion === item.preset.specificQuestion;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        setSelectedPaidReport("integrated");
                        setIntegratedInput((current) => ({
                          ...current,
                          focus: item.preset.focus,
                          questionCategory: item.preset.questionCategory,
                          specificQuestion: item.preset.specificQuestion,
                          divinationDateTime: current.divinationDateTime || new Date().toISOString().slice(0, 16),
                          mode: "time"
                        }));
                        setIntegratedActionMessage(item.preset.message);
                        setReportMessage(`${item.title} 已准备好，请确认资料后生成。`);
                      }}
                      className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        active ? "border-[#C79A54] bg-[#102F38] text-white" : "border-black/10 bg-white text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-[#C79A54] text-[#102F38]" : "bg-[#F5FAFA] text-ink/60"}`}>{item.cost}</span>
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${active ? "text-white/70" : "text-ink/55"}`}>{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedPaidReport === "integrated" ? (
              <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Step 2 / 3 · Confirm Profile</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">综合命理合参完整报告</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">底层融合四大命理模型，但报告会以用户看得懂的方式输出：格局、机会、风险、通关与行动建议。</p>
                  </div>
                  <span className="rounded-full bg-[#102F38] px-3 py-1 text-xs font-semibold text-white">{integratedReportCost} 点</span>
                </div>
                <div className="mt-4 grid gap-2 rounded border border-[#C79A54]/25 bg-white p-3 sm:grid-cols-2">
                  {[
                    ["姓名", integratedInput.fullName || "未填写"],
                    ["生日", integratedInput.birthDate || "未填写"],
                    ["出生时间", integratedInput.birthTime || "未填写"],
                    ["重点", integratedInput.focus],
                    ["地点", integratedInput.birthLocation || "未填写"],
                    ["问题", integratedInput.specificQuestion || "未填写"]
                  ].map(([label, value]) => (
                    <div key={label} className={label === "问题" || label === "地点" ? "sm:col-span-2" : ""}>
                      <p className="text-xs text-ink/42">{label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#063F4A]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 rounded border border-[#C79A54]/25 bg-white p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#063F4A]">资料来源</p>
                    <p className="text-xs leading-5 text-ink/55">默认只确认资料。需要修改时再展开表单，页面会更像正式付费流程。</p>
                  </div>
                  <button type="button" onClick={handleUseSavedProfileForIntegrated} className="rounded bg-[#DDEFF2] px-3 py-2 text-xs font-semibold text-[#063F4A]">
                    使用已保存资料
                  </button>
                  <button type="button" onClick={() => setIsIntegratedFormOpen((current) => !current)} className="rounded border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink/65">
                    {isIntegratedFormOpen ? "收起资料表单" : "编辑 / 填写资料"}
                  </button>
                </div>
                <div className="mt-3 grid gap-2 rounded border border-black/10 bg-[#F5FAFA] p-3 md:grid-cols-[1fr_auto] md:items-end">
                  <label className="text-sm font-semibold">
                    常用资料档案
                    <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-ink/45">
                      已保存 {savedSubjectProfiles.length} 组
                    </span>
                    <select
                      value=""
                      onChange={(event) => handleApplySavedSubjectProfile(event.target.value)}
                      className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#C79A54]"
                    >
                      <option value="" disabled>
                        {savedSubjectProfiles.length ? "选择已保存资料" : "暂无已保存资料"}
                      </option>
                      {savedSubjectProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={handleSaveIntegratedProfile} className="rounded bg-[#C79A54] px-3 py-2 text-xs font-semibold text-[#063F4A]">
                    保存当前资料
                  </button>
                </div>
                {savedSubjectProfiles.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {savedSubjectProfiles.slice(0, 6).map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleApplySavedSubjectProfile(profile.id)}
                        className="shrink-0 rounded-full border border-[#C79A54]/30 bg-white px-3 py-1 text-xs font-semibold text-[#063F4A] transition hover:border-[#C79A54]"
                      >
                        {profile.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {isIntegratedFormOpen ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" onClick={handleClearIntegratedProfile} className="rounded border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink/65">
                      清空并填写新资料
                    </button>
                  </div>
                  <label className="text-sm font-semibold">
                    姓名
                    <input value={integratedInput.fullName} onChange={(event) => setIntegratedInput((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <label className="text-sm font-semibold">
                    性别
                    <select value={integratedInput.gender} onChange={(event) => setIntegratedInput((current) => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                      <option value="男">男</option>
                      <option value="女">女</option>
                      <option value="其他">其他</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    出生日期（公历）
                    <input type="date" value={integratedInput.birthDate} onChange={(event) => setIntegratedInput((current) => ({ ...current, birthDate: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <label className="text-sm font-semibold">
                    出生时间
                    <input type="time" value={integratedInput.birthTime} onChange={(event) => setIntegratedInput((current) => ({ ...current, birthTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <div className="rounded border border-[#C79A54]/25 bg-white/75 p-3 text-sm font-semibold text-[#063F4A] md:col-span-2">
                    系统自动换算：农历 {getAutoLunarDate(integratedInput.birthDate, integratedInput.birthTime, integratedInput.calendarType)}
                  </div>
                  <label className="text-sm font-semibold md:col-span-2">
                    出生地点
                    <input value={integratedInput.birthLocation} onChange={(event) => setIntegratedInput((current) => ({ ...current, birthLocation: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <label className="text-sm font-semibold">
                    输入历法
                    <select value={integratedInput.calendarType} onChange={(event) => setIntegratedInput((current) => ({ ...current, calendarType: event.target.value as IntegratedReportInput["calendarType"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                      <option value="Gregorian">Gregorian 公历</option>
                      <option value="Lunar">Lunar 农历</option>
                    </select>
                    <span className="mt-1 block text-xs font-medium text-ink/45">一般请选择公历，系统会自动换算农历与时辰。</span>
                  </label>
                  <label className="text-sm font-semibold">
                    综合重点
                    <select value={integratedInput.focus} onChange={(event) => setIntegratedInput((current) => ({ ...current, focus: event.target.value as IntegratedReportInput["focus"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                      <option value="career">事业 career</option>
                      <option value="wealth">财运 wealth</option>
                      <option value="relationship">感情 relationship</option>
                      <option value="health">健康 health</option>
                      <option value="business">商业 business</option>
                      <option value="yearly luck">流年 yearly luck</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    梅花问题类别
                    <select value={integratedInput.questionCategory} onChange={(event) => setIntegratedInput((current) => ({ ...current, questionCategory: event.target.value as IntegratedReportInput["questionCategory"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                      {Object.entries(meihuaCategoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    起卦方式
                    <select value={integratedInput.mode} onChange={(event) => setIntegratedInput((current) => ({ ...current, mode: event.target.value as IntegratedReportInput["mode"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                      <option value="time">时间起卦</option>
                      <option value="random">三数起卦</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    起卦时间
                    <input type="datetime-local" value={integratedInput.divinationDateTime} onChange={(event) => setIntegratedInput((current) => ({ ...current, divinationDateTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <label className="text-sm font-semibold">
                    三个数字（可选）
                    <input value={integratedInput.manualNumbers} onChange={(event) => setIntegratedInput((current) => ({ ...current, manualNumbers: event.target.value }))} placeholder="例如 8, 6, 3" className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                  <label className="text-sm font-semibold md:col-span-2">
                    具体问题 / 决策场景
                    <textarea value={integratedInput.specificQuestion} onChange={(event) => setIntegratedInput((current) => ({ ...current, specificQuestion: event.target.value }))} rows={3} placeholder="例如：我是否应该在三个月内扩大团队？" className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                  </label>
                </div>
                ) : null}
                <div className="mt-4 grid gap-2 rounded border border-[#063F4A]/10 bg-white p-3 sm:grid-cols-3">
                  {["命理格局拆解", "关键风险判断", "通关行动建议"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#063F4A]">
                      <CheckCircle2 className="size-4 text-[#1495A0]" />
                      {item}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleGenerateIntegratedReport} disabled={isGeneratingIntegrated} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#102F38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A0A0A] disabled:opacity-60">
                  <FileText className="size-4" /> {isGeneratingIntegrated ? "AI 合参生成中..." : `确认扣除 ${integratedReportCost} 点并生成报告`}
                </button>
                <CreditPreview points={points} cost={integratedReportCost} message={integratedActionMessage} />
              </div>
            ) : null}
            <details className="mb-4 rounded border border-black/10 bg-white p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Optional</p>
                    <h3 className="mt-1 font-semibold text-[#063F4A]">更多专业单项报告</h3>
                    <p className="mt-1 text-xs leading-5 text-ink/50">需要单独看八字、紫微、梅花或数字命理时再展开。</p>
                  </div>
                  <ChevronRight className="size-4 text-ink/35" />
                </div>
              </summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { id: "bazi", title: "八字完整报告", cost: baziReportCost, desc: "命局底盘、五行、十神、大运流年" },
                  { id: "ziwei", title: "紫微斗数报告", cost: ziweiReportCost, desc: "十二宫、命宫、大限、事业财帛" },
                  { id: "meihua", title: "梅花易数报告", cost: meihuaReportCost, desc: "一事一问，看现状、转折与结果" },
                  { id: "numerology", title: "数字命理报告", cost: numerologyReportCost, desc: "生命路径、姓名能量、年度节奏" }
                ].map((item) => {
                  const active = selectedPaidReport === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPaidReport(item.id as typeof selectedPaidReport)}
                      className={active ? "rounded border border-[#C79A54] bg-[#102F38] p-4 text-left text-white" : "rounded border border-black/10 bg-[#F5FAFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60"}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className={active ? "rounded-full bg-[#C79A54] px-3 py-1 text-xs font-semibold text-[#102F38]" : "rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/60"}>{item.cost} 点</span>
                      </div>
                      <p className={active ? "mt-2 text-sm leading-6 text-white/65" : "mt-2 text-sm leading-6 text-ink/55"}>{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </details>
            {selectedPaidReport === "bazi" ? (
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F16]">Paid AI Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">八字命理测算完整报告</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">
                    专业海报式报告，包含四柱、十神、五行、大运、流年、评分与实用建议。
                  </p>
                </div>
                <span className="rounded-full bg-[#7A1F16] px-3 py-1 text-xs font-semibold text-white">{baziReportCost} 点</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  姓名
                  <input value={baziInput.fullName} onChange={(event) => setBaziInput((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  性别
                  <select value={baziInput.gender} onChange={(event) => setBaziInput((current) => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  出生日期
                  <input type="date" value={baziInput.birthDate} onChange={(event) => setBaziInput((current) => ({ ...current, birthDate: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  出生时间
                  <input type="time" value={baziInput.birthTime} onChange={(event) => setBaziInput((current) => ({ ...current, birthTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  出生地点
                  <input value={baziInput.birthLocation} onChange={(event) => setBaziInput((current) => ({ ...current, birthLocation: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  历法
                  <select value={baziInput.calendarType} onChange={(event) => setBaziInput((current) => ({ ...current, calendarType: event.target.value as BaziReportInput["calendarType"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="Gregorian">Gregorian 公历</option>
                    <option value="Lunar">Lunar 农历</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  重点问题
                  <select value={baziInput.focus} onChange={(event) => setBaziInput((current) => ({ ...current, focus: event.target.value as BaziReportInput["focus"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="career">事业 career</option>
                    <option value="wealth">财运 wealth</option>
                    <option value="relationship">感情 relationship</option>
                    <option value="health">健康 health</option>
                    <option value="business">商业 business</option>
                    <option value="yearly luck">流年 yearly luck</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={handleGenerateBaziReport}
                disabled={isGeneratingBazi}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#7A1F16] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5f170f] disabled:cursor-wait disabled:bg-[#7A1F16]/60"
              >
                <FileText className="size-4" /> {isGeneratingBazi ? "AI 生成中..." : "生成八字完整报告"}
              </button>
              <CreditPreview points={points} cost={baziReportCost} message={baziActionMessage} />
            </div>
            ) : null}
            {selectedPaidReport === "meihua" ? (
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A1F16]">Paid Divination Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">梅花易数测算完整报告</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">适合一事一问：本卦看现状，动爻看转折，变卦看趋势。</p>
                </div>
                <span className="rounded-full bg-[#7A1F16] px-3 py-1 text-xs font-semibold text-white">{meihuaReportCost} 点</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  姓名
                  <input value={meihuaInput.fullName} onChange={(event) => setMeihuaInput((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  性别
                  <select value={meihuaInput.gender} onChange={(event) => setMeihuaInput((current) => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  出生日期
                  <input type="date" value={meihuaInput.birthDate} onChange={(event) => setMeihuaInput((current) => ({ ...current, birthDate: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  出生时间
                  <input type="time" value={meihuaInput.birthTime} onChange={(event) => setMeihuaInput((current) => ({ ...current, birthTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  出生地点
                  <input value={meihuaInput.birthLocation} onChange={(event) => setMeihuaInput((current) => ({ ...current, birthLocation: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  问题类别
                  <select value={meihuaInput.questionCategory} onChange={(event) => setMeihuaInput((current) => ({ ...current, questionCategory: event.target.value as MeihuaReportInput["questionCategory"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="career">事业</option>
                    <option value="wealth">财运</option>
                    <option value="relationship">感情</option>
                    <option value="health">健康</option>
                    <option value="business">商业</option>
                    <option value="legal">法律 / 冲突</option>
                    <option value="travel">出行 / 搬迁</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  起卦时间
                  <input type="datetime-local" value={meihuaInput.divinationDateTime} onChange={(event) => setMeihuaInput((current) => ({ ...current, divinationDateTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  起卦模式
                  <select value={meihuaInput.mode} onChange={(event) => setMeihuaInput((current) => ({ ...current, mode: event.target.value as MeihuaReportInput["mode"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="time">Time-based mode 时间起卦</option>
                    <option value="random">Random number mode 随机数字</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  手动数字
                  <input value={meihuaInput.manualNumbers} onChange={(event) => setMeihuaInput((current) => ({ ...current, manualNumbers: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  具体问题
                  <textarea value={meihuaInput.specificQuestion} onChange={(event) => setMeihuaInput((current) => ({ ...current, specificQuestion: event.target.value }))} rows={3} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
              </div>
              <button type="button" onClick={handleGenerateMeihuaReport} disabled={isGeneratingMeihua} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#7A1F16] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5f170f] disabled:cursor-wait disabled:bg-[#7A1F16]/60">
                <FileText className="size-4" /> {isGeneratingMeihua ? "AI 起卦中..." : "生成梅花易数完整报告"}
              </button>
              <CreditPreview points={points} cost={meihuaReportCost} message={meihuaActionMessage} />
            </div>
            ) : null}
            {selectedPaidReport === "ziwei" ? (
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B1B66]">Paid Zi Wei Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">紫微斗数命盘详细解析报告</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">十二宫命盘、大限流年、星曜重点与人生策略建议。</p>
                </div>
                <span className="rounded-full bg-[#3B1B66] px-3 py-1 text-xs font-semibold text-white">{ziweiReportCost} 点</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  姓名
                  <input value={ziweiInput.fullName} onChange={(event) => setZiweiInput((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  性别
                  <select value={ziweiInput.gender} onChange={(event) => setZiweiInput((current) => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  出生日期
                  <input type="date" value={ziweiInput.birthDate} onChange={(event) => setZiweiInput((current) => ({ ...current, birthDate: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  出生时间
                  <input type="time" value={ziweiInput.birthTime} onChange={(event) => setZiweiInput((current) => ({ ...current, birthTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  出生地点
                  <input value={ziweiInput.birthLocation} onChange={(event) => setZiweiInput((current) => ({ ...current, birthLocation: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  历法
                  <select value={ziweiInput.calendarType} onChange={(event) => setZiweiInput((current) => ({ ...current, calendarType: event.target.value as ZiweiReportInput["calendarType"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="Gregorian">Gregorian 公历</option>
                    <option value="Lunar">Lunar 农历</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  重点
                  <select value={ziweiInput.focus} onChange={(event) => setZiweiInput((current) => ({ ...current, focus: event.target.value as ZiweiReportInput["focus"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="career">事业 Career</option>
                    <option value="wealth">财运 Wealth</option>
                    <option value="relationship">感情 Relationship</option>
                    <option value="health">健康 Health</option>
                    <option value="business">商业 Business</option>
                    <option value="annual luck">流年 Annual luck</option>
                  </select>
                </label>
              </div>
              <button type="button" onClick={handleGenerateZiweiReport} disabled={isGeneratingZiwei} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#3B1B66] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2b124c] disabled:cursor-wait disabled:bg-[#3B1B66]/60">
                <FileText className="size-4" /> {isGeneratingZiwei ? "AI 排盘中..." : "生成紫微斗数完整报告"}
              </button>
              <CreditPreview points={points} cost={ziweiReportCost} message={ziweiActionMessage} />
            </div>
            ) : null}
            {selectedPaidReport === "numerology" ? (
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B1B66]">Paid Numerology Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">数字命理测算完整报告</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">生命路径、姓名数字、1-9 能量图、人生周期、十年流年与幸运指南。</p>
                </div>
                <span className="rounded-full bg-[#102F38] px-3 py-1 text-xs font-semibold text-white">{numerologyReportCost} 点</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  姓名
                  <input value={numerologyInput.fullName} onChange={(event) => setNumerologyInput((current) => ({ ...current, fullName: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  性别
                  <select value={numerologyInput.gender} onChange={(event) => setNumerologyInput((current) => ({ ...current, gender: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  出生日期
                  <input type="date" value={numerologyInput.birthDate} onChange={(event) => setNumerologyInput((current) => ({ ...current, birthDate: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold">
                  出生时间（选填）
                  <input type="time" value={numerologyInput.birthTime} onChange={(event) => setNumerologyInput((current) => ({ ...current, birthTime: event.target.value }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  重点方向
                  <select value={numerologyInput.focus} onChange={(event) => setNumerologyInput((current) => ({ ...current, focus: event.target.value as NumerologyReportInput["focus"] }))} className="mt-1 w-full rounded border border-black/10 bg-white px-3 py-2 outline-none focus:border-[#C79A54]">
                    <option value="career">事业 Career</option>
                    <option value="wealth">财富 Wealth</option>
                    <option value="relationship">关系 Relationship</option>
                    <option value="personal growth">个人成长 Personal growth</option>
                    <option value="business">商业 Business</option>
                    <option value="yearly luck">年度运势 Yearly luck</option>
                  </select>
                </label>
              </div>
              <button type="button" onClick={handleGenerateNumerologyReport} disabled={isGeneratingNumerology} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#102F38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A0A0A] disabled:cursor-wait disabled:bg-[#102F38]/60">
                <FileText className="size-4" /> {isGeneratingNumerology ? "AI 计算中..." : "生成数字命理完整报告"}
              </button>
              <CreditPreview points={points} cost={numerologyReportCost} message={numerologyActionMessage} />
            </div>
            ) : null}
            <details className="mb-4 rounded border border-black/10 bg-white p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">More Reports</p>
                    <h3 className="mt-1 font-semibold text-[#063F4A]">其他主题报告</h3>
                    <p className="mt-1 text-xs leading-5 text-ink/50">财运、事业、合盘、流年等主题报告收纳在这里，避免页面过长。</p>
                  </div>
                  <ChevronRight className="size-4 text-ink/35" />
                </div>
              </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {reportTypes.filter((report) => !["八字命理测算完整报告", "梅花易数测算完整报告", "紫微斗数命盘详细解析报告", "数字命理测算完整报告"].includes(report.title)).map((report) => {
                const locked = isReportLocked(report);
                const isGeneratingThisReport = generatingReportTitle === report.title;

                return (
                  <button
                    key={report.title}
                    type="button"
                    onClick={() => handleOpenReport(report)}
                    disabled={locked || Boolean(generatingReportTitle)}
                    className={`group rounded border p-4 text-left transition ${
                      locked
                        ? "cursor-not-allowed border-black/10 bg-[#F5FAFA] opacity-72"
                        : isGeneratingThisReport
                          ? "cursor-wait border-[#C79A54]/60 bg-rice shadow-sm"
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
                      {locked ? "当前等级不可生成" : isGeneratingThisReport ? "AI 四术生成中..." : "生成并查看报告"} <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
            </details>

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
                        <span className="mt-0.5 block truncate text-xs text-ink/50">
                          {reportSubjectName(report)} · {report.createdAt} · {report.points} 点
                        </span>
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

          <div className="rounded border border-black/10 bg-[#F5FAFA] p-5 shadow-sm">
            {selectedReport ? (
              <div>
                {(() => {
                  const selectedReportContent = normalizedReportContent(selectedReport);

                  return (
                    <>
                <div className="overflow-hidden rounded border border-[#C79A54]/35 bg-white shadow-sm">
                  <div className="bg-[#102F38] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C79A54]">Premium Report Preview</p>
                    <h3 className="mt-3 text-3xl font-semibold leading-tight">{selectedReport.title}</h3>
                    <div className="mt-4 grid gap-2 rounded border border-white/10 bg-white/8 p-3 text-sm text-white/70 sm:grid-cols-2">
                      <span>对象：{reportSubjectName(selectedReport)}</span>
                      <span>时间：{selectedReport.createdAt}</span>
                      <span>消耗：{selectedReport.points} 点</span>
                      <span>状态：已保存</span>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-3">
                    {[
                      ["完整内容", `${selectedReportContent.sections.length} 节`],
                      ["报告类型", selectedReport.tag],
                      ["可下载", "PDF / SVG / TXT"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded border border-black/10 bg-[#F5FAFA] p-3">
                        <p className="text-xs text-ink/45">{label}</p>
                        <p className="mt-1 font-semibold text-[#063F4A]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-black/10 p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFullReportOpen(true)}
                        className="inline-flex items-center gap-2 rounded bg-[#1495A0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F7F88]"
                      >
                        <Eye className="size-4" /> 打开完整报告
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadReportSvg(selectedReport, memberProfile)}
                        className="inline-flex items-center gap-2 rounded border border-[#C79A54]/45 bg-[#C79A54]/10 px-4 py-2 text-sm font-semibold text-[#063F4A]"
                      >
                        <Download className="size-4" /> 下载 SVG
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadReport(selectedReport, memberProfile)}
                        className="inline-flex items-center gap-2 rounded border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#063F4A]"
                      >
                        <Download className="size-4" /> 下载 TXT
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
                  <p className="text-sm font-semibold text-[#063F4A]">报告摘要</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{selectedReportContent.summary}</p>
                </div>

                <div className="mt-5 grid gap-3">
                  {selectedReportContent.sections.map((section) => (
                    <div key={section.title} className="rounded border border-black/10 bg-rice p-4">
                      <p className="font-semibold">{section.title}</p>
                      <p className="mt-2 text-sm leading-6 text-ink/62">{section.content}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded bg-[#F5FAFA] p-3 text-xs leading-5 text-ink/50">
                  免责声明：本报告为 AI 命理与风水辅助建议，仅供参考，不构成投资、医疗、法律或重大人生决策的唯一依据。
                </p>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="overflow-hidden rounded border border-[#C79A54]/35 bg-white shadow-sm">
                <div className="bg-[#102F38] p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C79A54]">Sample Preview</p>
                  <h3 className="mt-3 text-3xl font-semibold leading-tight">高级命理报告预览</h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/65">生成后会在这里显示完整报告封面、核心洞察、行动建议与下载入口。</p>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {[
                    ["01", "命理格局", "判断底层优势、风险与长期方向"],
                    ["02", "当下问题", "拆解当前决策、阻力与转折点"],
                    ["03", "行动建议", "输出通关、危机处理、产品与仪式建议"]
                  ].map(([step, title, desc]) => (
                    <div key={step} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
                      <p className="text-xs font-semibold text-[#C79A54]">{step}</p>
                      <p className="mt-2 font-semibold text-[#063F4A]">{title}</p>
                      <p className="mt-2 text-xs leading-5 text-ink/55">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-black/10 p-5">
                  <p className="rounded bg-[#fffaf0] p-4 text-sm leading-6 text-ink/65">
                    建议先选择左侧「综合命理报告」，确认资料后生成。报告会自动保存，之后可随时找回与下载。
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 rounded bg-[#F5FAFA] px-4 py-3 text-sm text-ink/58">{reportMessage}</p>
        </div>
      </div>
      {selectedReport && isFullReportOpen ? (
        <FullReportView report={selectedReport} memberProfile={memberProfile} onClose={() => setIsFullReportOpen(false)} />
      ) : null}
    </section>
  );
}

function InviteFriendsModule({
  referralCode,
  sponsorCode,
  referralSource
}: {
  referralCode: string;
  sponsorCode: string;
  referralSource: string;
}) {
  const inviteLink = typeof window === "undefined" ? `/auth?ref=${referralCode}` : `${window.location.origin}/auth?ref=${referralCode}`;
  const sourceLabel = referralSource === "member_referral" ? "会员推荐" : "总部自然流量";
  const [posterStatus, setPosterStatus] = useState("");
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  function copyInviteLink() {
    navigator.clipboard?.writeText(inviteLink);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`我在使用 AI Feng Shui Master，你可以用我的推荐链接注册，完成资料后双方各得 30 点：${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function downloadReferralPoster() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
      <rect width="1080" height="1350" fill="#F5FAFA"/>
      <rect x="70" y="70" width="940" height="1210" rx="46" fill="#063F4A"/>
      <circle cx="860" cy="230" r="150" fill="#1495A0" opacity="0.18"/>
      <circle cx="190" cy="1120" r="190" fill="#C79A54" opacity="0.16"/>
      <text x="120" y="170" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#C79A54" letter-spacing="8">AI FENG SHUI MASTER</text>
      <text x="120" y="300" font-family="Arial, sans-serif" font-size="74" font-weight="800" fill="#FFFFFF">邀请你免费测算</text>
      <text x="120" y="385" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#E8D4A8">注册完成资料，双方各得 30 点</text>
      <rect x="120" y="475" width="840" height="250" rx="32" fill="#FFFFFF" opacity="0.96"/>
      <text x="170" y="565" font-family="Arial, sans-serif" font-size="30" fill="#6C8790">专属推荐码</text>
      <text x="170" y="650" font-family="Arial, sans-serif" font-size="66" font-weight="800" fill="#063F4A" letter-spacing="6">${referralCode}</text>
      <rect x="120" y="780" width="840" height="240" rx="32" fill="#FFFFFF" opacity="0.1" stroke="#C79A54" stroke-width="3"/>
      <text x="170" y="860" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#FFFFFF">扫码 / 输入链接注册</text>
      <text x="170" y="935" font-family="Arial, sans-serif" font-size="30" fill="#E8D4A8">${inviteLink}</text>
      <text x="120" y="1155" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">AI 给你速度，大师给你深度</text>
      <text x="120" y="1215" font-family="Arial, sans-serif" font-size="26" fill="#DDEFF2">命理分析仅供参考，行动决定结果。</text>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `referral-poster-${referralCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function generateAiReferralPoster() {
    setIsGeneratingPoster(true);
    setPosterStatus("AI 正在生成推荐海报...");

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session }
      } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

      if (!session?.access_token) {
        setPosterStatus("请先登录会员账号，再生成 AI 推荐海报。");
        return;
      }

      const response = await fetch("/api/referrals/poster", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      const data = (await response.json()) as {
        error?: string;
        posterSvg?: string;
        fileName?: string;
        mode?: "ai" | "fallback";
        message?: string;
      };

      if (!response.ok || !data.posterSvg) {
        setPosterStatus(data.error || "AI 推荐海报生成失败，请稍后再试。");
        return;
      }

      const blob = new Blob([data.posterSvg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.fileName || `ai-referral-poster-${referralCode}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      setPosterStatus(data.message || (data.mode === "ai" ? "AI 推荐海报已生成。" : "已生成标准推荐海报。"));
    } catch (error) {
      setPosterStatus(error instanceof Error ? error.message : "AI 推荐海报生成失败，请稍后再试。");
    } finally {
      setIsGeneratingPoster(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Referral Center</p>
        <h2 className="mt-3 text-3xl font-semibold">邀请好友注册</h2>
        <p className="mt-3 text-sm leading-7 text-white/68">
          分享你的专属推荐链接，好友完成注册后，你和好友各获得 30 点。推荐关系用于后续团队、奖励和订单归属。
        </p>
        <div className="mt-6 rounded border border-white/10 bg-white/8 p-4">
          <p className="text-xs text-white/48">我的推荐码</p>
          <p className="mt-2 text-3xl font-semibold tracking-[0.12em] text-[#C79A54]">{referralCode}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={copyInviteLink} className="rounded bg-[#C79A54] px-4 py-3 font-semibold text-[#063F4A]">
            复制推荐链接
          </button>
          <button type="button" onClick={shareWhatsApp} className="rounded border border-white/15 px-4 py-3 font-semibold text-white">
            WhatsApp 分享
          </button>
          <button type="button" onClick={generateAiReferralPoster} disabled={isGeneratingPoster} className="rounded border border-[#C79A54]/70 px-4 py-3 font-semibold text-[#E8D4A8] disabled:cursor-not-allowed disabled:opacity-60">
            {isGeneratingPoster ? "生成中..." : "生成 AI 海报"}
          </button>
          <button type="button" onClick={downloadReferralPoster} className="rounded border border-white/15 px-4 py-3 font-semibold text-white">
            标准海报
          </button>
        </div>
        {posterStatus ? <p className="mt-3 rounded bg-white/8 px-3 py-2 text-xs leading-5 text-white/62">{posterStatus}</p> : null}
      </div>

      <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold text-[#063F4A]">推荐归属</h3>
        <div className="mt-5 grid gap-3">
          {[
            ["推荐链接", inviteLink],
            ["我的上级", sponsorCode || "HQ001"],
            ["注册来源", sourceLabel],
            ["默认规则", "没有推荐码的新用户自动归属 HQ001"]
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
              <p className="text-xs text-ink/45">{label}</p>
              <p className="mt-2 break-all font-semibold text-[#063F4A]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4 text-sm leading-6 text-ink/65">
          推荐关系注册后锁定，若用户没有推荐码，系统会归属总部账号 HQ001，避免随机分配造成佣金争议。
        </div>
      </div>
    </section>
  );
}

function PartnerCommandCenter({
  referralCode,
  onOpenModule
}: {
  referralCode: string;
  onOpenModule: (module: DashboardModule) => void;
}) {
  const totalPartnerMembers = partnerPackageMix.reduce((sum, [, count]) => sum + count, 0);

  return (
    <section className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded border border-black/10 bg-[#063F4A] p-6 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Partner Command</p>
              <h2 className="mt-3 text-3xl font-semibold">创业会员经营中心</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                适合已经开始带团队的创业配套会员，每天看转化、跟进、Pool Share 与团队健康度。
              </p>
            </div>
            <span className="rounded bg-white/10 px-3 py-1 text-sm font-semibold text-[#E8D4A8]">推荐码 {referralCode}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {partnerMetrics.map(([label, value, change]) => (
              <div key={label} className="rounded border border-white/10 bg-white/8 p-4">
                <p className="text-xs text-white/45">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-xs text-[#E8D4A8]">{change}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#C79A54]/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#E8D4A8]">团队规模概览</p>
                <p className="mt-1 text-sm text-white/60">当前视角：已招收 {totalPartnerMembers} 位创业配套 + 0 位 Free 会员。</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenModule("invite")}
                className="rounded bg-[#C79A54] px-4 py-2.5 text-sm font-semibold text-[#063F4A]"
              >
                继续邀请
              </button>
            </div>
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Pool Share</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#063F4A]">业绩共享池总金额</h3>
            </div>
            <StatusPill>合资格</StatusPill>
          </div>
          <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-6">
            <p className="text-sm text-ink/50">本月总分享金额</p>
            <p className="mt-3 text-5xl font-semibold tracking-tight text-[#063F4A]">RM0</p>
            <p className="mt-3 text-sm text-ink/55">状态：待月结确认</p>
          </div>
          <p className="mt-4 rounded bg-[#C79A54]/10 p-3 text-xs leading-5 text-ink/58">
            此金额为本月 Pool Share 总池，实际分配以公司月结、退款扣回与后台审批为准。
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-[#063F4A]">创业配套分布</h3>
            <StatusPill>{totalPartnerMembers} 位</StatusPill>
          </div>
          <div className="mt-5 grid gap-3">
            {partnerPackageMix.map(([name, count, action]) => {
              const percentage = totalPartnerMembers ? Math.round((count / totalPartnerMembers) * 100) : 0;

              return (
                <div key={name} className="rounded border border-black/10 bg-rice p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#063F4A]">{name}</p>
                      <p className="mt-1 text-sm text-ink/55">{action}</p>
                    </div>
                    <span className="text-2xl font-semibold text-[#C79A54]">{count}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 rounded-full bg-[#1495A0]" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-[#063F4A]">今日跟进任务</h3>
            <button
              type="button"
              onClick={() => onOpenModule("team")}
              className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white"
            >
              查看团队树 <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {partnerFollowUps.map((task, index) => (
              <button key={task} type="button" className="rounded border border-black/10 bg-[#F5FAFA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C79A54]/60 hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded bg-[#DDEFF2] text-sm font-semibold text-[#063F4A]">{index + 1}</span>
                  <p className="text-sm font-semibold leading-6 text-ink">{task}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Conversion Board</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#063F4A]">团队分层与下一步动作</h3>
          </div>
          <StatusPill>优先跟进</StatusPill>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {partnerLeadSegments.map(([segment, count, action]) => (
            <div key={segment} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#063F4A]">{segment}</p>
                  <p className="mt-2 text-sm text-ink/55">{action}</p>
                </div>
                <span className="rounded bg-white px-2.5 py-1 text-sm font-semibold text-[#063F4A]">{count}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => onOpenModule("invite")} className="rounded bg-[#C79A54] px-4 py-3 font-semibold text-[#063F4A]">
            分享推荐链接
          </button>
          <button type="button" onClick={() => onOpenModule("team")} className="rounded border border-[#063F4A]/20 px-4 py-3 font-semibold text-[#063F4A]">
            查看推荐团队
          </button>
          <button type="button" className="rounded border border-[#C79A54]/40 bg-[#C79A54]/10 px-4 py-3 font-semibold text-[#063F4A]">
            生成跟进名单
          </button>
        </div>
      </div>
    </section>
  );
}

function SigilPreview({ artifact }: { artifact: SigilArtifact }) {
  const nodeDots = artifact.dots.filter((_, index) => index === 0 || index === artifact.dots.length - 1 || index % 2 === 0);

  return (
    <svg viewBox="0 0 240 240" className="size-full">
      <defs>
        <filter id={`gold-glow-${artifact.id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.05" result="blur" />
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
      <path
        d={artifact.gridPath || ""}
        fill="none"
        stroke="#C79A54"
        strokeOpacity="0.16"
        strokeWidth="0.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="120" cy="120" r="96" fill="none" stroke="#C79A54" strokeOpacity="0.74" strokeWidth="2.4" />
      <circle cx="120" cy="120" r="78" fill="none" stroke="#C79A54" strokeOpacity="0.32" strokeWidth="1.2" />
      <path
        d={artifact.ornamentPath || ""}
        fill="none"
        stroke="#C79A54"
        strokeOpacity="0.74"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={artifact.path}
        fill="none"
        stroke="#9B741C"
        strokeOpacity="0.98"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#gold-glow-${artifact.id})`}
      />
      {nodeDots.map((dot, index) => (
        <circle
          key={`${artifact.id}-node-${index}`}
          cx={dot.x}
          cy={dot.y}
          r="5.3"
          fill="#C79A54"
          stroke="#ffffff"
          strokeWidth="1.8"
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

function Hexagram64Module({ points, onSpendPoints }: { points: number; onSpendPoints: (amount: number) => boolean }) {
  const [readings, setReadings] = useState<Hexagram64Reading[]>([]);
  const [selectedReading, setSelectedReading] = useState<Hexagram64Reading | null>(null);
  const [mode, setMode] = useState<Hexagram64Mode>("daily");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const selectedMode = hexagram64ModeOptions.find((item) => item.id === mode) || hexagram64ModeOptions[0];
  const todayReading = readings.find((reading) => reading.mode === "daily" && reading.dateKey === new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const stored = window.localStorage.getItem(hexagram64StorageKey);

    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Hexagram64Reading[];
      setReadings(parsed);
      setSelectedReading(parsed[0] || null);
    } catch {
      window.localStorage.removeItem(hexagram64StorageKey);
    }
  }, []);

  function handleGenerate() {
    if (mode !== "daily" && !question.trim()) {
      setError("问事一字和深度解字需要先输入一个具体问题。");
      return;
    }

    if (mode === "daily" && todayReading) {
      setSelectedReading(todayReading);
      setError("今日一字已经生成。若要重新问具体事情，请选择「问事一字」或「深度解字」。");
      return;
    }

    if (points < selectedMode.cost || !onSpendPoints(selectedMode.cost)) {
      setError(`点数不足，${selectedMode.title}需要 ${selectedMode.cost} 点。`);
      return;
    }

    const reading = createHexagram64Reading(new Date(), mode, question);
    const nextReadings = [reading, ...readings].slice(0, 12);
    setReadings(nextReadings);
    setSelectedReading(reading);
    setError("");
    window.localStorage.setItem(hexagram64StorageKey, JSON.stringify(nextReadings));
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="grid gap-5">
        <div className="rounded border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">64 Hexagram One Word</p>
              <h2 className="mt-2 text-2xl font-semibold">64卦一字</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink/58">
                根据当下日期、时间与随机抽取的一个卦，生成一个 2-4 字命理关键字与 80-120 字神谕断语。轻量、高频，适合每日打开。
              </p>
            </div>
            <StatusPill>低点数入口</StatusPill>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {hexagram64ModeOptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`rounded border p-3 text-left transition ${
                  mode === item.id ? "border-[#C79A54] bg-[#fffaf0] shadow-sm" : "border-black/10 bg-[#F5FAFA] hover:border-[#C79A54]/45"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#063F4A]">{item.title}</span>
                  <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#C79A54]">{item.cost} 点</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-ink/50">{item.desc}</p>
                <p className="mt-3 inline-flex rounded bg-[#DDEFF2] px-2 py-1 text-[11px] font-semibold text-[#063F4A]">{item.badge}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 rounded border border-[#C79A54]/25 bg-[#fffaf0] p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink/45">当前日期</p>
              <p className="mt-1 font-semibold text-[#063F4A]">{new Date().toLocaleDateString("zh-MY")}</p>
            </div>
            <div>
              <p className="text-xs text-ink/45">当前时间</p>
              <p className="mt-1 font-semibold text-[#063F4A]">{new Date().toLocaleTimeString("zh-MY", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div>
              <p className="text-xs text-ink/45">当前点数</p>
              <p className="mt-1 font-semibold text-[#063F4A]">{points.toLocaleString("en-US")} 点</p>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-[#063F4A]">默想或输入一个问题</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="mt-2 min-h-24 w-full rounded border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#1495A0]"
              placeholder={mode === "daily" ? "今日一字可留空；也可以写下你今天最在意的一件事。" : "例如：我现在适合换工作吗？这个合作要不要推进？"}
            />
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-[#063F4A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#052F38]"
          >
            消耗 {selectedMode.cost} 点抽取{selectedMode.title} <Sparkles className="size-4" />
          </button>
          <p className="mt-2 text-xs leading-5 text-ink/45">
            今日一字每日只生成一次；问事与深度解字可针对具体问题生成，更适合决策前使用。
          </p>
          {error ? <p className="mt-3 rounded bg-[#E8D4A8] p-3 text-sm text-[#7A1F16]">{error}</p> : null}
        </div>

        <div className="rounded border border-black/10 bg-[#F5FAFA] p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Archive className="size-4 text-[#063F4A]" />
            <h3 className="font-semibold">一字档案</h3>
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
                    <span className="text-xl font-semibold text-[#063F4A]">{reading.word}</span>
                    <span className="rounded bg-[#DDEFF2] px-2 py-1 text-xs font-semibold text-[#063F4A]">{reading.modeLabel || "一字"}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/45">{reading.createdAt} · {reading.hexagramTitle || reading.hexagram}</p>
                  {reading.question ? <p className="mt-1 line-clamp-1 text-xs text-ink/50">问：{reading.question}</p> : null}
                </button>
              ))
            ) : (
              <p className="rounded border border-dashed border-black/15 bg-white p-4 text-sm leading-6 text-ink/55">
                还没有一字记录。点击抽取后，会自动保存本次结果。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded border border-[#C79A54]/30 bg-white p-5 shadow-sm">
        {selectedReading ? (
          <div>
            <div className="relative overflow-hidden rounded bg-[#063F4A] p-6 text-white shadow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#C79A54]/25" />
              <div className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full border border-white/10" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C79A54]">{selectedReading.modeLabel || "今日一字"}</p>
                  {selectedReading.question ? <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">所问：{selectedReading.question}</p> : null}
                </div>
                <span className="rounded bg-white/10 px-3 py-1 text-sm font-semibold text-[#C79A54]">{selectedReading.cost || hexagram64Cost} 点</span>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-[0.75fr_1fr] md:items-center">
                <div className="grid aspect-square place-items-center rounded-full border border-[#C79A54]/45 bg-white/8 p-8">
                  <div className="grid h-full w-full place-items-center rounded-full border border-[#C79A54]/25 bg-black/10">
                    <span className="text-center text-6xl font-semibold leading-none text-[#C79A54] md:text-7xl">{selectedReading.word}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">{selectedReading.hexagramTitle || selectedReading.hexagram}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">{selectedReading.explanation}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      ["上卦", `${selectedReading.upper.symbol} ${selectedReading.upper.name}`],
                      ["下卦", `${selectedReading.lower.symbol} ${selectedReading.lower.name}`],
                      ["神谕", selectedReading.word],
                      ["指数", `${selectedReading.score}/100`]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded bg-white/8 p-3">
                        <p className="text-xs text-white/45">{label}</p>
                        <p className="mt-1 font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded border border-[#C79A54]/25 bg-[#fffaf0] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Oracle</p>
                <h4 className="mt-2 font-semibold text-[#063F4A]">神谕断语</h4>
                <p className="mt-2 text-sm leading-7 text-ink/70">{selectedReading.oracle || selectedReading.action}</p>
              </div>
              <div className="rounded border border-[#C79A54]/25 bg-[#fffaf0] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Theme</p>
                <h4 className="mt-2 font-semibold text-[#063F4A]">此刻主题</h4>
                <p className="mt-2 text-sm leading-6 text-ink/65">{selectedReading.theme}</p>
              </div>
              <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Clue</p>
                <h4 className="mt-2 font-semibold text-[#063F4A]">宇宙显化线索</h4>
                <p className="mt-2 text-sm leading-6 text-ink/65">留意：{selectedReading.clue || "今天重复出现的名字或方向"}</p>
              </div>
              {selectedReading.mode === "deep" ? (
                <div className="rounded border border-[#1495A0]/20 bg-[#EAF7F7] p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1495A0]">Deep Reading</p>
                  <h4 className="mt-2 font-semibold text-[#063F4A]">深度解字行动表</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["马上做", selectedReading.action],
                      ["先避免", "不要为了求快而临时加码承诺，先守住边界。"],
                      ["再观察", selectedReading.clue ? `今天反复出现的「${selectedReading.clue}」。` : "重复出现的人、方向或颜色。"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded bg-white p-3">
                        <p className="text-xs font-semibold text-[#1495A0]">{label}</p>
                        <p className="mt-1 text-sm leading-6 text-ink/65">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <p className="mt-5 rounded border border-black/10 bg-rice p-4 text-xs leading-5 text-ink/55">
              64卦一字为轻量文化参考，用于每日自我提醒与行动聚焦，不构成金融、法律、医疗或重大决策建议。
            </p>
          </div>
        ) : (
          <div className="grid min-h-[460px] place-items-center rounded border border-dashed border-[#C79A54]/40 bg-[#C79A54]/5 p-8 text-center">
            <div>
              <Sparkles className="mx-auto size-12 text-[#C79A54]" />
              <h3 className="mt-4 text-2xl font-semibold text-[#063F4A]">等待抽取一字</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink/55">点击左侧按钮后，系统会根据此刻时间与随机卦象生成你的今日命理关键字。</p>
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
  onEarnPoints: (amount: number, source?: string, description?: string) => void;
  onOpenModule: (module: DashboardModule) => void;
}) {
  const [numbers, setNumbers] = useState<[string, string, string]>(["3", "8", "9"]);
  const [divinationDate, setDivinationDate] = useState("");
  const [divinationTime, setDivinationTime] = useState("");
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

    const reading = createDivinationReading(numbers, createDivinationDate(divinationDate, divinationTime));
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
    onEarnPoints(reward, "divination_checkin_reward", "九运问卦每日打卡奖励");
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink/45">起卦日期（可选）</span>
              <input
                type="date"
                value={divinationDate}
                onChange={(event) => setDivinationDate(event.target.value)}
                className="mt-2 h-12 w-full rounded border border-black/10 bg-rice px-3 text-sm font-semibold text-[#063F4A] outline-none focus:border-[#C79A54]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink/45">起卦时间（可选）</span>
              <input
                type="time"
                value={divinationTime}
                onChange={(event) => setDivinationTime(event.target.value)}
                className="mt-2 h-12 w-full rounded border border-black/10 bg-rice px-3 text-sm font-semibold text-[#063F4A] outline-none focus:border-[#C79A54]"
              />
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-ink/45">不填写时，系统会自动使用当前日期与当前时间起卦。</p>

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
                ["体用关系", `${selectedReading.bodyUseRelation || "体用待判"} · 需${selectedReading.passElement}通关`]
              ].map(([label, value]) => (
                <div key={label} className="rounded border border-black/10 bg-rice p-4">
                  <p className="text-xs text-ink/45">{label}</p>
                  <p className="mt-2 font-semibold text-[#063F4A]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded border border-[#C79A54]/35 bg-[#FDF8EA] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Energy Board</p>
                  <h4 className="mt-1 text-xl font-semibold text-[#063F4A]">三阶段吉凶能量看板</h4>
                </div>
                <StatusPill>本卦 · 互卦 · 变卦</StatusPill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(selectedReading.energyBoard || [
                  { stage: "当下（本卦）", status: "参考", value: selectedReading.score, note: selectedReading.situation },
                  { stage: "过程（互卦）", status: "参考", value: Math.max(30, selectedReading.score - 15), note: selectedReading.process },
                  { stage: "结果（变卦）", status: "参考", value: Math.max(30, selectedReading.score - 8), note: selectedReading.outcome }
                ]).map((stage) => (
                  <div key={stage.stage} className="rounded border border-black/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#063F4A]">{stage.stage}</p>
                        <p className="mt-1 text-xs font-semibold text-[#C79A54]">{stage.status}</p>
                      </div>
                      <span className="rounded bg-[#DDEFF2] px-2 py-1 text-sm font-semibold text-[#063F4A]">{stage.value}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#DDEFF2]">
                      <div className="h-2 rounded-full bg-[#C79A54]" style={{ width: `${stage.value}%` }} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/62">{stage.note}</p>
                  </div>
                ))}
              </div>
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

            <div className="mt-5 rounded border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#063F4A]">Clue</p>
                  <h4 className="mt-1 text-xl font-semibold">核心时空线索</h4>
                  <p className="mt-1 text-sm text-ink/55">这些不是直接答案，而是让你对照现实生活的“密码锁”。</p>
                </div>
                <StatusPill>万物类象</StatusPill>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(selectedReading.clues || createDivinationClues([selectedReading.bodyTrigram, selectedReading.useTrigram])).map((clue) => (
                  <div key={clue.trigram} className="rounded border border-black/10 bg-[#F5FAFA] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#063F4A]">{clue.trigram}卦 · {clue.title}</p>
                      <span className="text-xl">{trigrams.find((trigram) => trigram.name === clue.trigram)?.symbol}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-ink/62">
                      <p><span className="font-semibold text-ink">人物：</span>{clue.people}</p>
                      <p><span className="font-semibold text-ink">行为：</span>{clue.behavior}</p>
                      <p><span className="font-semibold text-ink">空间：</span>{clue.space}</p>
                      <p><span className="font-semibold text-ink">身心提醒：</span>{clue.bodyHint}</p>
                    </div>
                    <p className="mt-3 rounded bg-white p-3 text-sm font-semibold leading-6 text-[#063F4A]">{clue.prompt}</p>
                  </div>
                ))}
              </div>
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
  const moduleContentRef = useRef<HTMLElement | null>(null);
  const [activeModule, setActiveModule] = useState<DashboardModule>("fortune");
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>("today");
  const [currentTier, setCurrentTier] = useState<MembershipTier>("free");
  const [pointBalance, setPointBalance] = useState(0);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(emptyMemberProfile);
  const [referralCode, setReferralCode] = useState(companySponsorCode);
  const [sponsorCode, setSponsorCode] = useState(companySponsorCode);
  const [referralSource, setReferralSource] = useState("organic_hq");
  const [partnerPackage, setPartnerPackage] = useState<PartnerPackage>("none");
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [membershipMessage, setMembershipMessage] = useState("正式模式：会员等级只会在付款成功后由系统升级。");
  const [aiStarterPrompt, setAiStarterPrompt] = useState("");
  const [reportPreset, setReportPreset] = useState<ReportDemandPreset | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasPartnerAccess = partnerPackage !== "none";
  const active = modules.find((module) => module.id === activeModule) || modules[0];
  const availableDashboardCategories = hasPartnerAccess ? [...memberDashboardCategories, partnerDashboardCategory] : memberDashboardCategories;
  const activeCategoryConfig = dashboardCategories.find((category) => category.id === activeCategory) || dashboardCategories[0];
  const visibleModules = modules.filter((module) => activeCategoryConfig.modules.includes(module.id));
  const currentPlan = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const accountStats = compactAccountStats(dashboardStats, pointBalance, currentTier);

  useEffect(() => {
    let mounted = true;

    async function loadSupabaseProfile() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        if (mounted) {
          setMemberProfile(emptyMemberProfile);
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
          setMemberProfile(emptyMemberProfile);
          setAuthStatus("unauthenticated");
          router.replace("/auth");
        }
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const metadata = user.user_metadata || {};

      if (mounted) {
        if (profile) {
          setMemberProfile(profileRowToMemberProfile(profile));
          setCurrentTier(profile.membership_tier);
          setPointBalance(profile.credit_balance);
          setPartnerPackage((profile.partner_package as PartnerPackage | undefined) || (metadata.partner_package as PartnerPackage | undefined) || "none");
          setReferralCode(normalizeReferralCode(metadata.referral_code as string | undefined) || generateShortReferralCode(user.id));
          setSponsorCode(normalizeReferralCode(metadata.sponsor_code as string | undefined) || companySponsorCode);
          setReferralSource((metadata.referral_source as string | undefined) || "organic_hq");
        } else {
          setMemberProfile({
            ...emptyMemberProfile,
            email: user.email || emptyMemberProfile.email,
            name: user.user_metadata?.full_name || emptyMemberProfile.name
          });
          setReferralCode(normalizeReferralCode(metadata.referral_code as string | undefined) || companySponsorCode);
          setSponsorCode(normalizeReferralCode(metadata.sponsor_code as string | undefined) || companySponsorCode);
          setReferralSource((metadata.referral_source as string | undefined) || "organic_hq");
          setPartnerPackage((metadata.partner_package as PartnerPackage | undefined) || "none");
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
    if (authStatus !== "authenticated") return;

    const dismissed = window.localStorage.getItem("aifengshui-onboarding-dismissed");
    setShowOnboarding(!dismissed);
  }, [authStatus]);

  function syncCreditDelta(delta: number, source: string, description: string) {
    const supabase = createBrowserSupabaseClient();

    supabase?.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      const response = await fetch("/api/credits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ delta, source, description })
      });
      const payload = (await response.json().catch(() => ({}))) as { creditBalance?: number };

      if (response.ok && typeof payload.creditBalance === "number") {
        setPointBalance(payload.creditBalance);
        return;
      }

      if (delta > 0) {
        setPointBalance((current) => Math.max(0, current - delta));
      }
    }).catch(() => {
      if (delta > 0) {
        setPointBalance((current) => Math.max(0, current - delta));
      }
    });
  }

  function spendPoints(amount: number, source = "member_usage", description = "会员端功能消耗") {
    if (pointBalance < amount) {
      return false;
    }

    setPointBalance((current) => current - amount);
    syncCreditDelta(-amount, source, description);
    return true;
  }

  function earnPoints(amount: number, source = "member_reward", description = "会员端奖励点数") {
    setPointBalance((current) => current + amount);
    syncCreditDelta(amount, source, description);
  }

  function openModule(module: DashboardModule) {
    const nextCategory = moduleCategoryMap[module];
    if (nextCategory) setActiveCategory(nextCategory);

    if (module === "partner" && !hasPartnerAccess) {
      setMembershipMessage("创业会员经营中心只开放给已购买 8888 / 16888 / 38888 创业配套的会员。普通 Free、进阶会员版、高阶战略版无法进入。");
      setActiveModule("wallet");
      setActiveCategory("reports");
      window.setTimeout(() => {
        moduleContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }

    setActiveModule(module);
    window.setTimeout(() => {
      moduleContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function openCategory(category: DashboardCategory) {
    if (category === "partner" && !hasPartnerAccess) {
      setMembershipMessage("创业会员经营中心只开放给已购买 8888 / 16888 / 38888 创业配套的会员。普通会员可先使用邀请好友功能。");
      openModule("invite");
      return;
    }

    setActiveCategory(category);
    setActiveModule(defaultModuleByCategory[category]);
    window.setTimeout(() => {
      moduleContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function dismissOnboarding() {
    window.localStorage.setItem("aifengshui-onboarding-dismissed", "1");
    setShowOnboarding(false);
  }

  function handleSelectAiPrompt(prompt: string, module: DashboardModule) {
    setAiStarterPrompt(prompt);
    openModule(module);
  }

  function handleSelectReportDemand(preset: ReportDemandPreset) {
    setReportPreset(preset);
    openModule("wallet");
  }

  function handleChatNextAction(target: "report" | "shop" | "courses") {
    if (target === "report") {
      handleSelectReportDemand(demandReportCards[4].preset);
      return;
    }

    openModule(target);
  }

  function requestMembershipUpgrade(tier: MembershipTier) {
    const plan = membershipTiers.find((item) => item.id === tier);
    if (!plan || tier === currentTier) return;

    setMembershipMessage(`已选择 ${plan.name}（${plan.price}）。下一步应连接 Stripe / FPX / 本地支付网关创建订阅订单，付款成功后后台自动升级会员。`);
    openModule("wallet");
  }

  if (authStatus !== "authenticated") {
    return (
      <AppShell>
        <main className="premium-dashboard-bg min-h-screen px-5 py-16">
          <div className="premium-card mx-auto max-w-3xl p-8 text-center">
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
      <main className="premium-dashboard-bg min-h-screen px-5 pb-24 pt-8 md:pb-10">
        <div className="mx-auto max-w-7xl">
          <TodayActionCenter currentPlan={currentPlan} currentPoints={pointBalance} hasPartnerAccess={hasPartnerAccess} onOpenModule={openModule} />
          {showOnboarding ? (
            <MemberOnboardingGuide
              memberProfile={memberProfile}
              onOpenModule={openModule}
              onSelectPrompt={handleSelectAiPrompt}
              onSelectReport={handleSelectReportDemand}
              onDismiss={dismissOnboarding}
            />
          ) : null}
          <AiQuestionStarter onSelectPrompt={handleSelectAiPrompt} />
          <ReportDemandPanel onSelectReport={handleSelectReportDemand} />
          <ProfileOverviewPanel memberProfile={memberProfile} onOpenProfile={() => openModule("profile")} />
          <AccountSummaryBar
            accountStats={accountStats}
            partnerPackage={partnerPackage}
            membershipMessage={membershipMessage}
            pointBalance={pointBalance}
            onOpenWallet={() => openModule("wallet")}
            onOpenInvite={() => openModule("invite")}
          />
          <MembershipPlanPanel currentTier={currentTier} onRequestUpgrade={requestMembershipUpgrade} />
          <TodayAssistantPanel onOpenModule={openModule} onSelectPrompt={handleSelectAiPrompt} onSelectReport={handleSelectReportDemand} />

          <section className="premium-card premium-glow mt-6 p-4 md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-5 text-[#063F4A]" />
                <h2 className="text-xl font-semibold">会员功能</h2>
              </div>
              <p className="text-sm text-ink/55">当前打开：{active.title}</p>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              {availableDashboardCategories.map((category) => {
                const activeCategoryButton = activeCategory === category.id;
                const partnerCategoryLocked = category.id === "partner" && !hasPartnerAccess;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => openCategory(category.id)}
                    className={[
                      "rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-1",
                      activeCategoryButton
                        ? "border-[#C79A54] bg-gradient-to-br from-[#063F4A] to-[#022B33] text-white shadow-[0_16px_36px_rgba(6,63,74,0.22)]"
                        : "border-[#CFE2E5] bg-white/88 text-ink shadow-[0_10px_26px_rgba(6,63,74,0.06)] hover:border-[#C79A54]/50"
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{partnerCategoryLocked ? "邀请好友" : category.title}</span>
                      {partnerCategoryLocked ? <LockKeyhole className={activeCategoryButton ? "size-4 text-[#C79A54]" : "size-4 text-ink/35"} /> : null}
                    </div>
                    <p className={activeCategoryButton ? "mt-1 text-xs leading-5 text-white/58" : "mt-1 text-xs leading-5 text-ink/50"}>
                      {partnerCategoryLocked ? "推荐码、分享链接；创业中心购买配套后开放" : category.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="premium-card mt-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#063F4A]">{activeCategoryConfig.title}</h3>
                  <p className="mt-1 text-sm text-ink/55">{activeCategoryConfig.desc}</p>
                </div>
                <StatusPill>{visibleModules.length} 个入口</StatusPill>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {visibleModules.map((module) => {
                const partnerLocked = module.id === "partner" && !hasPartnerAccess;

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    active={module.id === activeModule}
                    locked={partnerLocked}
                    lockLabel="创业配套"
                    onClick={() => openModule(module.id)}
                  />
                );
              })}
              </div>
            </div>
          </section>

          <section ref={moduleContentRef} className="scroll-mt-28 mt-6">
            {activeModule === "fortune" ? <TodayFortune currentTier={currentTier} memberProfile={memberProfile} /> : null}
            {activeModule === "calendar" ? <FortuneCalendarModule currentTier={currentTier} /> : null}
            {activeModule === "profile" ? (
              <DestinyProfileModule memberProfile={memberProfile} onProfileUpdated={setMemberProfile} />
            ) : null}
            {activeModule === "growth" ? <GrowthPlaybookModule /> : null}
            {activeModule === "vault" ? <FavoritesVaultModule /> : null}
            {activeModule === "ai" ? (
              <FengshuiChat
                tier={currentTier}
                tierName={currentPlan.name}
                aiMode={currentPlan.positioning}
                initialPrompt={aiStarterPrompt}
                profile={memberProfile}
                points={pointBalance}
                onNextAction={handleChatNextAction}
                onSpendPoints={spendPoints}
                onRefundPoints={earnPoints}
              />
            ) : null}
            {activeModule === "divination" ? (
              <DivinationModule
                points={pointBalance}
                onSpendPoints={spendPoints}
                onEarnPoints={earnPoints}
                onOpenModule={openModule}
              />
            ) : null}
            {activeModule === "hexagram64" ? (
              <Hexagram64Module points={pointBalance} onSpendPoints={spendPoints} />
            ) : null}
            {activeModule === "sigil" ? (
              <SigilModule points={pointBalance} onSpendPoints={spendPoints} />
            ) : null}
            {activeModule === "invite" ? (
              <InviteFriendsModule referralCode={referralCode} sponsorCode={sponsorCode} referralSource={referralSource} />
            ) : null}
            {activeModule === "partner" && hasPartnerAccess ? (
              <PartnerCommandCenter referralCode={referralCode} onOpenModule={openModule} />
            ) : null}
            {activeModule === "wallet" ? (
              <WalletAndReports
                currentTier={currentTier}
                memberProfile={memberProfile}
                points={pointBalance}
                onCreditBalanceChange={setPointBalance}
                reportPreset={reportPreset}
              />
            ) : null}
            {activeModule === "shop" ? <ProductModule /> : null}
            {activeModule === "courses" ? <CourseModule /> : null}
            {activeModule === "team" ? <HierarchyTree /> : null}
          </section>
        </div>
      </main>
      <MobileBottomNav categories={availableDashboardCategories} activeCategory={activeCategory} onOpenCategory={openCategory} />
    </AppShell>
  );
}
