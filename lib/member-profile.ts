import type { MemberProfile } from "@/lib/types/user";

export const emptyMemberProfile: MemberProfile = {
  name: "未填写",
  birthDate: "",
  birthYear: "",
  birthTime: "",
  birthTimeLabel: "未填写",
  gender: "未填写",
  email: "",
  phone: "",
  region: "Malaysia / Kuala Lumpur"
};
export type { MemberProfile };
