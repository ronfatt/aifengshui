import type { ISODateTimeString, MoneyCents } from "@/lib/types/primitives";
import type { PartnerPackage } from "@/lib/types/user";

export type ReferralRelationship = {
  userId: string;
  sponsorUserId: string;
  sponsorCode: string;
  referralCode: string;
  level: 1 | 2 | 3;
  createdAt: ISODateTimeString;
};

export type CommissionStatus = "pending" | "approved" | "paid" | "rejected" | "clawed_back";

export type CommissionLedgerEntry = {
  id: string;
  beneficiaryUserId: string;
  sourceUserId: string;
  orderId: string;
  level: 1 | 2 | 3;
  rate: number;
  amountCents: MoneyCents;
  status: CommissionStatus;
  approvedBy?: string | null;
  paidAt?: ISODateTimeString | null;
  createdAt: ISODateTimeString;
};

export type PoolShareTier = {
  partnerPackage: Exclude<PartnerPackage, "none">;
  allocationRate: number;
  eligibleMembers: number;
  poolAmountCents: MoneyCents;
  amountPerMemberCents: MoneyCents;
};

export type PoolShareBatch = {
  id: string;
  period: string;
  qualifiedRevenueCents: MoneyCents;
  poolRate: number;
  poolTotalCents: MoneyCents;
  tiers: PoolShareTier[];
  status: "calculated" | "approved" | "paid" | "void";
  approvedBy?: string | null;
  createdAt: ISODateTimeString;
};

