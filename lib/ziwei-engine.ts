import { ziwei } from "@ziweijs/core";
import { getMingliCalendar, type CalendarType } from "@/lib/mingli-calendar";

export type ZiweiChartInput = {
  fullName?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  calendarType?: CalendarType;
};

export type ZiweiChartPalace = {
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
};

export type ZiweiChart = {
  engine: "ziweijs-core";
  name: string;
  genderKey: "male" | "female";
  mainPalaceBranch: string;
  bodyPalaceBranch: string;
  fiveElementName: string;
  fiveElementNum: number | string;
  ziweiBranch: string;
  horoscopeDirection: 1 | -1;
  lunarDate: string;
  fourPillarsText: string;
  zodiac: string;
  palaces: ZiweiChartPalace[];
  currentHoroscope: { palaceName: string; age: number; yearly: number; yearlyText: string }[];
  chartNotes: string;
};

const palaceFocus: Record<string, string> = {
  命宫: "观察个性底盘、人生主轴、决策方式与自我定位。",
  兄弟: "观察同辈、手足、同侪资源，以及平辈合作的互助程度。",
  夫妻: "观察亲密关系、长期合作、婚恋节奏与沟通模式。",
  子女: "观察子女、作品、下属、成果延伸与创造力。",
  财帛: "观察收入模式、现金流、资源变现与守财能力。",
  疾厄: "观察身心压力、作息、健康倾向与消耗来源。",
  迁移: "观察外部机会、市场、远方发展、搬迁与出行。",
  交友: "观察朋友、客户、团队、人脉品质与社群资源。",
  官禄: "观察事业定位、职场角色、管理能力与经营路径。",
  田宅: "观察家宅、不动产、空间稳定度与资产根基。",
  福德: "观察精神状态、福气来源、内在满足与享受能力。",
  父母: "观察长辈、制度、资源支持、早年环境与文书压力。"
};

const transformationLabels = ["禄", "权", "科", "忌"];
const starKeyLabels: Record<string, string> = {
  ZI_WEI: "紫微",
  TIAN_JI: "天机",
  TAI_YANG: "太阳",
  WU_QU: "武曲",
  TIAN_TONG: "天同",
  LIAN_ZHEN: "廉贞",
  TIAN_FU: "天府",
  TAI_YIN: "太阴",
  TAN_LANG: "贪狼",
  JU_MEN: "巨门",
  TIAN_XIANG: "天相",
  TIAN_LIANG: "天梁",
  QI_SHA: "七杀",
  PO_JUN: "破军",
  WEN_CHANG: "文昌",
  WEN_QU: "文曲",
  ZUO_FU: "左辅",
  YOU_BI: "右弼"
};

function normalizeDate(value?: string) {
  const trimmed = (value || "").trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
}

function parseDateTime(dateValue?: string, timeValue?: string) {
  const normalized = normalizeDate(dateValue);
  const [year, month, day] = normalized.split("-").map(Number);
  const match = (timeValue || "").match(/^(\d{1,2})(?::(\d{2}))?/);
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 12;
  const minute = match?.[2] ? Math.min(59, Math.max(0, Number(match[2]))) : 0;

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0);
}

function mapGender(gender?: string): "male" | "female" {
  return gender === "女" || gender?.toLowerCase() === "female" ? "female" : "male";
}

function formatStar(star: any) {
  const transformation = star?.YT?.name ? `(${star.YT.name})` : "";
  return `${star?.name || ""}${transformation}`.trim();
}

function collectTransformations(palace: any) {
  const fromStars = [...(palace?.majorStars || []), ...(palace?.minorStars || [])]
    .map((star) => star?.YT?.name)
    .filter(Boolean);

  return Array.from(new Set(fromStars));
}

function summarizePalace(palaceName: string, majorStars: string[], transformations: string[]) {
  const base = Object.entries(palaceFocus).find(([key]) => palaceName.includes(key))?.[1] || "观察此领域的资源、节奏与风险。";
  const starText = majorStars.length ? `主星 ${majorStars.slice(0, 2).join("、")}，` : "无主星坐守，";
  const transformText = transformations.length ? `生年四化见${transformations.join("、")}，需重点校准机会与风险。` : "四化不明显，宜看对宫与三方四正补充判断。";

  return `${starText}${base}${transformText}`;
}

function starKeyToLabel(key: string) {
  if (starKeyLabels[key]) {
    return starKeyLabels[key];
  }

  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getZiweiChart(input?: ZiweiChartInput): ZiweiChart | null {
  const calendar = getMingliCalendar(input?.birthDate, input?.birthTime, input?.calendarType || "Gregorian");
  const date = parseDateTime(calendar?.solarDate || input?.birthDate, calendar?.solarTime || input?.birthTime);

  if (!calendar || !date) {
    return null;
  }

  try {
    const astrolabe = ziwei.bySolar({
      name: input?.fullName || "用户",
      gender: mapGender(input?.gender),
      date,
      language: "zh-CN",
      useTrueSolarTime: false,
      timezoneOffset: 8
    });
    const palaces = (astrolabe.palaces || []).map((palace: any): ZiweiChartPalace => {
      const majorStars = (palace.majorStars || []).map(formatStar).filter(Boolean);
      const minorStars = (palace.minorStars || []).map(formatStar).filter(Boolean);
      const transformations = collectTransformations(palace);
      const flying = (palace.$starKeysByFlying?.() || []).map((key: string, index: number) => `${transformationLabels[index]}:${starKeyToLabel(key)}`);

      return {
        index: palace.index,
        palace: `${palace.name} · ${palace.branch}`,
        palaceName: palace.name,
        branch: palace.branch,
        stem: palace.stem,
        age: `${palace.horoscopeRanges?.[0] ?? "-"}-${palace.horoscopeRanges?.[1] ?? "-"}`,
        majorStars,
        minorStars,
        stars: majorStars.join(" ") || "借对宫",
        minor: minorStars.join(" ") || "辅曜待会照",
        transform: transformations.join(" / ") || "平",
        flying,
        summary: summarizePalace(palace.name, majorStars, transformations)
      };
    });

    return {
      engine: "ziweijs-core",
      name: astrolabe.name || input?.fullName || "用户",
      genderKey: mapGender(input?.gender),
      mainPalaceBranch: astrolabe.mainPalaceBranch || calendar.mingGong.slice(-1),
      bodyPalaceBranch: calendar.shenGong.slice(-1),
      fiveElementName: astrolabe.fiveElementName || calendar.mingGongNaYin,
      fiveElementNum: astrolabe.fiveElementNum || "",
      ziweiBranch: astrolabe.ziweiBranch || "",
      horoscopeDirection: astrolabe.horoscopeDirection || 1,
      lunarDate: calendar.lunarDateText,
      fourPillarsText: calendar.fourPillarsText,
      zodiac: calendar.zodiac,
      palaces,
      currentHoroscope: astrolabe.horoscope?.palaces || [],
      chartNotes: "紫微十二宫、主星、辅星、生年四化与大限区间由 @ziweijs/core 排盘；公历、农历与四柱由真实万年历引擎校验。"
    };
  } catch {
    return null;
  }
}
