import { NextResponse, type NextRequest } from "next/server";
import { syncAllClients } from "@/lib/sync/run-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when
  // a CRON_SECRET env var is set on the project — no custom headers needed.
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await syncAllClients();
  return NextResponse.json({ ok: true, results });
}
