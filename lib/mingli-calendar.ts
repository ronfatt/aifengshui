import { Lunar, Solar } from "lunar-javascript";

export type CalendarType = "Gregorian" | "Lunar";

export type MingliPillar = {
  label: "年柱" | "月柱" | "日柱" | "时柱";
  stem: string;
  branch: string;
  ganZhi: string;
  hiddenStems: string[];
  stemTenGod: string;
  branchTenGods: string[];
  naYin: string;
  emptyBranch: string;
  wuXing: string;
};

export type MingliCalendarResult = {
  calendarType: CalendarType;
  solarDate: string;
  solarTime: string;
  lunarDate: string;
  lunarDateText: string;
  birthHourBranch: string;
  zodiac: string;
  weekText: string;
  fourPillarsText: string;
  pillars: MingliPillar[];
  dayMaster: string;
  mingGong: string;
  shenGong: string;
  mingGongNaYin: string;
  shenGongNaYin: string;
  directions: {
    joy: string;
    wealth: string;
    fortune: string;
    yangGui: string;
    yinGui: string;
  };
  daily: {
    yi: string[];
    ji: string[];
    chong: string;
    sha: string;
    pengZu: string;
  };
};

const fallbackBranchByHour = ["子", "丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳", "午", "午", "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥", "子"];

function normalizeDateForCalendar(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return trimmed;
}

function parseDateParts(value?: string) {
  const normalized = normalizeDateForCalendar(value);
  const [year, month, day] = normalized.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day, normalized };
}

function parseTimeParts(value?: string) {
  const trimmed = (value || "").trim();
  const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?/);
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 12;
  const minute = match?.[2] ? Math.min(59, Math.max(0, Number(match[2]))) : 0;

  return { hour, minute, normalized: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function compactList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function callString(target: any, method: string, fallback = "") {
  try {
    const value = target?.[method]?.();
    return value == null ? fallback : String(value);
  } catch {
    return fallback;
  }
}

function buildPillar(label: MingliPillar["label"], eightChar: any, prefix: "Year" | "Month" | "Day" | "Time"): MingliPillar {
  const stem = callString(eightChar, `get${prefix}Gan`, "待");
  const branch = callString(eightChar, `get${prefix}Zhi`, "定");
  const hiddenStems = compactList(eightChar?.[`get${prefix}HideGan`]?.());

  return {
    label,
    stem,
    branch,
    ganZhi: `${stem}${branch}`,
    hiddenStems,
    stemTenGod: callString(eightChar, `get${prefix}ShiShenGan`, label === "日柱" ? "日主" : "待排盘"),
    branchTenGods: compactList(eightChar?.[`get${prefix}ShiShenZhi`]?.()),
    naYin: callString(eightChar, `get${prefix}NaYin`, "待校准"),
    emptyBranch: callString(eightChar, `get${prefix}XunKong`, "待校准"),
    wuXing: callString(eightChar, `get${prefix}WuXing`, "")
  };
}

function makeLunarInstance(birthDate?: string, birthTime?: string, calendarType: CalendarType = "Gregorian") {
  const date = parseDateParts(birthDate);
  if (!date) return null;

  const time = parseTimeParts(birthTime);

  if (calendarType === "Lunar") {
    return Lunar.fromYmdHms(date.year, date.month, date.day, time.hour, time.minute, 0);
  }

  return Solar.fromYmdHms(date.year, date.month, date.day, time.hour, time.minute, 0).getLunar();
}

export function getChineseHourBranchFromTime(birthTime?: string) {
  const { hour } = parseTimeParts(birthTime);
  return `${fallbackBranchByHour[hour] || "午"}时`;
}

export function getMingliCalendar(birthDate?: string, birthTime?: string, calendarType: CalendarType = "Gregorian"): MingliCalendarResult | null {
  const lunar = makeLunarInstance(birthDate, birthTime, calendarType);
  if (!lunar) return null;

  const eightChar = lunar.getEightChar();
  const solar = lunar.getSolar();
  const solarDate = callString(solar, "toYmd", normalizeDateForCalendar(birthDate));
  const solarTime = parseTimeParts(birthTime).normalized;
  const pillars = [
    buildPillar("年柱", eightChar, "Year"),
    buildPillar("月柱", eightChar, "Month"),
    buildPillar("日柱", eightChar, "Day"),
    buildPillar("时柱", eightChar, "Time")
  ];
  const lunarYear = callString(lunar, "getYearInChinese");
  const lunarMonth = callString(lunar, "getMonthInChinese");
  const lunarDay = callString(lunar, "getDayInChinese");
  const lunarDateText = `${lunarYear}年${lunarMonth}月${lunarDay} ${pillars[3].branch}时`;

  return {
    calendarType,
    solarDate,
    solarTime,
    lunarDate: callString(lunar, "toString", lunarDateText),
    lunarDateText,
    birthHourBranch: `${pillars[3].branch}时`,
    zodiac: callString(lunar, "getYearShengXiao"),
    weekText: callString(solar, "getWeekInChinese"),
    fourPillarsText: pillars.map((pillar) => pillar.ganZhi).join(" "),
    pillars,
    dayMaster: pillars[2].stem,
    mingGong: callString(eightChar, "getMingGong", "待校准"),
    shenGong: callString(eightChar, "getShenGong", "待校准"),
    mingGongNaYin: callString(eightChar, "getMingGongNaYin", "待校准"),
    shenGongNaYin: callString(eightChar, "getShenGongNaYin", "待校准"),
    directions: {
      joy: callString(lunar, "getDayPositionXiDesc", callString(lunar, "getPositionXiDesc")),
      wealth: callString(lunar, "getDayPositionCaiDesc", callString(lunar, "getPositionCaiDesc")),
      fortune: callString(lunar, "getDayPositionFuDesc", callString(lunar, "getPositionFuDesc")),
      yangGui: callString(lunar, "getDayPositionYangGuiDesc", callString(lunar, "getPositionYangGuiDesc")),
      yinGui: callString(lunar, "getDayPositionYinGuiDesc", callString(lunar, "getPositionYinGuiDesc"))
    },
    daily: {
      yi: compactList(lunar.getDayYi?.()),
      ji: compactList(lunar.getDayJi?.()),
      chong: callString(lunar, "getDayChongDesc"),
      sha: callString(lunar, "getDaySha"),
      pengZu: `${callString(lunar, "getPengZuGan")} ${callString(lunar, "getPengZuZhi")}`.trim()
    }
  };
}

export function getAutoLunarDateText(birthDate?: string, birthTime?: string, calendarType: CalendarType = "Gregorian") {
  if (calendarType === "Lunar") {
    return `${birthDate || "农历日期未填写"} ${getChineseHourBranchFromTime(birthTime)}`;
  }

  return getMingliCalendar(birthDate, birthTime, calendarType)?.lunarDateText || `农历待换算 ${getChineseHourBranchFromTime(birthTime)}`;
}
