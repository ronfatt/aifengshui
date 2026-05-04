import { demoMemberProfile } from "@/lib/member-profile";
import type { ProfileRow } from "@/lib/supabase/types";

export function profileRowToMemberProfile(profile: ProfileRow) {
  return {
    name: profile.full_name,
    birthDate: profile.birth_date,
    birthYear: profile.birth_date.slice(0, 4),
    birthTime: profile.birth_time || "",
    birthTimeLabel: profile.birth_time || "未填写",
    gender: profile.gender,
    email: profile.email,
    phone: profile.phone || "",
    region: profile.region || demoMemberProfile.region
  };
}

