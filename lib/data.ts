import {
  Award,
  BadgeDollarSign,
  BookOpenCheck,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardList,
  Gift,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Network,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  WalletCards
} from "lucide-react";

export type Plan = {
  name: string;
  price: string;
  points: string;
  features: string[];
  tone: string;
};

export const plans: Plan[] = [
  {
    name: "Free",
    price: "RM0",
    points: "每日基础额度",
    features: ["基础 AI 问答", "每日运势", "注册赠送点数", "推荐链接"],
    tone: "适合新用户体验"
  },
  {
    name: "Plus",
    price: "RM49/月",
    points: "每月 300 点",
    features: ["更多 AI 问答", "简单八字分析", "报告折扣", "会员商城价"],
    tone: "适合个人长期使用"
  },
  {
    name: "Pro",
    price: "RM199/月",
    points: "每月 1,500 点",
    features: ["梅花易数", "奇门遁甲推演", "开业择日", "团队推荐数据"],
    tone: "适合创业与决策"
  },
  {
    name: "Master",
    price: "RM599/月",
    points: "每月 5,000 点",
    features: ["深度决策", "PDF 报告", "真人服务入口", "高级代理权益"],
    tone: "适合高频咨询和团队"
  }
];

export const reportTypes = [
  { title: "财运报告", points: 120, tag: "热门" },
  { title: "事业报告", points: 150, tag: "职场" },
  { title: "合盘报告", points: 180, tag: "关系" },
  { title: "流年报告", points: 220, tag: "年度" },
  { title: "开业择日报告", points: 260, tag: "商业" },
  { title: "公司风水初步分析", points: 320, tag: "企业" }
];

export const mallProducts = [
  { name: "五行平衡手串", category: "五行饰品", price: "RM188", points: 80, commission: "12%" },
  { name: "招财办公布局套装", category: "办公室布局用品", price: "RM688", points: 300, commission: "15%" },
  { name: "开运香氛能量盒", category: "香氛/能量产品", price: "RM128", points: 50, commission: "10%" },
  { name: "课程礼包产品包", category: "课程礼包产品", price: "RM1,288", points: 800, commission: "20%" }
];

export const courses = [
  { name: "八字基础线上课", type: "线上课程", price: "RM399", seats: "不限", reward: "200 点" },
  { name: "家居风水实战营", type: "直播课", price: "RM1,288", seats: "80 人", reward: "800 点" },
  { name: "高阶导师班", type: "线下课程", price: "RM8,888", seats: "24 人", reward: "5,000 点" }
];

export const dashboardProducts = [
  {
    slug: "five-element-bracelet",
    name: "五行平衡手串",
    category: "五行饰品",
    price: "RM188",
    points: "赠 80 点",
    image: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=900&q=80",
    description: "适合日常佩戴的五行平衡饰品，用于提醒自己保持稳定、专注与行动节奏。",
    idealFor: "适合近期状态起伏、想增强稳定感和专注感的用户。",
    highlights: ["五行配色搭配", "日常佩戴不突兀", "适合搭配每日运势建议", "购买赠送点数可用于 AI 分析"]
  },
  {
    slug: "wealth-crystal-ornament",
    name: "招财水晶摆件",
    category: "风水摆件",
    price: "RM328",
    points: "赠 150 点",
    image: "https://images.unsplash.com/photo-1546608135-e5de34abc308?auto=format&fit=crop&w=900&q=80",
    description: "用于桌面、收银台或办公区的水晶摆件，搭配方位建议提升空间仪式感。",
    idealFor: "适合创业者、店主、销售型岗位和希望强化财运提醒的人。",
    highlights: ["适合办公桌与收银区域", "可搭配贵人方位摆放", "提升空间视觉焦点", "购买后可生成摆放建议"]
  },
  {
    slug: "energy-aroma-box",
    name: "开运香氛能量盒",
    category: "香氛/能量产品",
    price: "RM128",
    points: "赠 50 点",
    image: "https://images.unsplash.com/photo-1678786987725-bb778d809bb6?auto=format&fit=crop&w=900&q=80",
    description: "用气味建立每日复盘和冥想习惯，让运势建议从阅读变成稳定的生活仪式。",
    idealFor: "适合睡眠压力大、情绪紧绷、需要建立日常能量感的用户。",
    highlights: ["适合睡前与早晨使用", "搭配今日宜忌更有仪式感", "帮助建立复盘习惯", "轻量入门型产品"]
  },
  {
    slug: "office-layout-kit",
    name: "办公室布局套装",
    category: "办公室布局用品",
    price: "RM688",
    points: "赠 300 点",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    description: "结合办公动线、座位方向和桌面布局建议，帮助你打造更适合专注与成交的工作区。",
    idealFor: "适合办公室、工作室、门店与团队负责人。",
    highlights: ["包含桌面布局建议", "适合团队办公空间", "可延伸公司风水初步分析", "赠送点数用于报告生成"]
  },
  {
    slug: "wealth-wallet-card",
    name: "招财能量钱包卡",
    category: "招财产品",
    price: "RM98",
    points: "赠 30 点",
    image: "https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?auto=format&fit=crop&w=900&q=80",
    description: "轻量随身开运产品，适合作为每日财务目标提醒，也适合搭配财运报告使用。",
    idealFor: "适合想低门槛体验开运产品、关注财务习惯的用户。",
    highlights: ["随身携带方便", "适合作为礼品", "搭配财运报告使用", "入门价位容易转化"]
  }
];

export const dashboardCourses = [
  {
    slug: "bazi-foundation",
    name: "八字基础入门课",
    category: "线上课程",
    price: "RM399",
    reward: "赠 200 点",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    description: "从零理解八字、五行、十神与基础命盘结构，学会读懂自己的性格与人生节奏。",
    idealFor: "适合完全新手、想理解每日运势背后逻辑的人。",
    highlights: ["八字基础概念", "五行关系入门", "命盘结构理解", "搭配 AI 练习提问"]
  },
  {
    slug: "daily-fortune-reading",
    name: "每日运势解读训练",
    category: "短课训练",
    price: "RM199",
    reward: "赠 80 点",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80",
    description: "学习如何把每日运势拆解成行动建议，适合用在工作、关系和财务复盘。",
    idealFor: "适合想每天实践、快速建立命理判断感的用户。",
    highlights: ["每日评分理解", "宜忌判断方法", "行动建议练习", "短课易完成"]
  },
  {
    slug: "home-fengshui-camp",
    name: "家居风水实战营",
    category: "直播课",
    price: "RM1,288",
    reward: "赠 800 点",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
    description: "以真实家居空间为案例，学习玄关、客厅、卧室和办公角的基础布局方法。",
    idealFor: "适合家庭用户、室内设计从业者、想改善居住能量的人。",
    highlights: ["家居空间案例", "常见布局误区", "改善建议清单", "直播互动答疑"]
  },
  {
    slug: "business-date-layout",
    name: "商业择日与开业布局",
    category: "商业课程",
    price: "RM2,888",
    reward: "赠 1,500 点",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
    description: "学习开业择日、办公室布局、门店动线和商业决策时机的基础判断。",
    idealFor: "适合创业者、店主、顾问和管理层。",
    highlights: ["开业择日逻辑", "门店与办公室布局", "商业行动时机", "案例推演"]
  },
  {
    slug: "mentor-certification",
    name: "高阶导师认证班",
    category: "线下课程",
    price: "RM8,888",
    reward: "赠 5,000 点",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    description: "面向进阶学习者和团队带领者，系统训练咨询表达、案例分析和线下服务流程。",
    idealFor: "适合想成为导师、顾问或开展线下服务的学员。",
    highlights: ["高阶案例训练", "咨询表达框架", "线下服务流程", "结业证书"]
  }
];

export const affiliatePackages = [
  {
    name: "8888 创业启动包",
    label: "产品包 + 课程包 + 服务包",
    includes: ["AI Pro / Master 权限", "点数礼包", "产品礼包", "推荐分润资格", "专属海报生成"]
  },
  {
    name: "16888 事业合伙人",
    label: "团队成长配套",
    includes: ["更高折扣", "更多点数", "高级课程", "团队管理权限", "更高分润"]
  },
  {
    name: "38888 区域导师",
    label: "区域服务配套",
    includes: ["区域授权", "线下课程资格", "团队业绩看板", "高阶培训", "专属后台权限"]
  }
];

export const closeLoop = [
  "注册",
  "填写生日",
  "生成每日运势",
  "免费问 AI",
  "提示深度分析需点数",
  "充值点数",
  "生成报告",
  "报告推荐产品",
  "产品推荐课程",
  "课程推荐代理配套",
  "代理推荐裂变"
];

export const dashboardStats = [
  { label: "当前点数", value: "2,680", change: "+800 课程赠送", icon: WalletCards },
  { label: "今日 AI 次数", value: "12", change: "Plus 剩余额度充足", icon: Bot },
  { label: "推荐收益", value: "RM1,248", change: "三层团队 46 人", icon: Network },
  { label: "待完成报告", value: "3", change: "2 份可生成 PDF", icon: ClipboardList }
];

export const dailyRituals = [
  {
    title: "完成今日复盘",
    desc: "写下今天最重要的一件事，避免能量分散。",
    reward: "+10 点"
  },
  {
    title: "问 AI 一个决策问题",
    desc: "围绕事业、财运或关系提出一个具体问题。",
    reward: "+15 点"
  },
  {
    title: "查看一个推荐方案",
    desc: "根据今日运势查看对应报告、产品或课程。",
    reward: "+20 点"
  }
];

export const recentInsights = [
  {
    title: "事业趋势转强",
    desc: "连续 3 天事业评分高于 85，适合推进合作沟通。",
    tag: "事业"
  },
  {
    title: "财务动作宜保守",
    desc: "财运评分稳定但偏财提醒偏弱，先确认现金流。",
    tag: "财运"
  },
  {
    title: "适合生成流年报告",
    desc: "近期提问集中在事业和创业，可用报告做系统规划。",
    tag: "报告"
  }
];

export const adminStats = [
  { label: "今日注册", value: "128", icon: UsersRound },
  { label: "今日销售额", value: "RM42,860", icon: BadgeDollarSign },
  { label: "点数充值金额", value: "RM18,240", icon: CircleDollarSign },
  { label: "AI 使用次数", value: "9,482", icon: Bot },
  { label: "课程销售额", value: "RM76,900", icon: BookOpenCheck },
  { label: "推荐成交", value: "318", icon: HandCoins }
];

export const adminModules = [
  { title: "用户管理", desc: "资料、八字、会员、点数、团队结构、AI 使用记录", icon: UsersRound },
  { title: "点数管理", desc: "充值套餐、赠送规则、有效期、消耗规则", icon: WalletCards },
  { title: "AI 功能管理", desc: "Prompt、等级权限、敏感词、免责声明、报告模板", icon: Sparkles },
  { title: "产品管理", desc: "分类、库存、价格、折扣、赠点、佣金、上下架", icon: Boxes },
  { title: "课程管理", desc: "视频、价格、报名、签到、证书、名额", icon: BookOpenCheck },
  { title: "订单管理", desc: "产品、课程、点数、订阅、报告订单状态", icon: ReceiptText },
  { title: "分润系统", desc: "三层分润：20%、10%、5%，按项目配置佣金", icon: ChartNoAxesCombined },
  { title: "代理配套", desc: "把 8888/16888/38888 包装成产品、课程、服务包", icon: Award },
  { title: "支付审核", desc: "Stripe、本地网关、FPX、钱包、银行转账审核", icon: Landmark }
];

export const navItems = [
  { href: "/", label: "官网", icon: LayoutDashboard },
  { href: "/dashboard", label: "会员端", icon: ShieldCheck },
  { href: "/admin", label: "后台", icon: BriefcaseBusiness }
];

export const orders = [
  { id: "FS-20391", type: "点数充值", customer: "Lim Mei", amount: "RM500", status: "Paid" },
  { id: "FS-20392", type: "AI 报告", customer: "Tan Wei", amount: "RM188", status: "Processing" },
  { id: "FS-20393", type: "课程订单", customer: "Alicia Wong", amount: "RM1,288", status: "Completed" },
  { id: "FS-20394", type: "产品订单", customer: "Jason Lee", amount: "RM688", status: "Pending" }
];

export const paymentFlow = [
  { title: "支付成功", icon: PackageCheck },
  { title: "升级会员", icon: ShieldCheck },
  { title: "发放点数", icon: Gift },
  { title: "开通课程", icon: BookOpenCheck },
  { title: "生成佣金", icon: HandCoins },
  { title: "更新团队业绩", icon: CalendarDays },
  { title: "生成订单记录", icon: ReceiptText },
  { title: "推荐下一步成交", icon: Store }
];

export type DownlineMember = {
  id: string;
  name: string;
  code: string;
  level: "Free" | "Plus" | "Pro" | "Master";
  relationLevel: 0 | 1 | 2 | 3;
  status: "活跃" | "跟进中" | "沉睡";
  joinedAt: string;
  sales: string;
  commission: string;
  points: string;
  children?: DownlineMember[];
};

export const downlineTree: DownlineMember = {
  id: "u-root",
  name: "Lim Mei",
  code: "FENG-LIM88",
  level: "Plus",
  relationLevel: 0,
  status: "活跃",
  joinedAt: "2026-01-06",
  sales: "RM12,860",
  commission: "RM1,248",
  points: "2,680",
  children: [
    {
      id: "u-101",
      name: "Tan Wei",
      code: "FENG-TAN21",
      level: "Pro",
      relationLevel: 1,
      status: "活跃",
      joinedAt: "2026-02-12",
      sales: "RM5,388",
      commission: "RM638",
      points: "1,420",
      children: [
        {
          id: "u-201",
          name: "Alicia Wong",
          code: "FENG-ALI09",
          level: "Plus",
          relationLevel: 2,
          status: "活跃",
          joinedAt: "2026-03-02",
          sales: "RM1,288",
          commission: "RM129",
          points: "820",
          children: [
            {
              id: "u-301",
              name: "Jason Lee",
              code: "FENG-JAS18",
              level: "Free",
              relationLevel: 3,
              status: "跟进中",
              joinedAt: "2026-03-28",
              sales: "RM399",
              commission: "RM20",
              points: "120"
            }
          ]
        },
        {
          id: "u-202",
          name: "Chong Kai",
          code: "FENG-CHK37",
          level: "Free",
          relationLevel: 2,
          status: "跟进中",
          joinedAt: "2026-03-10",
          sales: "RM188",
          commission: "RM19",
          points: "60"
        }
      ]
    },
    {
      id: "u-102",
      name: "Nora Ismail",
      code: "FENG-NOR52",
      level: "Master",
      relationLevel: 1,
      status: "活跃",
      joinedAt: "2026-02-18",
      sales: "RM8,888",
      commission: "RM1,066",
      points: "5,900",
      children: [
        {
          id: "u-203",
          name: "Goh Xin",
          code: "FENG-GOH11",
          level: "Pro",
          relationLevel: 2,
          status: "活跃",
          joinedAt: "2026-03-22",
          sales: "RM1,688",
          commission: "RM169",
          points: "1,260"
        }
      ]
    },
    {
      id: "u-103",
      name: "Raymond Ho",
      code: "FENG-RAY77",
      level: "Free",
      relationLevel: 1,
      status: "沉睡",
      joinedAt: "2026-02-26",
      sales: "RM0",
      commission: "RM0",
      points: "30"
    }
  ]
};

export const downlineSummary = [
  { label: "直属下线", value: "3", helper: "第一代 20%" },
  { label: "团队总人数", value: "7", helper: "含二代、三代" },
  { label: "团队销售", value: "RM17,839", helper: "本月累计" },
  { label: "预计佣金", value: "RM1,872", helper: "待结算 RM624" }
];
