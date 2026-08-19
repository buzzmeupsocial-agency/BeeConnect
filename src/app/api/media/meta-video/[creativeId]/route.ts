import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// Ad videos are almost always unpublished "dark posts" (never shown on the
// Page timeline), so the Video node's `source` field comes back empty even
// with full ads_management permission, and the public FB video plugin embed
// 404s on them ("vídeo indisponível"). The one endpoint that actually works
// for previewing your own dark-post ad creative is the Ad Creative Preview
// API (`/{creativeId}/previews`) — it returns a signed, time-limited iframe
// URL that renders the ad (video included) with no viewer login required.
// We never cache that URL — it expires — so this route re-resolves a fresh
// one on every load and redirects the <iframe> straight to it.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ creativeId: string }> },
) {
  const { creativeId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creative = await prisma.creative.findUnique({ where: { id: creativeId } });
  if (!creative || !creative.videoId) {
    return NextResponse.json({ error: "vídeo não encontrado" }, { status: 404 });
  }

  if (!profile.isAdmin) {
    const access = await prisma.userClientAccess.findUnique({
      where: { userId_clientId: { userId: profile.id, clientId: creative.clientId } },
    });
    if (!access) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = process.env.META_ADS_TOKEN;
  if (!token) return NextResponse.json({ error: "META_ADS_TOKEN não configurado" }, { status: 500 });

  const version = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  const url = new URL(`https://graph.facebook.com/${version}/${creative.externalId}/previews`);
  url.searchParams.set("ad_format", "MOBILE_FEED_STANDARD");
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  const body: string | undefined = json.data?.[0]?.body;
  const iframeSrc = body?.match(/src="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");

  if (!res.ok || !iframeSrc) {
    return NextResponse.json({ error: json.error?.message ?? "preview indisponível" }, { status: 502 });
  }

  return NextResponse.redirect(iframeSrc, { status: 302 });
}
