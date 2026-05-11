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
  | "invite"
  | "partner"
  | "wallet"
  | "shop"
  | "courses"
  | "team";

type PartnerPackage = "none" | "startup_8888" | "partner_16888" | "regional_38888";

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
    metric: "52 人",
    icon: Trophy
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
  { type: "AI 回复", title: "开新店前先确认选址与预算", desc: "来自 AI 风水师对开业问题的初步建议。" },
  { type: "报告", title: "财运报告 · 守正现金流", desc: "正财稳定，偏财不宜冒进。" },
  { type: "运势", title: "05/04 宜签约", desc: "适合发布、合作、签约与客户邀约。" },
  { type: "产品", title: "办公室布局套装", desc: "适合把事业运势落到空间调整。" },
  { type: "课程", title: "商业择日与开业布局", desc: "适合创业者学习择时与动线逻辑。" },
  { type: "行动", title: "每周五财务复盘", desc: "固定整理现金流、应收款与预算。" },
  { type: "分享卡", title: "今日事业评分 91", desc: "可用于社群分享与推荐转化。" },
  { type: "洞察", title: "先整理后扩张", desc: "本周适合先做清单，再谈资源。" }
] as const;

const partnerMetrics = [
  ["Free 线索", "126", "43 位本周活跃"],
  ["创业配套", "52", "31 / 15 / 6"],
  ["本月新增", "18", "+12 Free / +6 配套"],
  ["Pool Share", "RM30,624", "本月总分享金额"]
] as const;

const partnerPackageMix = [
  ["8888 创业启动包", 31, "引导完成首 10 位 Free 邀请"],
  ["16888 事业合伙人", 15, "检查 Pool 资格与培训出席"],
  ["38888 区域导师", 6, "安排区域课程与导师带教"]
] as const;

const partnerLeadSegments = [
  ["Free 新人未完成资料", "38 人", "发送生日资料提醒"],
  ["Free 已连续打卡 7 天", "24 人", "推荐 AI 深度报告"],
  ["已生成报告未咨询", "12 人", "邀约大师咨询"],
  ["8888 已招 5 人以上", "9 人", "引导升级 16888"],
  ["16888 活跃合伙人", "5 人", "安排 Pool 规则说明"],
  ["38888 区域代理", "1 人", "确认区域课程计划"]
] as const;

const partnerFollowUps = [
  "联系 21 位 Free 会员完成命理资料",
  "跟进 8 位报告用户转大师咨询",
  "本周举办一场创业说明会",
  "复核 3 位合伙人的推荐归属与佣金状态"
] as const;

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
    meihuaInput?: MeihuaReportInput;
    ziweiInput?: ZiweiReportInput;
    numerologyInput?: NumerologyReportInput;
  };
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

type BaziReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  calendarType: "Gregorian" | "Lunar";
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
  focus: "career" | "wealth" | "relationship" | "health" | "business" | "annual luck";
};

type NumerologyReportInput = {
  fullName: string;
  gender: string;
  birthDate: string;
  birthTime: string;
  focus: "career" | "wealth" | "relationship" | "personal growth" | "business" | "yearly luck";
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
    ...visibleReportSections(report).flatMap((section) => [section.title, section.content, ""]),
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
  return {
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: memberProfile.birthDate,
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    calendarType: "Gregorian",
    focus: "career"
  };
}

function defaultMeihuaReportInput(memberProfile: MemberProfile): MeihuaReportInput {
  return {
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: memberProfile.birthDate,
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    questionCategory: "business",
    specificQuestion: "我现在是否适合推进这个重要计划？",
    divinationDateTime: new Date().toISOString().slice(0, 16),
    manualNumbers: "8, 6, 3",
    mode: "time"
  };
}

function defaultZiweiReportInput(memberProfile: MemberProfile): ZiweiReportInput {
  return {
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: memberProfile.birthDate,
    birthTime: memberProfile.birthTime,
    birthLocation: memberProfile.region,
    calendarType: "Gregorian",
    focus: "career"
  };
}

function defaultNumerologyReportInput(memberProfile: MemberProfile): NumerologyReportInput {
  return {
    fullName: memberProfile.name,
    gender: memberProfile.gender,
    birthDate: memberProfile.birthDate,
    birthTime: memberProfile.birthTime,
    focus: "personal growth"
  };
}

function createBaziDestinyReport(input: BaziReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">): SavedReport {
  const focusLabel = focusLabels[input.focus];

  return {
    id: `bazi-destiny-${Date.now()}`,
    title: "八字命理测算完整报告",
    tag: "命盘",
    points: baziReportCost,
    metadata: {
      kind: "bazi_destiny",
      baziInput: input
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary: aiContent?.summary || `${input.fullName} 的八字报告已围绕「${focusLabel}」生成。整体命局重视稳定、规划与长期累积，适合先建立标准，再借流动资源打开机会。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          {
            title: "命局总论",
            content: `以 ${input.birthDate} ${input.birthTime || "未提供时辰"}、${input.birthLocation || "未提供出生地"} 为基础，报告从四柱、十神、五行强弱、大运与流年综合判断，重点观察${focusLabel}相关趋势。`
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
  const category = meihuaCategoryLabels[input.questionCategory];

  return {
    id: `meihua-divination-${Date.now()}`,
    title: "梅花易数测算完整报告",
    tag: "占断",
    points: meihuaReportCost,
    metadata: {
      kind: "meihua_divination",
      meihuaInput: input
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
      `${input.fullName} 的梅花易数报告已围绕「${category}」问题生成。本卦看现状，动爻看转折，变卦看趋势，重点是选择合适时机和行动方式。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "现状判断", content: `问题：${input.specificQuestion || category}。当前宜先观局势，确认体用关系，不宜急于硬推。` },
          { title: "转折趋势", content: "动爻提示事情会在沟通、时间或资源配置上出现变化，先守后动更稳。" },
          { title: "行动建议", content: "先整理资料与边界，选择有利时间窗口推进；若遇冲突，以缓和沟通和证据整理为先。" }
        ]
  };
}

function createZiweiDestinyReport(input: ZiweiReportInput, aiContent?: Pick<SavedReport, "summary" | "sections">): SavedReport {
  const focusLabel = ziweiFocusLabels[input.focus];

  return {
    id: `ziwei-destiny-${Date.now()}`,
    title: "紫微斗数命盘详细解析报告",
    tag: "紫微",
    points: ziweiReportCost,
    metadata: {
      kind: "ziwei_destiny",
      ziweiInput: input
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
      `${input.fullName} 的紫微斗数命盘已围绕「${focusLabel}」生成。报告重点读取命宫、身宫、官禄宫、财帛宫、大限与流年触发。`,
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
  const focusLabel = numerologyFocusLabels[input.focus];

  return {
    id: `numerology-life-path-${Date.now()}`,
    title: "数字命理测算完整报告",
    tag: "数字",
    points: numerologyReportCost,
    metadata: {
      kind: "numerology_life_path",
      numerologyInput: input
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
      `${input.fullName} 的数字命理报告已围绕「${focusLabel}」生成。报告重点读取生命路径数、命运数、灵魂渴望数、人格数、生日数、成熟数与个人年数。`,
    sections: aiContent?.sections?.length
      ? aiContent.sections
      : [
          { title: "核心数字", content: "生命路径数代表人生主线，命运数代表外在使命，灵魂渴望数代表内在驱动力，人格数代表外界感知。" },
          { title: "能量分布", content: "1-9 数字能量显示表达、行动、关系、稳定、自由、责任、洞察、财富与完成力。缺失数字是可训练的成长课题。" },
          { title: "行动建议", content: "把天赋转化为固定节奏，把年度主题拆成季度行动。重要合作前先确认边界、资源与时间表。" }
        ]
  };
}

function createIntegratedDestinyReport(input: BaziReportInput): SavedReport {
  const focusLabel = focusLabels[input.focus];

  return {
    id: `integrated-destiny-${Date.now()}`,
    title: "综合命理决策报告",
    tag: "综合",
    points: integratedReportCost,
    metadata: {
      kind: "integrated_destiny",
      baziInput: input,
      ziweiInput: {
        ...input,
        focus: input.focus === "yearly luck" ? "annual luck" : input.focus
      } as ZiweiReportInput,
      numerologyInput: {
        fullName: input.fullName,
        gender: input.gender,
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        focus: input.focus === "health" ? "personal growth" : input.focus
      } as NumerologyReportInput
    },
    createdAt: new Intl.DateTimeFormat("zh-MY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date()),
    summary: `${input.fullName} 的综合命理决策报告已围绕「${focusLabel}」生成。报告结合八字、紫微斗数、梅花易数与数字命理，输出长期格局、阶段趋势、当下时机与行动策略。`,
    sections: [
      { title: "八字底盘", content: "从四柱、十神与五行强弱读取性格底层、资源结构、事业财运基础和需要补足的行动能量。" },
      { title: "紫微阶段", content: "从命宫、官禄宫、财帛宫、夫妻宫与大限流年观察人生阶段、关键宫位和适合放大的资源。" },
      { title: "梅花时机", content: "以当前问题为起点，观察本卦、互卦、变卦与动爻，判断现在该进、该守、该转还是该等。" },
      { title: "数字节奏", content: "用生命路径数、命运数、个人年数与 1-9 能量分布，校准个人执行习惯、沟通模式和年度主题。" },
      { title: "综合建议", content: "先确定长期方向，再筛选短期机会。凡涉及合作、投资、事业转换，必须同时看时机、资源、边界和风险承载。" }
    ]
  };
}

function visibleReportSections(report: SavedReport) {
  return report.sections.filter((section) => section.title !== "__metadata");
}

function getBaziPillars(): BaziPillar[] {
  return [
    { label: "年柱", stem: "庚", branch: "申", hiddenStems: "庚 / 壬 / 戊", tenGods: "食神 / 偏财 / 比肩", naYin: "石榴木", emptyBranch: "子丑" },
    { label: "月柱", stem: "壬", branch: "午", hiddenStems: "丁 / 己", tenGods: "偏财 / 正印 / 劫财", naYin: "杨柳木", emptyBranch: "申酉" },
    { label: "日柱", stem: "戊", branch: "戌", hiddenStems: "戊 / 辛 / 丁", tenGods: "日主 / 伤官 / 正印", naYin: "平地木", emptyBranch: "辰巳" },
    { label: "时柱", stem: "辛", branch: "酉", hiddenStems: "辛", tenGods: "伤官 / 金旺", naYin: "石榴木", emptyBranch: "子丑" }
  ];
}

function getBaziElementRows() {
  return [
    { element: "金", value: 30, tone: "表达、规则、专业输出明显，适合顾问、系统与品牌标准化。" },
    { element: "木", value: 8, tone: "成长与学习需要主动补足，可通过课程、规划和长期项目提升。" },
    { element: "水", value: 15, tone: "财流与流动性有机会，但要避免资金过散或情绪型决策。" },
    { element: "火", value: 20, tone: "名气、曝光与执行热度足，需控制急躁和过度消耗。" },
    { element: "土", value: 27, tone: "承载力强，适合稳盘、管理、资源整合和长期责任。" }
  ];
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

function getZiweiPalaceRows() {
  const palaces = ["命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫", "迁移宫", "交友宫", "官禄宫", "田宅宫", "福德宫", "父母宫"];
  const stars = ["紫微 天府", "天机 太阴", "贪狼 红鸾", "天同 天梁", "武曲 禄存", "巨门 天刑", "太阳 文昌", "七杀 左辅", "廉贞 天相", "破军 右弼", "太阴 天魁", "天梁 天钺"];
  const minor = ["文昌", "文曲", "红鸾", "天喜", "禄存", "陀罗", "天马", "左辅", "右弼", "地空", "天魁", "天钺"];
  const transforms = ["化禄", "", "化科", "", "化权", "化忌", "", "", "化禄", "", "化科", ""];

  return palaces.map((palace, index) => ({
    palace,
    age: `${index * 10 + 3}-${index * 10 + 12}`,
    stars: stars[index],
    minor: minor[index],
    transform: transforms[index] || "平",
    summary: index % 3 === 0 ? "主轴明确，宜稳中推进。" : index % 3 === 1 ? "重视资源整合与边界。" : "先观察，再择机行动。"
  }));
}

function getZiweiLuckRows() {
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

function getZiweiAnnualRows() {
  const startYear = new Date().getFullYear();
  const palaces = ["官禄宫", "财帛宫", "夫妻宫", "迁移宫", "福德宫", "命宫", "田宅宫", "交友宫", "父母宫", "疾厄宫", "子女宫"];

  return Array.from({ length: 11 }, (_, index) => ({
    year: startYear + index,
    palace: palaces[index],
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
  const birthDate = input?.birthDate || "1980-06-14";
  const name = input?.fullName || "冯家奇";
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
  const lines = [
    report.summary,
    ...visibleReportSections(report).map((section) => `${section.title}：${section.content}`)
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
  ${visibleReportSections(report)
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
      className={`group rounded border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
        active
          ? "border-[#C79A54]/70 bg-[#063F4A] text-white shadow-soft"
          : "border-black/10 bg-white text-ink hover:border-[#C79A54]/45"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-9 place-items-center rounded ${
            active ? "bg-white/12 text-[#C79A54]" : locked ? "bg-[#F5FAFA] text-ink/35" : "bg-[#DDEFF2] text-[#063F4A]"
          }`}
        >
          {locked ? <LockKeyhole className="size-5" /> : <Icon className="size-5" />}
        </span>
        <span
          className={`rounded px-2.5 py-1 text-xs font-semibold ${
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
  onRequestUpgrade
}: {
  currentTier: MembershipTier;
  onRequestUpgrade: (tier: MembershipTier) => void;
}) {
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const tierRank: Record<MembershipTier, number> = { free: 0, tactical: 1, strategic: 2 };

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
          const included = tierRank[tier.id] < tierRank[currentTier];
          const canUpgrade = tierRank[tier.id] > tierRank[currentTier];

          return (
            <article
              key={tier.id}
              className={`rounded border p-5 text-left transition ${
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
              <button
                type="button"
                onClick={() => onRequestUpgrade(tier.id)}
                disabled={!canUpgrade}
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded px-4 py-3 text-sm font-semibold transition ${
                  canUpgrade
                    ? "bg-[#1495A0] text-white hover:bg-[#0F7F88]"
                    : active
                      ? "cursor-default bg-white/12 text-white"
                      : "cursor-default bg-white text-ink/45"
                }`}
              >
                {active ? "当前方案" : included ? "已包含权益" : `付费升级到 ${tier.name}`}
                {canUpgrade ? <CreditCard className="size-4" /> : null}
              </button>
            </article>
          );
        })}
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
  const [selectedPalace, setSelectedPalace] = useState<(typeof palaceExplanations)[number] | null>(null);

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
  const pillars = getBaziPillars();
  const elements = getBaziElementRows();
  const luckRows = getTenYearLuckRows();
  const annualRows = getAnnualLuckRows();
  const scoreRows = getBaziScoreRows();
  const baziInput = report.metadata?.baziInput;
  const displayName = baziInput?.fullName || memberProfile.name;
  const displayBirthDate = baziInput?.birthDate || memberProfile.birthDate;
  const displayBirthTime = baziInput?.birthTime || memberProfile.birthTimeLabel;
  const displayBirthLocation = baziInput?.birthLocation || memberProfile.region;
  const pieStyle = {
    background:
      "conic-gradient(#C79A54 0 30%, #1495A0 30% 38%, #9ED8DF 38% 53%, #B91C1C 53% 73%, #E8D4A8 73% 100%)"
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">一、八字排盘</h4>
            <span className="text-sm font-semibold text-[#063F4A]">日主：戊土 · 命盘核心</span>
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
              <p className="mt-1 text-sm leading-6 text-ink/65">木、水为主要调候，利学习、规划、流动资金与业务开拓。</p>
            </div>
            <div className="rounded border border-[#C79A54]/25 bg-[#F5FAFA] p-3">
              <p className="text-sm font-semibold text-[#063F4A]">忌神提醒</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">火土过旺时易固执、压力内化，重大决定不宜急推。</p>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["三、性格分析", "戊土日主重承诺、守信用、能承载压力。金旺带来表达、制度与专业输出能力，但情绪紧绷时容易过度控制。"],
          ["四、事业与财运", "适合管理、顾问、地产空间、教育培训、系统服务与长期信用型行业。财富宜走正财、长期复利与可复制产品。"],
          ["五、感情婚姻", "关系中重安全感与实际行动，适合慢热稳定型伴侣。沟通上要减少闷着不说，避免把责任感变成压力。"],
          ["六、健康倾向", "五行土金较显，需留意消化、睡眠、压力与呼吸系统保养。本段仅为生活提醒，不构成医疗建议。"]
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
                <tr key={row.join("-")}>{row.map((cell) => <td key={cell} className="px-3 py-2 text-ink/65">{cell}</td>)}</tr>
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
          {visibleReportSections(report).map((section) => (
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
  const input = report.metadata?.baziInput;
  const core = getNumerologyCore(report.metadata?.numerologyInput);
  const scoreRows = [
    ["长期格局", 86],
    ["事业机会", 88],
    ["财务节奏", 82],
    ["行动时机", 79],
    ["人和资源", 84],
    ["风险控制", 81]
  ] as const;

  return (
    <div className="grid gap-4">
      <section className="rounded border border-[#C79A54]/40 bg-[#102F38] p-5 text-white">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C79A54]">Integrated Metaphysics Engine</p>
            <h4 className="mt-3 text-3xl font-semibold">四术合参 · 决策总览</h4>
            <p className="mt-3 text-sm leading-6 text-white/70">
              以八字定底盘，紫微看阶段，梅花判时机，数字命理校准行为节奏。适合事业、合作、投资、转型与人生关键节点前使用。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["八字", "命局底盘", "五行强弱 / 十神 / 大运"],
              ["紫微", "人生宫位", "命宫 / 财帛 / 官禄 / 大限"],
              ["梅花", "当下时机", "本卦 / 动爻 / 变卦"],
              ["数字", "行为节奏", `${core.lifePath} 生命路径 / ${core.personalYear} 个人年`]
            ].map(([title, label, desc]) => (
              <div key={title} className="rounded border border-white/15 bg-white/8 p-4">
                <p className="text-2xl font-semibold text-[#E8D4A8]">{title}</p>
                <p className="mt-1 text-sm font-semibold">{label}</p>
                <p className="mt-2 text-xs leading-5 text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["一、八字底盘", "先判断日主、五行流通、十神结构与长期资源。这里决定一个人适合用什么方式累积成果。"],
          ["二、紫微阶段", "再看命宫、官禄、财帛、夫妻与大限，确认当前人生阶段应该放大什么、收敛什么。"],
          ["三、梅花时机", "针对当前问题看本卦与变卦，判断现在适合推进、等待、转向还是先处理阻力。"],
          ["四、数字节奏", "用生命路径和个人年数看执行习惯，避免方向对了，但节奏、沟通和习惯拖慢成果。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#063F4A]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">五、交叉判断矩阵</h4>
        <div className="mt-4 overflow-x-auto rounded border border-[#C79A54]/25">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#F5FAFA] text-[#063F4A]">
              <tr>{["系统", "看什么", "当前重点", "决策用途"].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#C79A54]/15">
              {[
                ["八字", "五行强弱 / 十神", input ? focusLabels[input.focus] : "事业与财运", "判断长期适配度"],
                ["紫微", "十二宫 / 大限流年", "命宫、官禄、财帛", "判断阶段与资源"],
                ["梅花", "本卦 / 动爻 / 变卦", "当下问题与转折", "判断短线时机"],
                ["数字命理", "核心数字 / 年度数字", `生命路径 ${core.lifePath} / 个人年 ${core.personalYear}`, "校准执行节奏"]
              ].map((row) => (
                <tr key={row[0]}>{row.map((cell) => <td key={cell} className="px-3 py-2 text-ink/65">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
          <h4 className="rounded bg-[#7A1F16] px-4 py-2 font-semibold text-white">六、综合评分</h4>
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
          <h4 className="rounded bg-[#063F4A] px-4 py-2 font-semibold text-white">七、最终行动策略</h4>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleReportSections(report).map((section) => (
              <div key={section.title} className="rounded border border-[#C79A54]/20 bg-[#F5FAFA] p-4">
                <p className="font-semibold text-[#063F4A]">{section.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink/62">{section.content}</p>
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
  const palaceRows = getZiweiPalaceRows();
  const luckRows = getZiweiLuckRows();
  const annualRows = getZiweiAnnualRows();
  const scoreRows = getZiweiScoreRows();

  return (
    <div className="grid gap-4">
      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">一、命盘基础资料</h4>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              {[
                ["命宫", "寅宫"],
                ["身宫", "申宫"],
                ["五行局", "阳男土五局"],
                ["阴阳性别", input?.gender === "女" ? "阴女" : "阳男"],
                ["主星", "紫微 · 天府"],
                ["命主", "廉贞星"],
                ["身主", "火星"],
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
        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded border border-[#C79A54]/35 md:grid-cols-4">
          {palaceRows.map((row) => (
            <div key={row.palace} className="min-h-40 border-b border-r border-[#C79A54]/20 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#3B1B66]">{row.palace}</p>
                <span className="rounded bg-[#F5FAFA] px-2 py-0.5 text-xs text-ink/50">{row.age}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-[#C79A54]">{row.stars}</p>
              <p className="mt-1 text-xs text-ink/55">辅星：{row.minor}</p>
              <p className="mt-1 text-xs text-[#7A1F16]">四化：{row.transform}</p>
              <p className="mt-2 text-xs leading-5 text-ink/56">{row.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["三、命宫分析", "命宫紫微天府，重格局、责任与管理能力。优势是稳、能承载、愿意做长期布局；弱点是容易想太多、行动慢半拍。"],
          ["四、事业宫分析", "官禄宫利顾问、管理、教育、系统化服务、品牌与商业运营。适合带团队或打造标准化产品。"],
          ["五、财帛宫分析", "武曲禄存守财帛，财运宜走正财、专业收入、长期合作和资产配置，投资需避开高杠杆。"],
          ["六、感情健康", "夫妻宫重沟通与节奏，感情宜慢热稳定。疾厄宫提醒压力、睡眠、消化与规律作息。"]
        ].map(([title, content]) => (
          <article key={title} className="rounded border border-[#C79A54]/35 bg-white/85 p-4">
            <h4 className="font-semibold text-[#3B1B66]">{title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink/65">{content}</p>
          </article>
        ))}
      </section>

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">七、大限运势表</h4>
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
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">八、未来十年流年</h4>
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
          <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">九、评分摘要</h4>
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
          <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">十、重点星曜与建议</h4>
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

      <section className="rounded border border-[#C79A54]/40 bg-white/85 p-4">
        <h4 className="rounded bg-[#3B1B66] px-4 py-2 font-semibold text-white">十一、AI 综合解析</h4>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {visibleReportSections(report).map((section) => (
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
          {visibleReportSections(report).map((section) => (
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
  const displayName = baziInput?.fullName || memberProfile.name;
  const displayGender = baziInput?.gender || memberProfile.gender;
  const displayBirthDate = baziInput?.birthDate || memberProfile.birthDate;
  const displayBirthTime = baziInput?.birthTime || memberProfile.birthTimeLabel;
  const displayBirthLocation = baziInput?.birthLocation || memberProfile.region;
  const headerName = meihuaInput?.fullName || displayName;
  const headerGender = meihuaInput?.gender || displayGender;
  const headerBirthDate = meihuaInput?.birthDate || displayBirthDate;
  const headerBirthTime = meihuaInput?.birthTime || displayBirthTime;
  const headerBirthLocation = meihuaInput?.birthLocation || displayBirthLocation;
  const finalName = numerologyInput?.fullName || ziweiInput?.fullName || headerName;
  const finalGender = numerologyInput?.gender || ziweiInput?.gender || headerGender;
  const finalBirthDate = numerologyInput?.birthDate || ziweiInput?.birthDate || headerBirthDate;
  const finalBirthTime = numerologyInput?.birthTime || ziweiInput?.birthTime || headerBirthTime;
  const finalBirthLocation = ziweiInput?.birthLocation || headerBirthLocation;

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

        <article className="report-print-area rounded border-4 border-[#C79A54] bg-[#fffaf0] p-5 text-[#102F38] shadow-2xl md:p-8">
          <header className="grid gap-5 border-b-2 border-[#C79A54]/45 pb-5 md:grid-cols-[0.75fr_1.1fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C79A54]">AI Feng Shui Master</p>
              <h1 className="mt-3 text-5xl font-semibold leading-tight text-[#063F4A]">{finalName}</h1>
            </div>
            <div className="text-sm leading-7">
              <h2 className="text-center text-4xl font-semibold tracking-[0.12em] text-[#063F4A]">{report.title} 完整报告</h2>
              <div className="mt-4 grid gap-1 rounded border border-[#C79A54]/25 bg-white/70 p-4">
                <p>公历：{finalBirthDate}　{finalBirthTime}</p>
                <p>农历：一九八零年 五月 初二日 酉时</p>
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

function WalletAndReports({
  currentTier,
  memberProfile,
  points,
  onSpendPoints
}: {
  currentTier: MembershipTier;
  memberProfile: MemberProfile;
  points: number;
  onSpendPoints: (amount: number, source?: string, description?: string) => boolean;
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
  const [selectedPaidReport, setSelectedPaidReport] = useState<"integrated" | "bazi" | "ziwei" | "meihua" | "numerology">("integrated");
  const activeTier = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const strategicReportTitles = new Set(["流年报告", "开业择日报告", "公司风水初步分析报告"]);

  useEffect(() => {
    setBaziInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === demoMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === demoMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: !current.birthDate || current.birthDate === demoMemberProfile.birthDate ? memberProfile.birthDate : current.birthDate,
      birthTime: !current.birthTime || current.birthTime === demoMemberProfile.birthTime ? memberProfile.birthTime : current.birthTime,
      birthLocation: !current.birthLocation || current.birthLocation === demoMemberProfile.region ? memberProfile.region : current.birthLocation
    }));
    setMeihuaInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === demoMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === demoMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: !current.birthDate || current.birthDate === demoMemberProfile.birthDate ? memberProfile.birthDate : current.birthDate,
      birthTime: !current.birthTime || current.birthTime === demoMemberProfile.birthTime ? memberProfile.birthTime : current.birthTime,
      birthLocation: !current.birthLocation || current.birthLocation === demoMemberProfile.region ? memberProfile.region : current.birthLocation
    }));
    setZiweiInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === demoMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === demoMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: !current.birthDate || current.birthDate === demoMemberProfile.birthDate ? memberProfile.birthDate : current.birthDate,
      birthTime: !current.birthTime || current.birthTime === demoMemberProfile.birthTime ? memberProfile.birthTime : current.birthTime,
      birthLocation: !current.birthLocation || current.birthLocation === demoMemberProfile.region ? memberProfile.region : current.birthLocation
    }));
    setNumerologyInput((current) => ({
      ...current,
      fullName: !current.fullName || current.fullName === demoMemberProfile.name ? memberProfile.name : current.fullName,
      gender: !current.gender || current.gender === demoMemberProfile.gender ? memberProfile.gender : current.gender,
      birthDate: !current.birthDate || current.birthDate === demoMemberProfile.birthDate ? memberProfile.birthDate : current.birthDate,
      birthTime: !current.birthTime || current.birthTime === demoMemberProfile.birthTime ? memberProfile.birthTime : current.birthTime
    }));
  }, [memberProfile]);

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

  async function saveReportToCloud(report: SavedReport) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("reports").insert({
      id: report.id,
      user_id: user.id,
      title: report.title,
      tag: report.tag,
      points: report.points,
      summary: report.summary,
      sections: report.metadata
        ? [{ title: "__metadata", content: JSON.stringify(report.metadata) }, ...visibleReportSections(report)]
        : visibleReportSections(report)
    });
  }

  function handleOpenReport(report: (typeof reportTypes)[number]) {
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

    if (points < report.points || !onSpendPoints(report.points, "report_generation", `生成${report.title}`)) {
      setReportMessage("点数不足，请先充值点数后再生成报告。");
      return;
    }

    const generated = createSavedReport(report);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setReportMessage(`${report.title} 已生成，并正在保存到云端档案。`);
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage(`${report.title} 已保存，之后可以在报告档案找回。`));
  }

  async function handleGenerateBaziReport() {
    if (!baziInput.fullName || !baziInput.birthDate) {
      setBaziActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成八字命理完整报告。");
      return;
    }

    if (points < baziReportCost || !onSpendPoints(baziReportCost, "bazi_destiny_report", "生成八字命理测算完整报告")) {
      setBaziActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${baziReportCost} 点。`);
      setReportMessage("点数不足，八字命理完整报告需要 380 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingBazi(true);
    setBaziActionMessage("AI 正在生成报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成八字命理完整报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;

    try {
      const response = await fetch("/api/bazi-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baziInput)
      });
      const payload = await response.json();

      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = {
          summary: payload.summary,
          sections: payload.sections
        };
      }
    } catch {
      aiContent = undefined;
    } finally {
      setIsGeneratingBazi(false);
    }

    const generated = createBaziDestinyReport(baziInput, aiContent);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setBaziActionMessage("报告已生成并打开预览。");
    setReportMessage("八字命理测算完整报告已生成，并正在保存到云端档案。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage("八字命理测算完整报告已保存，之后可以在报告档案找回。"));
  }

  async function handleGenerateMeihuaReport() {
    if (!meihuaInput.fullName || !meihuaInput.specificQuestion) {
      setMeihuaActionMessage("请先填写姓名与具体问题。");
      setReportMessage("请先填写姓名与具体问题，才能生成梅花易数完整报告。");
      return;
    }

    if (points < meihuaReportCost || !onSpendPoints(meihuaReportCost, "meihua_divination_report", "生成梅花易数测算完整报告")) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meihuaInput)
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
    } catch {
      aiContent = undefined;
    } finally {
      setIsGeneratingMeihua(false);
    }

    const generated = createMeihuaDivinationReport(meihuaInput, aiContent);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setMeihuaActionMessage("报告已生成并打开预览。");
    setReportMessage("梅花易数测算完整报告已生成，并正在保存到云端档案。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage("梅花易数测算完整报告已保存，之后可以在报告档案找回。"));
  }

  async function handleGenerateZiweiReport() {
    if (!ziweiInput.fullName || !ziweiInput.birthDate) {
      setZiweiActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成紫微斗数命盘报告。");
      return;
    }

    if (points < ziweiReportCost || !onSpendPoints(ziweiReportCost, "ziwei_destiny_report", "生成紫微斗数命盘详细解析报告")) {
      setZiweiActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${ziweiReportCost} 点。`);
      setReportMessage("点数不足，紫微斗数命盘报告需要 420 点。请先充值点数后再生成。");
      return;
    }

    setIsGeneratingZiwei(true);
    setZiweiActionMessage("AI 正在排盘生成报告，通常需要 10-30 秒。");
    setReportMessage("AI 正在生成紫微斗数命盘详细解析报告，请稍候。");
    let aiContent: Pick<SavedReport, "summary" | "sections"> | undefined;

    try {
      const response = await fetch("/api/ziwei-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ziweiInput)
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
    } catch {
      aiContent = undefined;
    } finally {
      setIsGeneratingZiwei(false);
    }

    const generated = createZiweiDestinyReport(ziweiInput, aiContent);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setZiweiActionMessage("报告已生成并打开预览。");
    setReportMessage("紫微斗数命盘详细解析报告已生成，并正在保存到云端档案。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage("紫微斗数命盘详细解析报告已保存，之后可以在报告档案找回。"));
  }

  async function handleGenerateNumerologyReport() {
    if (!numerologyInput.fullName || !numerologyInput.birthDate) {
      setNumerologyActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成数字命理完整报告。");
      return;
    }

    if (points < numerologyReportCost || !onSpendPoints(numerologyReportCost, "numerology_life_path_report", "生成数字命理测算完整报告")) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(numerologyInput)
      });
      const payload = await response.json();
      if (payload.summary && Array.isArray(payload.sections)) {
        aiContent = { summary: payload.summary, sections: payload.sections };
      }
    } catch {
      aiContent = undefined;
    } finally {
      setIsGeneratingNumerology(false);
    }

    const generated = createNumerologyLifePathReport(numerologyInput, aiContent);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setNumerologyActionMessage("报告已生成并打开预览。");
    setReportMessage("数字命理测算完整报告已生成，并正在保存到云端档案。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage("数字命理测算完整报告已保存，之后可以在报告档案找回。"));
  }

  function handleGenerateIntegratedReport() {
    if (!baziInput.fullName || !baziInput.birthDate) {
      setBaziActionMessage("请先填写姓名与出生日期。");
      setReportMessage("请先填写姓名与出生日期，才能生成综合命理决策报告。");
      return;
    }

    if (points < integratedReportCost || !onSpendPoints(integratedReportCost, "integrated_destiny_report", "生成综合命理决策报告")) {
      setBaziActionMessage(`点数不足：当前 ${points.toLocaleString("en-US")} 点，需要 ${integratedReportCost} 点。`);
      setReportMessage("点数不足，综合命理决策报告需要 680 点。请先充值点数后再生成。");
      return;
    }

    const generated = createIntegratedDestinyReport(baziInput);
    const nextReports = [generated, ...savedReports].slice(0, 12);
    setSavedReports(nextReports);
    setSelectedReport(generated);
    setIsFullReportOpen(true);
    setBaziActionMessage("综合报告已生成并打开预览。");
    setReportMessage("综合命理决策报告已生成，并正在保存到云端档案。");
    window.localStorage.setItem(reportStorageKey, JSON.stringify(nextReports));
    saveReportToCloud(generated).then(() => setReportMessage("综合命理决策报告已保存，之后可以在报告档案找回。"));
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
          <p className="mt-2 text-4xl font-semibold text-[#063F4A]">{points.toLocaleString("en-US")}</p>
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
          <StatusPill>云端保存</StatusPill>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#F5FAFA] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Choose Report</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">选择报告类型</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">建议优先使用综合命理决策报告，再按需要生成单项专业报告。</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink/55">Step 1</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  { id: "integrated", title: "综合命理决策报告", cost: integratedReportCost, desc: "八字 + 紫微 + 梅花 + 数字命理，适合重大决策", tone: "border-[#C79A54] bg-[#102F38] text-white" },
                  { id: "bazi", title: "八字完整报告", cost: baziReportCost, desc: "命局底盘、五行、十神、大运流年", tone: "border-[#C79A54]/35 bg-white text-ink" },
                  { id: "ziwei", title: "紫微斗数报告", cost: ziweiReportCost, desc: "十二宫、命宫、大限、事业财帛", tone: "border-[#C79A54]/35 bg-white text-ink" },
                  { id: "meihua", title: "梅花易数报告", cost: meihuaReportCost, desc: "一事一问，看现状、转折与结果", tone: "border-[#C79A54]/35 bg-white text-ink" },
                  { id: "numerology", title: "数字命理报告", cost: numerologyReportCost, desc: "生命路径、姓名能量、年度节奏", tone: "border-[#C79A54]/35 bg-white text-ink" }
                ].map((item) => {
                  const active = selectedPaidReport === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedPaidReport(item.id as typeof selectedPaidReport)}
                      className={`rounded border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        active ? item.tone : "border-black/10 bg-white text-ink"
                      } ${item.id === "integrated" ? "md:col-span-2" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-[#C79A54] text-[#102F38]" : "bg-[#F5FAFA] text-ink/60"}`}>{item.cost} 点</span>
                      </div>
                      <p className={`mt-2 text-sm leading-6 ${active && item.id === "integrated" ? "text-white/70" : "text-ink/55"}`}>{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedPaidReport === "integrated" ? (
              <div className="mb-4 rounded border border-[#C79A54]/35 bg-[#fffaf0] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C79A54]">Premium Integrated Report</p>
                    <h3 className="mt-1 text-xl font-semibold text-[#063F4A]">综合命理决策报告</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">结合八字、紫微斗数、梅花易数与数字命理，适合事业、合作、投资、转型等关键决策。</p>
                  </div>
                  <span className="rounded-full bg-[#102F38] px-3 py-1 text-xs font-semibold text-white">{integratedReportCost} 点</span>
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
                    决策重点
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
                <button type="button" onClick={handleGenerateIntegratedReport} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-[#102F38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A0A0A]">
                  <FileText className="size-4" /> 生成综合命理决策报告
                </button>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-2 text-xs leading-5">
                  <span className="font-semibold text-[#063F4A]">当前点数：{points.toLocaleString("en-US")} 点</span>
                  <span className={points >= integratedReportCost ? "text-ink/55" : "font-semibold text-[#7A1F16]"}>建议重大决策前使用四术合参，报告会自动保存。</span>
                </div>
              </div>
            ) : null}
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-2 text-xs leading-5">
                <span className="font-semibold text-[#063F4A]">当前点数：{points.toLocaleString("en-US")} 点</span>
                <span className={points >= baziReportCost ? "text-ink/55" : "font-semibold text-[#7A1F16]"}>
                  {baziActionMessage}
                </span>
              </div>
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-2 text-xs leading-5">
                <span className="font-semibold text-[#063F4A]">当前点数：{points.toLocaleString("en-US")} 点</span>
                <span className={points >= meihuaReportCost ? "text-ink/55" : "font-semibold text-[#7A1F16]"}>{meihuaActionMessage}</span>
              </div>
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-2 text-xs leading-5">
                <span className="font-semibold text-[#063F4A]">当前点数：{points.toLocaleString("en-US")} 点</span>
                <span className={points >= ziweiReportCost ? "text-ink/55" : "font-semibold text-[#7A1F16]"}>{ziweiActionMessage}</span>
              </div>
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
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C79A54]/25 bg-white px-3 py-2 text-xs leading-5">
                <span className="font-semibold text-[#063F4A]">当前点数：{points.toLocaleString("en-US")} 点</span>
                <span className={points >= numerologyReportCost ? "text-ink/55" : "font-semibold text-[#7A1F16]"}>{numerologyActionMessage}</span>
              </div>
            </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {reportTypes.filter((report) => !["八字命理测算完整报告", "梅花易数测算完整报告", "紫微斗数命盘详细解析报告", "数字命理测算完整报告"].includes(report.title)).map((report) => {
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
                    <Download className="size-4" /> 下载 TXT
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                </div>

                <div className="mt-5 rounded border border-[#C79A54]/30 bg-[#C79A54]/10 p-4">
                  <p className="text-sm font-semibold text-[#063F4A]">报告摘要</p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{selectedReport.summary}</p>
                </div>

                <div className="mt-5 grid gap-3">
                  {visibleReportSections(selectedReport).map((section) => (
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
                <p className="mt-1 text-sm text-white/60">当前视角：已招收 {totalPartnerMembers} 位创业配套 + 126 位 Free 会员。</p>
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
            <p className="mt-3 text-5xl font-semibold tracking-tight text-[#063F4A]">RM30,624</p>
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
            <StatusPill>52 位</StatusPill>
          </div>
          <div className="mt-5 grid gap-3">
            {partnerPackageMix.map(([name, count, action]) => {
              const percentage = Math.round((count / totalPartnerMembers) * 100);

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
  const moduleContentRef = useRef<HTMLElement | null>(null);
  const [activeModule, setActiveModule] = useState<DashboardModule>("fortune");
  const [currentTier, setCurrentTier] = useState<MembershipTier>("free");
  const [pointBalance, setPointBalance] = useState(2680);
  const [memberProfile, setMemberProfile] = useState<MemberProfile>(demoMemberProfile);
  const [referralCode, setReferralCode] = useState("HQ001");
  const [sponsorCode, setSponsorCode] = useState("HQ001");
  const [referralSource, setReferralSource] = useState("organic_hq");
  const [partnerPackage, setPartnerPackage] = useState<PartnerPackage>("none");
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [membershipMessage, setMembershipMessage] = useState("正式模式：会员等级只会在付款成功后由系统升级。");
  const hasPartnerAccess = partnerPackage !== "none";
  const active = modules.find((module) => module.id === activeModule) || modules[0];
  const currentPlan = membershipTiers.find((tier) => tier.id === currentTier) || membershipTiers[1];
  const accountStats = dashboardStats.map((stat) => {
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

  useEffect(() => {
    let mounted = true;

    async function loadSupabaseProfile() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        if (mounted) {
          setMemberProfile(demoMemberProfile);
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
          setReferralCode((metadata.referral_code as string | undefined) || `YIXI-${user.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`);
          setSponsorCode((metadata.sponsor_code as string | undefined) || "HQ001");
          setReferralSource((metadata.referral_source as string | undefined) || "organic_hq");
        } else {
          setMemberProfile({
            ...demoMemberProfile,
            email: user.email || demoMemberProfile.email,
            name: user.user_metadata?.full_name || demoMemberProfile.name
          });
          setReferralCode((metadata.referral_code as string | undefined) || "HQ001");
          setSponsorCode((metadata.sponsor_code as string | undefined) || "HQ001");
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

  function syncCreditDelta(delta: number, source: string, description: string) {
    const supabase = createBrowserSupabaseClient();

    supabase?.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      fetch("/api/credits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ delta, source, description })
      }).catch(() => undefined);
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
    if (module === "partner" && !hasPartnerAccess) {
      setMembershipMessage("创业会员经营中心只开放给已购买 8888 / 16888 / 38888 创业配套的会员。普通 Free、进阶会员版、高阶战略版无法进入。");
      setActiveModule("wallet");
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

  function requestMembershipUpgrade(tier: MembershipTier) {
    const plan = membershipTiers.find((item) => item.id === tier);
    if (!plan || tier === currentTier) return;

    setMembershipMessage(`已选择 ${plan.name}（${plan.price}）。下一步应连接 Stripe / FPX / 本地支付网关创建订阅订单，付款成功后后台自动升级会员。`);
    openModule("wallet");
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
          <TodayActionCenter currentPlan={currentPlan} currentPoints={pointBalance} onOpenModule={openModule} />

          <section className="mt-6 rounded border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards className="size-5 text-[#063F4A]" />
                <h2 className="text-lg font-semibold">账户快照</h2>
              </div>
              <StatusPill>会员资料</StatusPill>
              <button className="inline-flex items-center gap-2 rounded bg-[#063F4A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052F38]">
                充值点数 <CreditCard className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {accountStats.map((stat) => (
                <MetricCard key={stat.label} {...stat} />
              ))}
            </div>
          </section>

          <div className="mt-4 rounded border border-[#C79A54]/30 bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#063F4A]">
            {membershipMessage}
            <span className="mt-1 block text-xs font-medium text-ink/55">创业配套状态：{partnerPackageLabels[partnerPackage]}</span>
          </div>
          <MembershipPlanPanel currentTier={currentTier} onRequestUpgrade={requestMembershipUpgrade} />
          <OnboardingPanel onOpenModule={openModule} />
          <TodayRecommendedActions onOpenModule={openModule} />
          <MoodCheckInPanel onOpenModule={openModule} />

          <section className="mt-6 rounded border border-black/10 bg-[#F5FAFA] p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="size-5 text-[#063F4A]" />
                <h2 className="text-xl font-semibold">功能模块</h2>
              </div>
              <p className="text-sm text-ink/55">当前打开：{active.title}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {modules.map((module) => {
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
          </section>

          <section ref={moduleContentRef} className="scroll-mt-28 mt-6">
            {activeModule === "fortune" ? <TodayFortune currentTier={currentTier} memberProfile={memberProfile} /> : null}
            {activeModule === "calendar" ? <FortuneCalendarModule currentTier={currentTier} /> : null}
            {activeModule === "profile" ? <DestinyProfileModule memberProfile={memberProfile} /> : null}
            {activeModule === "growth" ? <GrowthPlaybookModule /> : null}
            {activeModule === "vault" ? <FavoritesVaultModule /> : null}
            {activeModule === "ai" ? (
              <FengshuiChat
                tier={currentTier}
                tierName={currentPlan.name}
                aiMode={currentPlan.positioning}
                profile={memberProfile}
                points={pointBalance}
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
              <WalletAndReports currentTier={currentTier} memberProfile={memberProfile} points={pointBalance} onSpendPoints={spendPoints} />
            ) : null}
            {activeModule === "shop" ? <ProductModule /> : null}
            {activeModule === "courses" ? <CourseModule /> : null}
            {activeModule === "team" ? <HierarchyTree /> : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
