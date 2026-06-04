import type { ISODateString, ISODateTimeString } from "@/lib/types/primitives";
import type { CalendarType, DestinyBirthProfile, Gender } from "@/lib/types/user";

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yin" | "yang";
export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

export type LunarDateInfo = {
  lunarYear: string;
  lunarMonth: string;
  lunarDay: string;
  zodiac?: string;
  ganzhiYear?: string;
  ganzhiMonth?: string;
  ganzhiDay?: string;
  ganzhiHour?: string;
};

export type BaziPillar = {
  stem: HeavenlyStem | string;
  branch: EarthlyBranch | string;
  hiddenStems: string[];
  tenGod: string;
  naYin: string;
  emptyBranch?: string;
};

export type BaziChart = {
  profile: DestinyBirthProfile;
  calendarType: CalendarType;
  gregorianDate: ISODateString;
  lunar: LunarDateInfo;
  yearPillar: BaziPillar;
  monthPillar: BaziPillar;
  dayPillar: BaziPillar;
  hourPillar?: BaziPillar;
  dayMaster: string;
  usefulGod?: string;
  avoidGod?: string;
};

export type ZiweiPalace = {
  name: string;
  branch: EarthlyBranch | string;
  ageRange: string;
  majorStars: string[];
  minorStars: string[];
  transformations: string[];
  summary: string;
  score?: number;
};

export type ZiweiChart = {
  profile: DestinyBirthProfile;
  mingGong: string;
  shenGong: string;
  wuXingJu: string;
  lifeMaster: string;
  bodyMaster: string;
  mainStar: string;
  palaces: ZiweiPalace[];
};

export type MeihuaDivinationInput = {
  fullName: string;
  gender: Gender;
  questionCategory: string;
  question: string;
  divinationTime: ISODateTimeString;
  numbers?: [number, number, number];
  mode: "random_number" | "time_based" | "manual_number";
};

export type MeihuaReading = {
  mainHexagram: string;
  mutualHexagram: string;
  changingHexagram: string;
  movingLine: number;
  bodyTrigram: string;
  useTrigram: string;
  bodyUseRelation: "use_generates_body" | "same_element" | "body_controls_use" | "body_generates_use" | "use_controls_body";
  summary: string;
};

export type NumerologyProfile = {
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  birthdayNumber: number;
  maturityNumber: number;
  personalYearNumber: number;
};

