"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landing page for Supabase invite/magic-link/recovery emails. The tokens
// arrive in the URL hash (never sent to the server), so they can only be
// picked up here, client-side — this establishes the session (which
// @supabase/ssr syncs into cookies) and then hands off to the app.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const supabase = createClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError(error.message);
          return;
        }
        router.replace("/");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
        router.replace("/");
        return;
      }

      setError("Link inválido ou expirado.");
    }

    run();
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">
        {error ? (
          <>
            {error}{" "}
            <a href="/login" className="underline">
              Ir para o login
            </a>
          </>
        ) : (
          "Entrando..."
        )}
      </p>
    </div>
  );
}
