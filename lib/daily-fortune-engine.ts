import { getMingliCalendar } from "@/lib/mingli-calendar";
import { emptyMemberProfile, type MemberProfile } from "@/lib/member-profile";

type FortuneDimension = {
  key: "wealth" | "career" | "relationship";
  label: string;
  score: number;
  palace: string;
  signals: string[];
  risks: string[];
  advice: string;
};

export type DailyFortuneMatrix = {
  date: string;
  dateLabel: string;
  lunarDate: string;
  overall: number;
  weather: {
    label: string;
    tone: "clear" | "cloudy" | "rain";
    description: string;
  };
  headline: string;
  oneLine: string;
  wealth: FortuneDimension;
  career: FortuneDimension;
  relationship: FortuneDimension;
  luckyColor: string;
  luckyDirection: string;
  nobleDirection: string;
  luckyHour: string;
  avoidWindow: string;
  yi: string[];
  ji: string[];
  actionSecret: string;
  clue: string;
  method: string;
  upgradeHint: string;
};

const colors = ["青绿", "米白", "金色", "深蓝", "浅灰", "酒红", "暖黄", "墨青"];
const directions = ["正东", "东南", "正南", "西南", "正西", "西北", "正北", "东北"];
const luckyHours = ["辰时 7-9", "巳时 9-11", "午时 11-13", "未时 13-15", "申时 15-17", "酉时 17-19"];
const avoidWindows = ["上午 9-11", "中午 12-14", "下午 15-17", "傍晚 18-20", "晚上 21-23"];

const yiPool = [
  "整理账目",
  "主动联系客户",
  "复盘合作边界",
  "写下今日三件要事",
  "处理收款与报价",
  "学习一项实用技能",
  "清理桌面与手机相册",
  "安排一次关键沟通"
];

const jiPool = [
  "冲动承诺",
  "盲目下单",
  "情绪化回讯息",
  "临时改大计划",
  "借钱给不熟的人",
  "在疲劳时做决定",
  "把话说太满",
  "忽略合约细节"
];

const actionPool = [
  "清理手机相册或聊天列表 9 分钟，把杂讯断开，给财位留空间。",
  "把钱包、收据和发票整理一次，暗示现金流回到秩序。",
  "今天只推进一个最重要的任务，不开太多战线。",
  "发一则温和但明确的讯息给关键客户，先确认需求再报价。",
  "在吉时前写下今天不做的三件事，先减法再行动。",
  "把办公桌左手边清空，放一杯温水，帮助思路回流。",
  "午后走到光线好的地方站 3 分钟，再处理重要沟通。",
  "先列风险，再列机会；任何决定都不要只看情绪高点。"
];

const clues = [
  "留意今天主动找你谈资源的人。",
  "留意来自东南方或绿色物件附近的消息。",
  "今天的转机可能藏在一句被忽略的提醒里。",
  "遇到戴眼镜或语速快的人，先听完再回应。",
  "如果某件事让你反复犹豫，先把成本写出来。",
  "今天适合从一个小整理动作开始破局。"
];

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick<T>(items: T[], seed: number, offset = 0) {
  return items[Math.abs(seed + offset) % items.length];
}

function clamp(value: number, min = 45, max = 96) {
  return Math.max(min, Math.min(max, value));
}

function weatherFromScore(score: number): DailyFortuneMatrix["weather"] {
  if (score >= 85) {
    return {
      label: "大晴天",
      tone: "clear",
      description: "能量清晰，适合主动谈合作、发布、邀约或做关键推进。"
    };
  }

  if (score >= 65) {
    return {
      label: "多云转晴",
      tone: "cloudy",
      description: "整体平稳，适合按部就班，不宜临时加码太多任务。"
    };
  }

  return {
    label: "局部雷雨",
    tone: "rain",
    description: "流日有冲突感，宜静不宜动，少说话、多整理、先避开风险。"
  };
}

function buildScore(seed: number, base: number, offset: number) {
  return clamp(base + ((seed >> offset) % 21) - 10);
}

export function buildDailyFortuneMatrix(profile?: Partial<MemberProfile>, memberLevel = "进阶会员版", date = new Date()): DailyFortuneMatrix {
  const activeProfile = {
    ...emptyMemberProfile,
    ...profile
  };
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(date);
  const seed = hashString(`${dateKey}|${activeProfile.name}|${activeProfile.birthDate}|${activeProfile.birthTime}|${memberLevel}`);
  const calendar = getMingliCalendar(activeProfile.birthDate, activeProfile.birthTime || activeProfile.birthTimeLabel, "Gregorian");
  const todayCalendar = getMingliCalendar(dateKey, "12:00", "Gregorian");
  const dayBranch = todayCalendar?.pillars[2]?.branch || "午";
  const birthBranch = calendar?.pillars[2]?.branch || "辰";
  const branchBoost = dayBranch === birthBranch ? 6 : dayBranch.charCodeAt(0) % 7;

  const wealthScore = buildScore(seed, 72 + branchBoost, 2);
  const careerScore = buildScore(seed, 76 + (seed % 8), 5);
  const relationshipScore = buildScore(seed, 68 + ((seed >> 3) % 10), 8);
  const overall = Math.round(wealthScore * 0.34 + careerScore * 0.38 + relationshipScore * 0.28);
  const weather = weatherFromScore(overall);
  const luckyColor = pick(colors, seed, 1);
  const luckyDirection = pick(directions, seed, 2);
  const nobleDirection = pick(directions, seed, 5);
  const luckyHour = pick(luckyHours, seed, 3);
  const avoidWindow = pick(avoidWindows, seed, 4);
  const yi = [pick(yiPool, seed, 1), pick(yiPool, seed, 4), pick(yiPool, seed, 7)].filter((item, index, array) => array.indexOf(item) === index);
  const ji = [pick(jiPool, seed, 2), pick(jiPool, seed, 5)].filter((item, index, array) => array.indexOf(item) === index);
  const actionSecret = pick(actionPool, seed, 9);
  const clue = pick(clues, seed, 11);
  const headline = overall >= 85 ? "主动出击，趁势推进" : overall >= 65 ? "稳住节奏，小步推进" : "先守后动，避开冲突";

  return {
    date: dateKey,
    dateLabel: new Intl.DateTimeFormat("zh-MY", { timeZone: "Asia/Kuala_Lumpur", month: "long", day: "numeric", weekday: "long" }).format(date),
    lunarDate: todayCalendar?.lunarDateText || "农历待换算",
    overall,
    weather,
    headline,
    oneLine: `${weather.label}：${weather.description}`,
    wealth: {
      key: "wealth",
      label: "财富磁场",
      score: wealthScore,
      palace: "流日财帛 / 福德",
      signals: [`${luckyColor}能量`, "现金流意识", "资源整理"],
      risks: wealthScore < 68 ? ["冲动消费", "临时借贷"] : ["报价未写清", "小额漏财"],
      advice: wealthScore >= 80 ? "适合报价、收款、谈资源；先把金额和交付写清楚。" : "今天先守现金流，少做临时消费，适合整理账目。"
    },
    career: {
      key: "career",
      label: "职场能量",
      score: careerScore,
      palace: "流日官禄 / 迁移",
      signals: ["执行力", `${luckyHour}行动窗口`, "贵人协作"],
      risks: careerScore < 68 ? ["方向分散", "会议拖延"] : ["承诺过快", "细节未落纸"],
      advice: careerScore >= 80 ? "适合提案、跟进客户、安排合作会议。" : "适合处理内部流程、复盘项目，不宜硬攻。"
    },
    relationship: {
      key: "relationship",
      label: "人际桃花",
      score: relationshipScore,
      palace: "交友 / 夫妻",
      signals: ["沟通窗口", `${nobleDirection}贵人方`, "温和表达"],
      risks: relationshipScore < 68 ? ["误会", "情绪化回应"] : ["说太快", "忽略对方感受"],
      advice: relationshipScore >= 80 ? "适合主动表达善意、邀约沟通或修复关系。" : "少试探，多确认；重要话题放慢说。"
    },
    luckyColor,
    luckyDirection,
    nobleDirection,
    luckyHour,
    avoidWindow,
    yi,
    ji,
    actionSecret,
    clue,
    method: "每日紫微气象站：本命资料 + 流日干支 + 五行节奏 + 行为建议",
    upgradeHint: "解锁未来 7 天趋势、流日风险窗口与专属行动清单。"
  };
}
