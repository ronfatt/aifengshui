import type { CreditAmount, ISODateString, ISODateTimeString } from "@/lib/types/primitives";

export type MembershipTier = "free" | "tactical" | "strategic";

export type PartnerPackage = "none" | "startup_8888" | "partner_16888" | "regional_38888";

export type UserRole = "member" | "partner" | "admin" | "super_admin";

export type Gender = "male" | "female" | "other" | "unknown" | string;

export type CalendarType = "gregorian" | "lunar";

export type MemberProfile = {
  id?: string;
  name: string;
  birthDate: ISODateString;
  birthYear: string;
  birthTime: string;
  birthTimeLabel: string;
  gender: Gender;
  email: string;
  phone: string;
  region: string;
};

export type UserAccount = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  membershipTier: MembershipTier;
  partnerPackage: PartnerPackage;
  creditBalance: CreditAmount;
  referralCode: string;
  sponsorCode: string;
  sponsorUserId?: string | null;
  referralSource: string;
  isFrozen: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

export type DestinyBirthProfile = {
  fullName: string;
  gender: Gender;
  birthDate: ISODateString;
  birthTime?: string | null;
  birthLocation?: string | null;
  calendarType: CalendarType;
  timezone?: string | null;
};

