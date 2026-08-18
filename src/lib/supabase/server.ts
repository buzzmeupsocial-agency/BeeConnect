import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Create a fresh Supabase server client per request. Must be called inside
// Server Components / Server Actions / Route Handlers (needs the request's
// cookie store). Do not cache/reuse across requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component render (cookies are read-only
            // there) — safe to ignore, proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}
