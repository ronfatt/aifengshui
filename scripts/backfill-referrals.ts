import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";
import { companySponsorCode, generateShortReferralCode, isShortReferralCode, normalizeReferralCode } from "../lib/referral-code";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const codeMap = new Map<string, string>();
  const usedCodes = new Set<string>([companySponsorCode]);
  let updated = 0;

  for (const user of data.users) {
    const metadata = user.user_metadata || {};
    const fullName = (metadata.full_name as string | undefined) || user.email?.split("@")[0] || "USER";
    const oldCode = normalizeReferralCode(metadata.referral_code as string | undefined);
    let nextCode = isShortReferralCode(oldCode) && !usedCodes.has(oldCode) ? oldCode : "";

    for (let attempt = 0; !nextCode && attempt < 20; attempt += 1) {
      const candidate = generateShortReferralCode(`${user.id}:${user.email || fullName}`, String(attempt));

      if (!usedCodes.has(candidate)) {
        nextCode = candidate;
      }
    }

    nextCode ||= generateShortReferralCode(`${user.id}:${Date.now()}`);
    usedCodes.add(nextCode);

    if (oldCode) {
      codeMap.set(oldCode, nextCode);
    }
  }

  for (const user of data.users) {
    const metadata = user.user_metadata || {};
    const fullName = (metadata.full_name as string | undefined) || user.email?.split("@")[0] || "USER";
    const oldCode = normalizeReferralCode(metadata.referral_code as string | undefined);
    const oldSponsor = normalizeReferralCode(metadata.sponsor_code as string | undefined);
    const nextCode = oldCode ? codeMap.get(oldCode) || generateShortReferralCode(user.id) : generateShortReferralCode(user.id);
    const nextSponsor = oldSponsor && oldSponsor !== companySponsorCode ? codeMap.get(oldSponsor) || companySponsorCode : companySponsorCode;

    if (metadata.referral_code !== nextCode || metadata.sponsor_code !== nextSponsor || !metadata.referral_source) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          full_name: fullName,
          referral_code: nextCode,
          sponsor_code: nextSponsor,
          referral_source: metadata.referral_source || "organic_hq"
        }
      });
      updated += 1;
    }
  }

  console.log(`referral metadata backfilled=${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
