import { prisma } from "@/lib/db";
import { Platform, ResultType } from "@/generated/prisma/client";
import { isoDate } from "@/lib/date-range";

// Bump via env if Meta deprecates this version (they run a ~2 year support
// window per version). Same version already used by the meta-ads-ratos skill
// as of its last update — verify against developers.facebook.com/docs/graph-api/changelog
// before relying on it long-term.
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? "v23.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Rate-limit error codes documented in the meta-ads-ratos skill (17, 32, 80004).
const RATE_LIMIT_CODES = new Set([17, 32, 80004]);

const LEAD_ACTION_TYPES = ["lead", "onsite_conversion.lead_grouped", "omni_lead"];
const PURCHASE_ACTION_TYPES = [
  "omni_purchase",
  "purchase",
  "onsite_web_purchase",
  "offsite_conversion.fb_pixel_purchase",
];
const LEAD_OBJECTIVES = new Set(["OUTCOME_LEADS", "LEAD_GENERATION"]);

type ActionEntry = { action_type: string; value: string };

function pickActionValue(actions: ActionEntry[] | undefined, candidates: string[]): number {
  if (!actions) return 0;
  for (const type of candidates) {
    const entry = actions.find((a) => a.action_type === type);
    if (entry) return Math.round(Number(entry.value));
  }
  return 0;
}

function pickActionMoney(values: ActionEntry[] | undefined, candidates: string[]): number {
  if (!values) return 0;
  for (const type of candidates) {
    const entry = values.find((a) => a.action_type === type);
    if (entry) return Number(entry.value);
  }
  return 0;
}

// Fetches an absolute, already-built Graph API URL as-is. Used both for the
// first page (built from GRAPH_BASE + path + params) and for pagination
// continuation (Meta's own `paging.next` links, followed verbatim — they
// sometimes point at a newer API version than GRAPH_VERSION, and rebuilding
// them from decomposed path+params risks double-encoding/duplicate-version
// bugs, so we never reconstruct them).
async function fetchGraphUrl<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok || json.error) {
      const code = json.error?.code;
      if (RATE_LIMIT_CODES.has(code) && attempt < 3) {
        await new Promise((r) => setTimeout(r, 60_000));
        continue;
      }
      throw new Error(`Meta Graph API error: ${json.error?.message ?? res.statusText}`);
    }
    return json as T;
  }
  throw new Error(`Meta Graph API: esgotou tentativas em ${url}`);
}

async function fetchGraph<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return fetchGraphUrl<T>(url.toString());
}

async function fetchAllPages<T>(
  path: string,
  params: Record<string, string>,
): Promise<T[]> {
  const results: T[] = [];
  const firstUrl = new URL(`${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) firstUrl.searchParams.set(k, v);

  let next: string | null = firstUrl.toString();

  while (next) {
    const json: { data: T[]; paging?: { next?: string } } = await fetchGraphUrl(next);
    results.push(...json.data);
    next = json.paging?.next ?? null;
  }

  return results;
}

type MetaCampaign = {
  id: string;
  name: string;
  objective: string;
  status: string;
};

type MetaCampaignInsight = {
  campaign_id: string;
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
};

type MetaAd = {
  id: string;
  name: string;
  campaign_id: string;
  creative?: { id: string; name?: string; thumbnail_url?: string };
};

type MetaAdInsight = {
  ad_id: string;
  date_start: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionEntry[];
  action_values?: ActionEntry[];
};

export async function syncMetaForClient(params: {
  clientId: string;
  metaAdAccountId: string;
  since: Date;
  until: Date;
}): Promise<{ recordsSynced: number }> {
  const { clientId, metaAdAccountId, since, until } = params;
  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new Error("META_ADS_TOKEN não configurado");

  const sinceStr = isoDate(since);
  const untilStr = isoDate(until);
  let recordsSynced = 0;

  // 1. Campaigns → upsert + classify resultType from objective.
  const campaigns = await fetchAllPages<MetaCampaign>(`/${metaAdAccountId}/campaigns`, {
    fields: "id,name,objective,status",
    access_token: token,
    limit: "200",
  });

  const campaignIdByExternal = new Map<string, string>();
  for (const c of campaigns) {
    const resultType = LEAD_OBJECTIVES.has(c.objective) ? ResultType.LEADS : ResultType.PURCHASES;
    const row = await prisma.campaign.upsert({
      where: {
        clientId_platform_externalId: {
          clientId,
          platform: Platform.META,
          externalId: c.id,
        },
      },
      update: { name: c.name, objective: c.objective, status: c.status, resultType },
      create: {
        clientId,
        platform: Platform.META,
        externalId: c.id,
        name: c.name,
        objective: c.objective,
        status: c.status,
        resultType,
      },
    });
    campaignIdByExternal.set(c.id, row.id);
    recordsSynced++;
  }

  // 2. Campaign-level daily insights → CampaignDailyMetric.
  const campaignInsights = await fetchAllPages<MetaCampaignInsight>(
    `/${metaAdAccountId}/insights`,
    {
      level: "campaign",
      time_increment: "1",
      time_range: JSON.stringify({ since: sinceStr, until: untilStr }),
      fields: "campaign_id,spend,impressions,clicks,actions,action_values",
      access_token: token,
      limit: "100",
    },
  );

  for (const row of campaignInsights) {
    const campaignId = campaignIdByExternal.get(row.campaign_id);
    if (!campaignId) continue;

    const leads = pickActionValue(row.actions, LEAD_ACTION_TYPES);
    const purchases = pickActionValue(row.actions, PURCHASE_ACTION_TYPES);
    const revenue = pickActionMoney(row.action_values, PURCHASE_ACTION_TYPES);

    await prisma.campaignDailyMetric.upsert({
      where: {
        campaignId_date: { campaignId, date: new Date(row.date_start) },
      },
      update: {
        spend: row.spend ?? "0",
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        leads,
        purchases,
        revenue: revenue.toFixed(2),
      },
      create: {
        campaignId,
        date: new Date(row.date_start),
        spend: row.spend ?? "0",
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        leads,
        purchases,
        revenue: revenue.toFixed(2),
      },
    });
    recordsSynced++;
  }

  // 3. Ads + creatives (thumbnail via field expansion) → Creative.
  const ads = await fetchAllPages<MetaAd>(`/${metaAdAccountId}/ads`, {
    fields: "id,name,campaign_id,creative{id,name,thumbnail_url}",
    access_token: token,
    limit: "100",
  });

  const creativeIdByAdId = new Map<string, string>();
  for (const ad of ads) {
    if (!ad.creative) continue;
    const campaignId = campaignIdByExternal.get(ad.campaign_id);

    const row = await prisma.creative.upsert({
      where: {
        clientId_platform_externalId: {
          clientId,
          platform: Platform.META,
          externalId: ad.creative.id,
        },
      },
      update: {
        name: ad.creative.name ?? ad.name,
        thumbnailUrl: ad.creative.thumbnail_url,
        campaignId,
        adId: ad.id,
      },
      create: {
        clientId,
        platform: Platform.META,
        externalId: ad.creative.id,
        adId: ad.id,
        campaignId,
        name: ad.creative.name ?? ad.name,
        thumbnailUrl: ad.creative.thumbnail_url,
      },
    });
    creativeIdByAdId.set(ad.id, row.id);
    recordsSynced++;
  }

  // 4. Ad-level daily insights → CreativeDailyMetric.
  const adInsights = await fetchAllPages<MetaAdInsight>(`/${metaAdAccountId}/insights`, {
    level: "ad",
    time_increment: "1",
    time_range: JSON.stringify({ since: sinceStr, until: untilStr }),
    fields: "ad_id,spend,impressions,clicks,actions,action_values",
    access_token: token,
    limit: "100",
  });

  for (const row of adInsights) {
    const creativeId = creativeIdByAdId.get(row.ad_id);
    if (!creativeId) continue;

    const purchases = pickActionValue(row.actions, PURCHASE_ACTION_TYPES);
    const revenue = pickActionMoney(row.action_values, PURCHASE_ACTION_TYPES);

    await prisma.creativeDailyMetric.upsert({
      where: {
        creativeId_date: { creativeId, date: new Date(row.date_start) },
      },
      update: {
        spend: row.spend ?? "0",
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        purchases,
        revenue: revenue.toFixed(2),
      },
      create: {
        creativeId,
        date: new Date(row.date_start),
        spend: row.spend ?? "0",
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        purchases,
        revenue: revenue.toFixed(2),
      },
    });
    recordsSynced++;
  }

  return { recordsSynced };
}
