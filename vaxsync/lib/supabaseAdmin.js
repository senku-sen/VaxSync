import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";

export const hasSupabaseAdmin = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

if (!hasSupabaseAdmin) {
  console.warn(
    "Supabase service-role env vars are missing. Admin API routes will fail until SUPABASE_SERVICE_ROLE_KEY is set."
  );
}

export const supabaseAdmin = hasSupabaseAdmin
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
      },
    })
  : null;

export default supabaseAdmin;
