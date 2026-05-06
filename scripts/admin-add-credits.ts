import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

async function main() {
  const [, , rawEmail, rawAmount] = process.argv;
  const email = rawEmail?.trim().toLowerCase();
  const amount = Number(rawAmount);

  if (!email || !Number.isFinite(amount)) {
    throw new Error("Usage: npx -y tsx scripts/admin-add-credits.ts user@email.com 10000");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,credit_balance")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message || `Profile not found for ${email}`);
  }

  const nextBalance = profile.credit_balance + amount;

  if (nextBalance < 0) {
    throw new Error(`Credit balance cannot be negative. Current=${profile.credit_balance}, amount=${amount}`);
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ credit_balance: nextBalance, updated_at: new Date().toISOString() })
    .eq("id", profile.id)
    .select("email,credit_balance")
    .single();

  if (updateError || !updatedProfile) {
    throw new Error(updateError?.message || "Failed to update credit balance");
  }

  await supabase.from("credit_transactions").insert({
    user_id: profile.id,
    amount,
    source: "admin_script",
    description: `Admin manually adjusted ${amount} credits`
  });

  console.log(`${updatedProfile.email} credit_balance=${updatedProfile.credit_balance}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
