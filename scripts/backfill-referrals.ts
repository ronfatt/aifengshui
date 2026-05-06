import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

function normalizeName(name?: string) {
  return (
    name
      ?.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5) || "USER"
  );
}

function codeFor(userId: string, name?: string) {
  return `YIXI-${normalizeName(name)}${userId.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

async function main() {
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let updated = 0;

  for (const user of data.users) {
    const metadata = user.user_metadata || {};
    const fullName = (metadata.full_name as string | undefined) || user.email?.split("@")[0] || "USER";

    if (!metadata.referral_code || !metadata.sponsor_code || !metadata.referral_source) {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          full_name: fullName,
          referral_code: metadata.referral_code || codeFor(user.id, fullName),
          sponsor_code: metadata.sponsor_code || "HQ001",
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
