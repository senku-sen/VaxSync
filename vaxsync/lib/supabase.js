import { createClient } from "@supabase/supabase-js";

// Prefer server-only env vars when available, fall back to NEXT_PUBLIC for dev
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase env vars are missing. Set SUPABASE_URL/SUPABASE_ANON_KEY or NEXT_PUBLIC_* variants."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;