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

type AlmanacTone = "good" | "steady" | "caution";
type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

type ClothingGuide = {
  label: string;
  colors: string[];
  swatches: string[];
  reason: string;
};

type ClothingLevel = ClothingGuide & {
  level: "首选色系" | "次选色系" | "一般色系" | "不建议色系" | "强烈不建议色系";
  tone: "good" | "steady" | "neutral" | "caution" | "danger";
};

type ZodiacFortune = {
  zodiac: string;
  score: number;
  headline: string;
  advice: string;
  tone: AlmanacTone;
  luckyColor: string;
  luckyDirection: string;
  isClash: boolean;
  isNoble: boolean;
};

type DayMasterFlow = {
  stem: string;
  element: string;
  tenGod: string;
  headline: string;
  advice: string;
  tone: AlmanacTone;
  score: number;
  luckyColor: string;
  luckyDirection: string;
};

export type PublicDailyAlmanac = {
  date: string;
  dateLabel: string;
  lunarDate: string;
  weekday: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  dayStem: string;
  dayBranch: string;
  fourPillarsText: string;
  chong: string;
  clashZodiac: string;
  dailyStar: string;
  nobleZodiacs: string[];
  timeWindows: {
    label: string;
    time: string;
    tone: AlmanacTone;
    advice: string;
  }[];
  wealthDirection: {
    title: string;
    direction: string;
    description: string;
  };
  joyDirection: {
    title: string;
    direction: string;
    description: string;
  };
  clothing: {
    primary: ClothingGuide;
    secondary: ClothingGuide;
    avoid: ClothingGuide;
  };
  clothingLevels: ClothingLevel[];
  zodiac: ZodiacFortune[];
  dayMasterFlow: DayMasterFlow[];
  yi: string[];
  ji: string[];
  footer: string;
};

const colors = ["青绿", "米白", "金色", "深蓝", "浅灰", "酒红", "暖黄", "墨青"];
const directions = ["正东", "东南", "正南", "西南", "正西", "西北", "正北", "东北"];
const luckyHours = ["辰时 7-9", "巳时 9-11", "午时 11-13", "未时 13-15", "申时 15-17", "酉时 17-19"];
const avoidWindows = ["上午 9-11", "中午 12-14", "下午 15-17", "傍晚 18-20", "晚上 21-23"];
const chineseWeekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

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

const zodiacAnimals = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const zodiacProfiles: Record<string, { trait: string; action: string; risk: string }> = {
  鼠: { trait: "资讯敏锐", action: "先做资料核对与私下沟通", risk: "听到小道消息就急着转向" },
  牛: { trait: "稳扎稳打", action: "把手上的任务逐件收尾", risk: "过度固执，错过调整窗口" },
  虎: { trait: "行动爆发", action: "适合处理拖延已久的决定", risk: "情绪一上来就硬碰硬" },
  兔: { trait: "人缘柔和", action: "用温和方式修复关系或确认合作", risk: "顾虑太多，话说一半" },
  龙: { trait: "资源整合", action: "适合召集人脉、讨论方案", risk: "目标太大，细节落空" },
  蛇: { trait: "观察入微", action: "先看清对方动机再回应", risk: "想太多，错失开口时机" },
  马: { trait: "节奏快速", action: "适合跑动、拜访、推进外部事务", risk: "赶进度导致遗漏重点" },
  羊: { trait: "协调包容", action: "适合做团队润滑与资源整理", risk: "为了和气而承担过多" },
  猴: { trait: "应变灵活", action: "适合解决突发问题、优化流程", risk: "聪明反被琐事分心" },
  鸡: { trait: "表达清晰", action: "适合汇报、谈判、整理标准", risk: "话太直引发误会" },
  狗: { trait: "责任感强", action: "适合守住承诺、检查合约", risk: "过度担心而不敢推进" },
  猪: { trait: "福气缓和", action: "适合休整、补资源、做长期规划", risk: "拖延或过度相信口头承诺" }
};
const branchToZodiac: Record<string, string> = {
  子: "鼠",
  丑: "牛",
  寅: "虎",
  卯: "兔",
  辰: "龙",
  巳: "蛇",
  午: "马",
  未: "羊",
  申: "猴",
  酉: "鸡",
  戌: "狗",
  亥: "猪"
};

const branchSixHarmony: Record<string, string> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午"
};

const branchThreeHarmony: Record<string, string[]> = {
  申: ["子", "辰"],
  子: ["申", "辰"],
  辰: ["申", "子"],
  亥: ["卯", "未"],
  卯: ["亥", "未"],
  未: ["亥", "卯"],
  寅: ["午", "戌"],
  午: ["寅", "戌"],
  戌: ["寅", "午"],
  巳: ["酉", "丑"],
  酉: ["巳", "丑"],
  丑: ["巳", "酉"]
};

const branchClash: Record<string, string> = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳"
};

const stemMeta: Record<string, { element: ElementKey; yinYang: "yang" | "yin"; icon: string }> = {
  甲: { element: "wood", yinYang: "yang", icon: "树" },
  乙: { element: "wood", yinYang: "yin", icon: "竹" },
  丙: { element: "fire", yinYang: "yang", icon: "日" },
  丁: { element: "fire", yinYang: "yin", icon: "灯" },
  戊: { element: "earth", yinYang: "yang", icon: "山" },
  己: { element: "earth", yinYang: "yin", icon: "田" },
  庚: { element: "metal", yinYang: "yang", icon: "钟" },
  辛: { element: "metal", yinYang: "yin", icon: "玉" },
  壬: { element: "water", yinYang: "yang", icon: "江" },
  癸: { element: "water", yinYang: "yin", icon: "雨" }
};

const dayMasterProfiles: Record<string, { image: string; strength: string; action: string; caution: string; clue: string }> = {
  甲: { image: "大树之木", strength: "重原则、讲方向，适合做长期规划与资源整合", action: "先定一个主轴，再把任务拆成三步执行", caution: "别为了证明自己而硬撑到底", clue: "留意高处、绿色物件或长辈提醒" },
  乙: { image: "花草藤蔓", strength: "柔韧细腻，擅长沟通、协调与借力", action: "用温和方式争取支持，先修关系再谈结果", caution: "别绕太多弯，让对方猜你的真实需求", clue: "留意女性贵人、花草或一句软性建议" },
  丙: { image: "太阳之火", strength: "热情外放，适合曝光、表达与主动争取", action: "把想法讲出来，适合发布、邀约或展示成果", caution: "别一时兴奋答应太多，热度过后容易失衡", clue: "留意光线明亮处、红色物件或公开场合" },
  丁: { image: "灯烛之火", strength: "洞察细腻，擅长用创意、温度与专业打动人", action: "适合私下沟通、修正细节、写文案和做提案", caution: "别把情绪闷在心里，越想越累", clue: "留意夜晚、灯光、文字讯息里的关键句" },
  戊: { image: "高山厚土", strength: "稳定可靠，适合定规则、扛责任与做框架", action: "先稳住现金流、流程和边界，再谈扩大", caution: "别把所有压力都往自己身上背", clue: "留意不动产、桌面杂物或沉默的人" },
  己: { image: "田园湿土", strength: "务实细致，适合整理、培养、服务与长期维护", action: "把混乱资料分类，先补漏洞再推进", caution: "别过度迁就，让琐事吞掉核心目标", clue: "留意黄色物件、账本、收据或旧资料" },
  庚: { image: "矿铁之金", strength: "果断刚直，适合决策、切割与建立标准", action: "把不清楚的条件写成规则，今天要敢于说不", caution: "别太硬，容易把可以合作的人推远", clue: "留意金属声、白色物件或制度文件" },
  辛: { image: "珠玉之金", strength: "审美精准，擅长包装、筛选与高质量表达", action: "适合优化细节、谈价值、做品牌或价格定位", caution: "别因追求完美而迟迟不交付", clue: "留意首饰、镜子、合约细节或一句批评" },
  壬: { image: "江河之水", strength: "格局开阔，适合学习、连接资源与观察趋势", action: "先收集信息，再选择最有流动性的路径", caution: "别想太远，导致眼前一步没有落地", clue: "留意水边、黑色物件、远方消息或交通变化" },
  癸: { image: "雨露之水", strength: "敏感细腻，擅长感知需求、疗愈与深度思考", action: "适合复盘、请教、写计划，把感觉变成文字", caution: "别被情绪雾气包住，重要事要找证据", clue: "留意雨水、饮品、梦境或安静角落的念头" }
};

const tenGodAdviceMap: Record<string, { theme: string; opportunity: string; risk: string; move: string }> = {
  比肩: { theme: "同辈竞争", opportunity: "朋友、同行或团队会带来参照与助力", risk: "也容易出现抢资源、意见相持或谁都不服谁", move: "把利益、分工和截止时间写清楚" },
  劫财: { theme: "资源分流", opportunity: "适合靠团队气势推进卡住的事情", risk: "钱、人情和时间容易被别人牵走", move: "今天不要随口答应借钱、帮忙或分成" },
  食神: { theme: "稳定输出", opportunity: "适合表达、教学、内容、服务和客户体验", risk: "太舒服会让执行速度下降", move: "把一个可交付成果做完，而不是只聊天" },
  伤官: { theme: "锋芒表达", opportunity: "创意、口才和突破力变强", risk: "容易顶撞权威、说太满或急着证明自己", move: "重要话先写草稿，留三分余地" },
  偏财: { theme: "机会流动", opportunity: "适合谈资源、报价、客户线索和副业机会", risk: "也容易因贪快而忽略成本", move: "先算投入产出，再决定是否加码" },
  正财: { theme: "现金秩序", opportunity: "适合收款、预算、账目、稳定收入和合约确认", risk: "过度保守会错过合理机会", move: "今天至少完成一次现金流检查" },
  七杀: { theme: "压力破局", opportunity: "外部压力会逼你做出关键决断", risk: "焦虑、冲突、制度压力或突发状况增加", move: "先处理最高风险的一件事，别分散战线" },
  正官: { theme: "规则加持", opportunity: "上级、制度、证照、流程和正式关系较有利", risk: "被规矩限制，行动速度变慢", move: "用 SOP、清单和书面确认降低阻力" },
  偏印: { theme: "灵感复盘", opportunity: "适合研究、学习、策略、幕后准备和找方法", risk: "想法太多，容易陷入怀疑", move: "把灵感变成一页行动笔记" },
  正印: { theme: "贵人学习", opportunity: "适合请教长辈、老师、专业人士或补知识", risk: "依赖建议太多，自己不下决定", move: "听完建议后，只选一个行动落地" }
};

const elementNames: Record<ElementKey, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const elementColorLibrary: Record<ElementKey, { colors: string[]; swatches: string[]; label: string }> = {
  wood: { label: "木", colors: ["绿色", "青色", "翠绿"], swatches: ["#0D6B48", "#1495A0", "#8BCB8F"] },
  fire: { label: "火", colors: ["红色", "紫色", "玫红"], swatches: ["#9F2E24", "#7B3F8C", "#B94A5B"] },
  earth: { label: "土", colors: ["黄色", "咖啡", "卡其"], swatches: ["#C79A54", "#8C6A3D", "#E8D4A8"] },
  metal: { label: "金", colors: ["白色", "银色", "金色"], swatches: ["#F5FAFA", "#DDEEF2", "#C79A54"] },
  water: { label: "水", colors: ["黑色", "深蓝", "海蓝"], swatches: ["#0A0A0A", "#102F38", "#1495A0"] }
};

const elementCreates: Record<ElementKey, ElementKey> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood"
};

const elementControls: Record<ElementKey, ElementKey> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire"
};

const dailyStarByBranch: Record<string, string> = {
  子: "开日",
  丑: "闭日",
  寅: "建日",
  卯: "除日",
  辰: "满日",
  巳: "平日",
  午: "定日",
  未: "执日",
  申: "破日",
  酉: "危日",
  戌: "成日",
  亥: "收日"
};

const branchMainStem: Record<string, string> = {
  子: "癸",
  丑: "己",
  寅: "甲",
  卯: "乙",
  辰: "戊",
  巳: "丙",
  午: "丁",
  未: "己",
  申: "庚",
  酉: "辛",
  戌: "戊",
  亥: "壬"
};

const clothingByElement: Record<ElementKey, { primary: ClothingGuide; secondary: ClothingGuide; avoid: ClothingGuide }> = {
  wood: {
    primary: { label: "首选", colors: ["黑色", "深蓝", "海蓝"], swatches: ["#102F38", "#214B72", "#1495A0"], reason: "水生木，帮助思路回流，适合学习、谈规划与修复关系。" },
    secondary: { label: "次选", colors: ["绿色", "青色", "翠绿"], swatches: ["#0D6B48", "#2E9E72", "#8BCB8F"], reason: "木气同频，增强生发力与执行耐心。" },
    avoid: { label: "慎用", colors: ["白色", "银色", "金色"], swatches: ["#F5FAFA", "#DDEEF2", "#C79A54"], reason: "金克木，容易带来规则压力与沟通硬碰硬。" }
  },
  fire: {
    primary: { label: "首选", colors: ["绿色", "青色", "翠绿"], swatches: ["#0D6B48", "#1495A0", "#9ED8DF"], reason: "木生火，提升灵感、表达力与行动热度。" },
    secondary: { label: "次选", colors: ["红色", "紫色", "玫红"], swatches: ["#9F2E24", "#7B3F8C", "#B94A5B"], reason: "火气同频，适合曝光、表达与主动争取。" },
    avoid: { label: "慎用", colors: ["黑色", "深蓝", "灰蓝"], swatches: ["#0A0A0A", "#102F38", "#6C8790"], reason: "水克火，容易情绪降温或临场犹豫。" }
  },
  earth: {
    primary: { label: "首选", colors: ["红色", "紫色", "暖粉"], swatches: ["#9F2E24", "#7B3F8C", "#D16A65"], reason: "火生土，适合稳住气场、处理资源与做关键确认。" },
    secondary: { label: "次选", colors: ["黄色", "咖啡", "卡其"], swatches: ["#C79A54", "#8C6A3D", "#E8D4A8"], reason: "土气同频，增强稳定、耐心与长期布局。" },
    avoid: { label: "慎用", colors: ["绿色", "青色", "翠绿"], swatches: ["#0D6B48", "#1495A0", "#8BCB8F"], reason: "木克土，容易被外界事务牵制，压力增加。" }
  },
  metal: {
    primary: { label: "首选", colors: ["黄色", "咖啡", "米金"], swatches: ["#C79A54", "#8C6A3D", "#F1E0B8"], reason: "土生金，帮助规则感、判断力与财务边界。" },
    secondary: { label: "次选", colors: ["白色", "银色", "浅灰"], swatches: ["#F5FAFA", "#DDEEF2", "#B8C7CC"], reason: "金气同频，适合签约、整理制度与做标准化决策。" },
    avoid: { label: "慎用", colors: ["红色", "紫色", "玫红"], swatches: ["#9F2E24", "#7B3F8C", "#B94A5B"], reason: "火克金，容易急躁、争执或被外界催促。" }
  },
  water: {
    primary: { label: "首选", colors: ["白色", "银色", "金色"], swatches: ["#F5FAFA", "#DDEEF2", "#C79A54"], reason: "金生水，利于贵人、资讯、学习与谈判。" },
    secondary: { label: "次选", colors: ["黑色", "深蓝", "海蓝"], swatches: ["#0A0A0A", "#102F38", "#1495A0"], reason: "水气同频，帮助冷静、复盘与看清暗线。" },
    avoid: { label: "慎用", colors: ["黄色", "咖啡", "卡其"], swatches: ["#C79A54", "#8C6A3D", "#E8D4A8"], reason: "土克水，容易卡住进度或被现实条件限制。" }
  }
};

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

function elementGenerates(source: ElementKey, target: ElementKey) {
  return elementCreates[source] === target;
}

function elementOvercomes(source: ElementKey, target: ElementKey) {
  return elementControls[source] === target;
}

function elementGeneratedBy(target: ElementKey) {
  return (Object.keys(elementCreates) as ElementKey[]).find((element) => elementCreates[element] === target) || "water";
}

function elementControlledBy(target: ElementKey) {
  return (Object.keys(elementControls) as ElementKey[]).find((element) => elementControls[element] === target) || "metal";
}

function buildClothingLevels(dayElement: ElementKey): ClothingLevel[] {
  const generatesDay = elementGeneratedBy(dayElement);
  const sameDay = dayElement;
  const dayControls = elementControls[dayElement];
  const dayGenerates = elementCreates[dayElement];
  const controlsDay = elementControlledBy(dayElement);

  const makeLevel = (
    element: ElementKey,
    level: ClothingLevel["level"],
    tone: ClothingLevel["tone"],
    reason: string
  ): ClothingLevel => {
    const palette = elementColorLibrary[element];

    return {
      label: level.replace("色系", ""),
      level,
      tone,
      colors: palette.colors,
      swatches: palette.swatches,
      reason
    };
  };

  return [
    makeLevel(generatesDay, "首选色系", "good", `${elementNames[generatesDay]}生${elementNames[dayElement]}，最能补足今日气场，适合谈合作、签单、见客户与做关键推进。`),
    makeLevel(sameDay, "次选色系", "steady", `${elementNames[sameDay]}气同频，帮助稳定状态，适合按计划执行、复盘和整理节奏。`),
    makeLevel(dayControls, "一般色系", "neutral", `${elementNames[dayElement]}克${elementNames[dayControls]}，有求财与掌控意味，但容易耗力，适合小额推进，不宜过度冒进。`),
    makeLevel(dayGenerates, "不建议色系", "caution", `${elementNames[dayElement]}生${elementNames[dayGenerates]}，容易泄气分心，适合低调使用，不宜作为今天主色。`),
    makeLevel(controlsDay, "强烈不建议色系", "danger", `${elementNames[controlsDay]}克${elementNames[dayElement]}，容易带来压迫、口舌或阻力，重要场合尽量避开。`)
  ];
}

function buildNobleZodiacs(dayBranch: string) {
  const branches = [branchSixHarmony[dayBranch], ...(branchThreeHarmony[dayBranch] || [])].filter(Boolean);
  return Array.from(new Set(branches.map((branch) => branchToZodiac[branch]).filter(Boolean)));
}

function tenGodFor(selfStem: string, flowStem: string) {
  const self = stemMeta[selfStem] || stemMeta.甲;
  const flow = stemMeta[flowStem] || stemMeta.甲;
  const samePolarity = self.yinYang === flow.yinYang;

  if (self.element === flow.element) return samePolarity ? "比肩" : "劫财";
  if (elementGenerates(self.element, flow.element)) return samePolarity ? "食神" : "伤官";
  if (elementOvercomes(self.element, flow.element)) return samePolarity ? "偏财" : "正财";
  if (elementOvercomes(flow.element, self.element)) return samePolarity ? "七杀" : "正官";
  if (elementGenerates(flow.element, self.element)) return samePolarity ? "偏印" : "正印";

  return "平运";
}

function tenGodScore(tenGod: string, seed: number) {
  const base = ["正官", "正财", "正印", "食神"].some((item) => tenGod.includes(item))
    ? 78
    : ["七杀", "伤官", "劫财"].some((item) => tenGod.includes(item))
      ? 58
      : 68;

  return clamp(base + (seed % 13) - 6, 42, 94);
}

function toneFromScore(score: number): AlmanacTone {
  if (score >= 78) return "good";
  if (score >= 62) return "steady";
  return "caution";
}

function buildZodiacFortunes(seed: number, chongText: string, dayBranch: string): ZodiacFortune[] {
  const chongAnimal = zodiacAnimals.find((animal) => chongText.includes(animal)) || branchToZodiac[branchClash[dayBranch]] || "虎";
  const nobleZodiacs = buildNobleZodiacs(dayBranch);
  const sixHarmonyAnimal = branchToZodiac[branchSixHarmony[dayBranch]];

  return zodiacAnimals.map((zodiac, index) => {
    const isClash = zodiac === chongAnimal;
    const isNoble = nobleZodiacs.includes(zodiac);
    const isSixHarmony = zodiac === sixHarmonyAnimal;
    const profile = zodiacProfiles[zodiac];
    const rawScore = isClash
      ? 38 + ((seed + index * 7) % 16)
      : isSixHarmony
        ? 84 + ((seed + index * 5) % 10)
        : isNoble
          ? 76 + ((seed + index * 3) % 14)
          : 55 + ((seed + index * 11 + dayBranch.charCodeAt(0)) % 31);
    const score = clamp(rawScore, 38, 95);
    const tone = isClash ? "caution" : isSixHarmony || isNoble ? "good" : toneFromScore(score);
    const headline = isClash
      ? "逢冲谨慎"
      : isSixHarmony
        ? "六合贵人"
        : isNoble
          ? "贵人活跃"
          : tone === "good"
            ? "顺势可进"
            : tone === "steady"
              ? "稳步上升"
              : "低调守成";
    const relationshipNote = isClash
      ? "今日逢冲，先避开冲动决策。"
      : isSixHarmony
        ? "今日六合气顺，适合借力贵人。"
        : isNoble
          ? "今日三合贵人带动，外部助力较明显。"
          : tone === "good"
            ? "今日气势不错，可以主动开口。"
            : tone === "steady"
              ? "今日适合稳扎稳打，先完成眼前事。"
              : "今日宜低调观察，先守住节奏。";
    const advice = `${relationshipNote}${profile.trait}是优势，${profile.action}；留意${profile.risk}。`;
    const color = pick(colors, seed, index + 2);
    const direction = pick(directions, seed, index + 5);

    return { zodiac, score, headline, advice, tone, luckyColor: color, luckyDirection: direction, isClash, isNoble };
  });
}

function buildDayMasterFlow(dayStem: string, dayBranch: string, seed = 0): DayMasterFlow[] {
  const branchStem = branchMainStem[dayBranch] || dayStem;
  const stems = Object.keys(stemMeta);

  return stems.map((stem, index) => {
    const stemGod = tenGodFor(stem, dayStem);
    const branchGod = tenGodFor(stem, branchStem);
    const combined = `${stemGod}坐${branchGod}`;
    const variantSeed = seed + index * 17 + stem.charCodeAt(0) + dayBranch.charCodeAt(0);
    const score = tenGodScore(combined, variantSeed);
    const tone: AlmanacTone =
      ["正官", "正财", "正印", "食神"].includes(stemGod)
        ? "good"
        : ["七杀", "伤官", "劫财"].includes(stemGod)
          ? "caution"
          : "steady";
    const profile = dayMasterProfiles[stem];
    const stemAdvice = tenGodAdviceMap[stemGod] || tenGodAdviceMap.比肩;
    const branchAdvice = tenGodAdviceMap[branchGod] || tenGodAdviceMap.比肩;
    const opportunityText = stemAdvice.opportunity.replace(/^适合/, "");
    const branchRiskText = branchAdvice.risk.replace(/^也/, "");
    const headlines = tone === "good"
      ? ["顺势可进", "贵人开门", "机会浮现", "主动有利"]
      : tone === "caution"
        ? ["先稳后动", "压力校准", "避开硬冲", "谨慎破局"]
        : ["平衡取胜", "稳中有调", "先理后进", "小步成事"];
    const headline = pick(headlines, variantSeed, 4);
    const openings = [
      `${stem}${elementNames[stemMeta[stem].element]}如${profile.image}，今日主轴落在「${stemAdvice.theme}」。`,
      `对${stem}日主而言，今天不是看热闹，而是看「${stemAdvice.theme}」如何牵动选择。`,
      `${profile.image}遇到${dayStem}${dayBranch}流日，重点在${opportunityText}。`
    ];
    const actions = [
      `${profile.action}；${stemAdvice.move}。`,
      `适合${profile.action.replace("适合", "")}，同时记得${stemAdvice.move}。`,
      `先抓一个最小动作：${stemAdvice.move}，再处理其他旁枝。`
    ];
    const cautions = [
      `隐患是${stemAdvice.risk}，也要留意${profile.caution}。`,
      `卡点不在能力，而在${stemAdvice.risk}；${profile.caution}。`,
      `过程中的暗线来自「${branchAdvice.theme}」：${branchRiskText}，先别急着加码。`
    ];
    const advice = `${pick(openings, variantSeed, 1)}${pick(actions, variantSeed, 5)}${pick(cautions, variantSeed, 9)}今日线索：${profile.clue}。`;

    return {
      stem,
      element: elementNames[stemMeta[stem].element],
      tenGod: combined,
      headline,
      advice,
      tone,
      score,
      luckyColor: pick(colors, variantSeed, 1),
      luckyDirection: pick(directions, variantSeed, 2)
    };
  });
}

function buildTimeWindows(seed: number, dayBranch: string): PublicDailyAlmanac["timeWindows"] {
  const clashBranch = branchClash[dayBranch];
  const clashHour = clashBranch ? `${clashBranch}时` : "冲时";
  const goodHour = pick(luckyHours, seed, 3);
  const steadyHour = pick(luckyHours, seed, 8);
  const cautionWindow = pick(avoidWindows, seed, 5);

  return [
    {
      label: "贵人时段",
      time: goodHour,
      tone: "good",
      advice: "适合拜访、确认合作、发关键讯息或处理需要对方回应的事项。"
    },
    {
      label: "整理时段",
      time: steadyHour,
      tone: "steady",
      advice: "适合整理文件、账目、计划表和复盘，不急着做不可逆决定。"
    },
    {
      label: "避开时段",
      time: `${clashHour} / ${cautionWindow}`,
      tone: "caution",
      advice: "少争辩、少冲动付款，重要谈判尽量避开或先写清条件。"
    }
  ];
}

export function buildPublicDailyAlmanac(date = new Date()): PublicDailyAlmanac {
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(date);
  const calendar = getMingliCalendar(dateKey, "12:00", "Gregorian");
  const dayStem = calendar?.pillars[2]?.stem || "甲";
  const dayBranch = calendar?.pillars[2]?.branch || "子";
  const dayElement = stemMeta[dayStem]?.element || "wood";
  const seed = hashString(`${dateKey}|public-almanac|${calendar?.fourPillarsText || ""}`);
  const wealthDirection = calendar?.directions.wealth || pick(directions, seed, 3);
  const joyDirection = calendar?.directions.joy || pick(directions, seed, 7);
  const clashZodiac = zodiacAnimals.find((animal) => calendar?.daily.chong?.includes(animal)) || branchToZodiac[branchClash[dayBranch]] || "生肖";
  const chong = calendar?.daily.chong || `冲${clashZodiac}`;
  const yi = calendar?.daily.yi?.length ? calendar.daily.yi.slice(0, 4) : ["签约", "整理", "沟通", "学习"];
  const ji = calendar?.daily.ji?.length ? calendar.daily.ji.slice(0, 4) : ["冲动", "争执", "借贷", "拖延"];
  const weekday = chineseWeekdays[new Date(`${dateKey}T12:00:00+08:00`).getDay()] || "星期";
  const yearPillar = calendar?.pillars[0]?.ganZhi || "";
  const monthPillar = calendar?.pillars[1]?.ganZhi || "";
  const dayPillar = calendar?.pillars[2]?.ganZhi || `${dayStem}${dayBranch}`;
  const nobleZodiacs = buildNobleZodiacs(dayBranch);

  return {
    date: dateKey,
    dateLabel: new Intl.DateTimeFormat("zh-MY", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(date),
    lunarDate: calendar?.lunarDateText || "农历待换算",
    weekday,
    yearPillar,
    monthPillar,
    dayPillar,
    dayStem,
    dayBranch,
    fourPillarsText: calendar?.fourPillarsText || `${dayStem}${dayBranch}日`,
    chong,
    clashZodiac,
    dailyStar: dailyStarByBranch[dayBranch] || "平日",
    nobleZodiacs,
    timeWindows: buildTimeWindows(seed, dayBranch),
    wealthDirection: {
      title: "每日财位",
      direction: wealthDirection,
      description: `今日财气聚于${wealthDirection}，适合处理报价、收款、签单、账目整理，或在该方位放置干净明亮的招财物件。`
    },
    joyDirection: {
      title: "每日喜神",
      direction: joyDirection,
      description: `今日喜神在${joyDirection}，适合约见贵人、拜访客户、安排面谈与修复关系，出门或沟通可优先借此方位之气。`
    },
    clothing: clothingByElement[dayElement],
    clothingLevels: buildClothingLevels(dayElement),
    zodiac: buildZodiacFortunes(seed, chong, dayBranch),
    dayMasterFlow: buildDayMasterFlow(dayStem, dayBranch, seed),
    yi,
    ji,
    footer: "趋吉避凶 · 顺势而行"
  };
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
