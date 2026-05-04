import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  isSupabaseServiceConfigured,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl
} from "./config";
import type { Database } from "./types";

export function createServerSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient<Database>(supabaseUrl, isSupabaseServiceConfigured ? supabaseServiceRoleKey : supabaseAnonKey, {
    auth: {
      persistSession: false
    }
  });
}
