import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Uses the service role key — bypasses RLS and can manage users. Server-only:
// never import this from a Client Component or expose the key to the browser.
// Used for admin operations like inviting new users.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
