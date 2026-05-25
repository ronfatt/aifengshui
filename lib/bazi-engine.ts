import { Solar } from "lunar-javascript";
import { getMingliCalendar, type CalendarType, type MingliCalendarResult } from "@/lib/mingli-calendar";

export type FiveElement = "金" | "木" | "水" | "火" | "土";

export type BaziAnalysisInput = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  calendarType?: CalendarType;
  focus?: string;
};

export type BaziElementScore = {
  element: FiveElement;
  score: number;
  percentage: number;
  level: "偏弱" | "平衡" | "偏旺" | "过旺";
  meaning: string;
};

export type BaziInteraction = {
  type: "天干五合" | "地支六合" | "地支六冲" | "地支三合" | "地支三会" | "地支刑害破";
  pair: string;
  meaning: string;
  impact: "机会" | "压力" | "波动" | "结构";
};

export type BaziLuckRow = {
  ageRange: string;
  yearRange: string;
  ganZhi: string;
  tenGod: string;
  theme: string;
  advice: string;
};

export type BaziAnnualRow = {
  year: number;
  ganZhi: string;
  tenGod: string;
  theme: string;
  career: string;
  wealth: string;
  relationship: string;
  reminder: string;
};

export type BaziAnalysis = {
  engine: "local-bazi-v1";
  calendar: MingliCalendarResult;
  dayMaster: string;
  dayMasterElement: FiveElement;
  dayMasterPolarity: "阳" | "阴";
  dayMasterStrength: "偏弱" | "中和" | "偏旺";
  usefulGods: FiveElement[];
  avoidGods: FiveElement[];
  elementScores: BaziElementScore[];
  tenGodDistribution: { tenGod: string; count: number; tone: string }[];
  interactions: BaziInteraction[];
  structureNotes: string[];
  luckPillars: BaziLuckRow[];
  annualLuck: BaziAnnualRow[];
  verification: {
    source: "lunar-javascript";
    status: "local_calculated";
    note: string;
  };
};

const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const stemElements: Record<string, FiveElement> = {
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

const branchHiddenStems: Record<string, string[]> = {
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

const elementCreates: Record<FiveElement, FiveElement> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木"
};

const elementControls: Record<FiveElement, FiveElement> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木"
};

const elementMeanings: Record<FiveElement, string> = {
  金: "规则、执行、专业输出、制度与边界。",
  木: "成长、规划、学习、扩张与长期项目。",
  水: "智慧、财流、沟通、资源流动与应变。",
  火: "曝光、行动、热度、表达与品牌影响力。",
  土: "承载、稳定、管理、资产与现实基础。"
};

const tenGodTones: Record<string, string> = {
  比肩: "自我、独立、同辈竞争与自立能力。",
  劫财: "资源争夺、合作分账、团队边界与现金流警觉。",
  食神: "表达、产品化、口碑、教学与稳定输出。",
  伤官: "创意突破、锋芒表达、变革与规则冲突。",
  正财: "稳定收入、现金流、责任与务实经营。",
  偏财: "机会型收入、市场资源、业务拓展与投资意识。",
  正官: "秩序、职位、责任、名誉与合规管理。",
  七杀: "压力、竞争、决断、危机处理与执行魄力。",
  正印: "学习、贵人、资质、品牌背书与保护力。",
  偏印: "专业深耕、冷门知识、洞察力与独立研究。"
};

const stemCombinations = [
  ["甲", "己", "合土，代表资源整合、责任与现实落地。"],
  ["乙", "庚", "合金，代表规则、合约、技术与专业输出。"],
  ["丙", "辛", "合水，代表表达转为沟通、传播与流动机会。"],
  ["丁", "壬", "合木，代表灵感、学习、内容与成长机会。"],
  ["戊", "癸", "合火，代表现实基础被点亮，适合品牌与行动。"]
] as const;

const branchSixHarmony = [
  ["子", "丑", "合土，利稳固资源与长期规划。"],
  ["寅", "亥", "合木，利学习、扩张与新项目萌芽。"],
  ["卯", "戌", "合火，利曝光、内容与口碑推动。"],
  ["辰", "酉", "合金，利规则、合作、合约与专业兑现。"],
  ["巳", "申", "合水，利流动、业务、资讯与市场变通。"],
  ["午", "未", "合土，利组织、管理、承载与资产稳固。"]
] as const;

const branchClashes = [
  ["子", "午", "水火冲，情绪与行动节奏容易拉扯。"],
  ["丑", "未", "土土冲，资源、家庭或资产安排易有调整。"],
  ["寅", "申", "木金冲，计划与规则、扩张与制度容易碰撞。"],
  ["卯", "酉", "木金冲，人际表达、合作合约需谨慎。"],
  ["辰", "戌", "土土冲，旧结构与新方向容易重组。"],
  ["巳", "亥", "火水冲，曝光与隐性风险并存，避免冲动。"]
] as const;

const branchThreeHarmony = [
  [["申", "子", "辰"], "水局，利资讯、流动财、沟通与市场变化。"],
  [["亥", "卯", "未"], "木局，利学习、成长、策划与长期项目。"],
  [["寅", "午", "戌"], "火局，利曝光、品牌、行动与公众影响。"],
  [["巳", "酉", "丑"], "金局，利规则、技术、合约与专业输出。"]
] as const;

const branchThreeMeeting = [
  [["寅", "卯", "辰"], "东方木气会局，成长扩张明显。"],
  [["巳", "午", "未"], "南方火气会局，曝光行动明显。"],
  [["申", "酉", "戌"], "西方金气会局，规则输出明显。"],
  [["亥", "子", "丑"], "北方水气会局，流动资源明显。"]
] as const;

function getProducingElement(element: FiveElement) {
  return (Object.keys(elementCreates) as FiveElement[]).find((key) => elementCreates[key] === element) || element;
}

function getControllingElement(element: FiveElement) {
  return (Object.keys(elementControls) as FiveElement[]).find((key) => elementControls[key] === element) || element;
}

function normalizeIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function getGanZhiByOffset(offset: number) {
  return `${stems[normalizeIndex(offset, 10)]}${branches[normalizeIndex(offset, 12)]}`;
}

function getTenGod(dayStem: string, targetStem: string) {
  const dayElement = stemElements[dayStem];
  const targetElement = stemElements[targetStem];
  if (!dayElement || !targetElement) return "待校准";

  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];
  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (elementCreates[targetElement] === dayElement) return samePolarity ? "偏印" : "正印";
  if (elementCreates[dayElement] === targetElement) return samePolarity ? "食神" : "伤官";
  if (elementControls[dayElement] === targetElement) return samePolarity ? "偏财" : "正财";
  return samePolarity ? "七杀" : "正官";
}

function scoreLevel(percentage: number): BaziElementScore["level"] {
  if (percentage >= 30) return "过旺";
  if (percentage >= 23) return "偏旺";
  if (percentage >= 13) return "平衡";
  return "偏弱";
}

function calculateElementScores(calendar: MingliCalendarResult): BaziElementScore[] {
  const totals: Record<FiveElement, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };

  calendar.pillars.forEach((pillar) => {
    const stemElement = stemElements[pillar.stem];
    if (stemElement) totals[stemElement] += 1.2;

    const hidden = pillar.hiddenStems.length ? pillar.hiddenStems : branchHiddenStems[pillar.branch] || [];
    hidden.forEach((stem, index) => {
      const element = stemElements[stem];
      if (element) totals[element] += index === 0 ? 0.9 : 0.35;
    });
  });

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0) || 1;

  return (["金", "木", "水", "火", "土"] as FiveElement[]).map((element) => {
    const score = Number(totals[element].toFixed(2));
    const percentage = Math.round((score / total) * 100);
    return {
      element,
      score,
      percentage,
      level: scoreLevel(percentage),
      meaning: elementMeanings[element]
    };
  });
}

function assessDayMasterStrength(dayMasterElement: FiveElement, scores: BaziElementScore[]): BaziAnalysis["dayMasterStrength"] {
  const own = scores.find((row) => row.element === dayMasterElement)?.percentage || 0;
  const support = scores.find((row) => row.element === getProducingElement(dayMasterElement))?.percentage || 0;
  const supportTotal = own + support;

  if (supportTotal >= 43) return "偏旺";
  if (supportTotal <= 28) return "偏弱";
  return "中和";
}

function calculateGods(dayMasterElement: FiveElement, strength: BaziAnalysis["dayMasterStrength"], scores: BaziElementScore[]) {
  if (strength === "偏弱") {
    return {
      usefulGods: [dayMasterElement, getProducingElement(dayMasterElement)],
      avoidGods: [elementControls[dayMasterElement], getControllingElement(dayMasterElement)]
    };
  }

  if (strength === "偏旺") {
    return {
      usefulGods: [getControllingElement(dayMasterElement), elementCreates[dayMasterElement]],
      avoidGods: [dayMasterElement, getProducingElement(dayMasterElement)]
    };
  }

  const weakest = [...scores].sort((a, b) => a.percentage - b.percentage).slice(0, 2).map((row) => row.element);
  const strongest = [...scores].sort((a, b) => b.percentage - a.percentage).slice(0, 2).map((row) => row.element);

  return { usefulGods: weakest, avoidGods: strongest };
}

function calculateTenGodDistribution(calendar: MingliCalendarResult) {
  const counts = new Map<string, number>();

  calendar.pillars.forEach((pillar) => {
    [pillar.stemTenGod, ...pillar.branchTenGods].forEach((tenGod) => {
      if (!tenGod || tenGod === "日主" || tenGod === "待排盘") return;
      counts.set(tenGod, (counts.get(tenGod) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tenGod, count]) => ({
      tenGod,
      count,
      tone: tenGodTones[tenGod] || "代表命局中的一种行为模式与现实课题。"
    }));
}

function includesPair(list: string[], first: string, second: string) {
  return list.includes(first) && list.includes(second);
}

function calculateInteractions(calendar: MingliCalendarResult): BaziInteraction[] {
  const pillarStems = calendar.pillars.map((pillar) => pillar.stem);
  const pillarBranches = calendar.pillars.map((pillar) => pillar.branch);
  const interactions: BaziInteraction[] = [];

  stemCombinations.forEach(([first, second, meaning]) => {
    if (includesPair(pillarStems, first, second)) {
      interactions.push({ type: "天干五合", pair: `${first}${second}`, meaning, impact: "机会" });
    }
  });

  branchSixHarmony.forEach(([first, second, meaning]) => {
    if (includesPair(pillarBranches, first, second)) {
      interactions.push({ type: "地支六合", pair: `${first}${second}`, meaning, impact: "结构" });
    }
  });

  branchClashes.forEach(([first, second, meaning]) => {
    if (includesPair(pillarBranches, first, second)) {
      interactions.push({ type: "地支六冲", pair: `${first}${second}`, meaning, impact: "波动" });
    }
  });

  branchThreeHarmony.forEach(([group, meaning]) => {
    if (group.every((branch) => pillarBranches.includes(branch))) {
      interactions.push({ type: "地支三合", pair: group.join(""), meaning, impact: "机会" });
    }
  });

  branchThreeMeeting.forEach(([group, meaning]) => {
    if (group.every((branch) => pillarBranches.includes(branch))) {
      interactions.push({ type: "地支三会", pair: group.join(""), meaning, impact: "结构" });
    }
  });

  return interactions.slice(0, 8);
}

function buildStructureNotes(analysisSeed: {
  dayMaster: string;
  dayMasterElement: FiveElement;
  strength: BaziAnalysis["dayMasterStrength"];
  usefulGods: FiveElement[];
  avoidGods: FiveElement[];
  topTenGods: { tenGod: string; count: number; tone: string }[];
}) {
  const { dayMaster, dayMasterElement, strength, usefulGods, avoidGods, topTenGods } = analysisSeed;
  const primaryTenGod = topTenGods[0];

  return [
    `${dayMaster}${dayMasterElement}日主，命局身强弱判为「${strength}」，判断重点不在单一吉凶，而在承载力与资源调候。`,
    `喜用倾向：${usefulGods.join("、")}；适合用这些能量补节奏、开资源、化压力。`,
    `需谨慎过度放大的能量：${avoidGods.join("、")}；容易表现为固执、过度消耗或方向分散。`,
    primaryTenGod ? `十神重点见「${primaryTenGod.tenGod}」：${primaryTenGod.tone}` : "十神分布较平均，适合以长期规划和复盘机制取胜。"
  ];
}

function buildLuckRows(calendar: MingliCalendarResult, dayMaster: string): BaziLuckRow[] {
  const birthYear = Number(calendar.solarDate.slice(0, 4)) || new Date().getFullYear();
  const yearStemIndex = stems.indexOf(calendar.pillars[0]?.stem);
  const yearBranchIndex = branches.indexOf(calendar.pillars[0]?.branch);
  const baseOffset = Math.max(yearStemIndex, 0);
  const themes = ["基础建立", "学习训练", "规则成形", "事业定型", "资源扩张", "品牌沉淀", "资产保全", "经验传承"];

  return Array.from({ length: 8 }, (_, index) => {
    const startAge = 5 + index * 10;
    const endAge = startAge + 9;
    const startYear = birthYear + startAge;
    const endYear = birthYear + endAge;
    const ganZhi = `${stems[normalizeIndex(baseOffset + index + 1, 10)]}${branches[normalizeIndex(Math.max(yearBranchIndex, 0) + index + 1, 12)]}`;
    const tenGod = getTenGod(dayMaster, ganZhi[0]);

    return {
      ageRange: `${startAge}-${endAge}`,
      yearRange: `${startYear}-${endYear}`,
      ganZhi,
      tenGod,
      theme: themes[index] || "阶段转化",
      advice:
        index < 2
          ? "以学习、品格、专业基础为重，先积累稳定能力。"
          : index < 5
            ? "适合逐步扩大事业版图，但要同步管理现金流与责任边界。"
            : "宜守成、传承、资产配置与健康节律，避免高风险扩张。"
    };
  });
}

function buildAnnualRows(dayMaster: string): BaziAnnualRow[] {
  const startYear = new Date().getFullYear();
  const themes = ["整理方向", "合作扩张", "现金流优化", "规则升级", "品牌输出", "资源整合", "学习转型", "稳固资产", "开创新线", "人脉放大", "复盘收成"];

  return Array.from({ length: 11 }, (_, index) => {
    const year = startYear + index;
    let ganZhi = "";
    try {
      ganZhi = Solar.fromYmd(year, 6, 15).getLunar().getYearInGanZhi();
    } catch {
      ganZhi = getGanZhiByOffset(year - 4);
    }

    const tenGod = getTenGod(dayMaster, ganZhi[0]);

    return {
      year,
      ganZhi,
      tenGod,
      theme: themes[index] || "年度转化",
      career: ["稳中推进", "利合作拓展", "宜系统化", "适合品牌输出"][index % 4],
      wealth: ["正财优先", "注意预算", "可收回应收", "避免高杠杆"][index % 4],
      relationship: ["沟通顺畅", "避免误会", "贵人可用", "关系需边界"][index % 4],
      reminder: ["先定目标再行动", "重大决定先复盘风险", "合约与收款写清楚", "不宜冲动扩大成本"][index % 4]
    };
  });
}

export function getBaziAnalysis(input: BaziAnalysisInput): BaziAnalysis | null {
  const calendar = getMingliCalendar(input.birthDate, input.birthTime, input.calendarType || "Gregorian");
  if (!calendar) return null;

  const dayMaster = calendar.dayMaster;
  const dayMasterElement = stemElements[dayMaster] || "土";
  const dayMasterPolarity = stemPolarity[dayMaster] || "阳";
  const elementScores = calculateElementScores(calendar);
  const dayMasterStrength = assessDayMasterStrength(dayMasterElement, elementScores);
  const { usefulGods, avoidGods } = calculateGods(dayMasterElement, dayMasterStrength, elementScores);
  const tenGodDistribution = calculateTenGodDistribution(calendar);
  const interactions = calculateInteractions(calendar);

  return {
    engine: "local-bazi-v1",
    calendar,
    dayMaster,
    dayMasterElement,
    dayMasterPolarity,
    dayMasterStrength,
    usefulGods,
    avoidGods,
    elementScores,
    tenGodDistribution,
    interactions,
    structureNotes: buildStructureNotes({
      dayMaster,
      dayMasterElement,
      strength: dayMasterStrength,
      usefulGods,
      avoidGods,
      topTenGods: tenGodDistribution
    }),
    luckPillars: buildLuckRows(calendar, dayMaster),
    annualLuck: buildAnnualRows(dayMaster),
    verification: {
      source: "lunar-javascript",
      status: "local_calculated",
      note: "四柱、公农历换算与基础日课来自本地万年历引擎；大运为 MVP 阶段估算，正式命理服务仍建议结合真太阳时、节气交界与人工复核。"
    }
  };
}
