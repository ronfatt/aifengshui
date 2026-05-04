"use client";

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";
import type { Database } from "./types";

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

