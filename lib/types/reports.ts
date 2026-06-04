import type { CreditAmount, ISODateTimeString } from "@/lib/types/primitives";
import type { DestinyBirthProfile } from "@/lib/types/user";

export type ReportType =
  | "integrated"
  | "bazi"
  | "ziwei"
  | "meihua"
  | "numerology"
  | "wealth"
  | "career"
  | "relationship"
  | "annual"
  | "opening_date"
  | "home_fengshui"
  | "company_fengshui";

export type ReportFocus = "career" | "wealth" | "relationship" | "health" | "business" | "yearly_luck" | "general";

export type ReportSection = {
  title: string;
  content: string;
  tags?: string[];
  score?: number;
};

export type ReportArtifact = {
  pdfUrl?: string | null;
  svgUrl?: string | null;
  txtUrl?: string | null;
};

export type PaidReport = {
  id: string;
  userId: string;
  title: string;
  type: ReportType;
  focus: ReportFocus;
  points: CreditAmount;
  profile: DestinyBirthProfile;
  summary: string;
  sections: ReportSection[];
  artifact?: ReportArtifact;
  status: "generating" | "saved" | "failed";
  createdAt: ISODateTimeString;
  updatedAt?: ISODateTimeString;
};

export type ReportPromptTemplate = {
  id: string;
  reportType: ReportType;
  title: string;
  creditCost: CreditAmount;
  systemPrompt: string;
  outputSchemaVersion: string;
  isActive: boolean;
  updatedAt: ISODateTimeString;
};

