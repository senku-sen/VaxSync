import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not configured.");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing. Add it to your environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function migrateRoles() {
  console.log("🔄 Updating user roles from 'RHM/HRH' to 'Head Nurse'...");

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ user_role: "Head Nurse" })
    .eq("user_role", "RHM/HRH")
    .select("id, email");

  if (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  const updatedCount = Array.isArray(data) ? data.length : 0;
  console.log(`✅ Migration complete. Updated ${updatedCount} user${updatedCount === 1 ? "" : "s"}.`);
}

migrateRoles()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Unexpected error during migration:", err);
    process.exit(1);
  });

