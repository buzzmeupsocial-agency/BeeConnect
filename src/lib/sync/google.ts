import { GoogleAdsApi } from "google-ads-api";
import { prisma } from "@/lib/db";
import { Platform, ResultType } from "@/generated/prisma/client";
import { isoDate } from "@/lib/date-range";

// Google Ads has no campaign-level "objective" like Meta. We infer
// leads-vs-purchases from which conversion_action_category dominates each
// campaign in the period. See prisma/schema.prisma Campaign.resultType.
const LEAD_CATEGORIES = new Set([
  "LEAD",
  "SUBMIT_LEAD_FORM",
  "PHONE_CALL_LEAD",
  "IMPORTED_LEAD",
  "QUALIFIED_LEAD",
  "CONVERT_LEAD",
  "BOOK_APPOINTMENT",
  "REQUEST_QUOTE",
  "SIGN_UP",
  "CONTACT",
]);
const PURCHASE_CATEGORIES = new Set([
  "PURCHASE",
  "ADD_TO_CART",
  "BEGIN_CHECKOUT",
  "SUBSCRIBE_PAID",
  "STORE_SALE",
]);

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} não configurado`);
  return v;
}

function client() {
  return new GoogleAdsApi({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
    developer_token: requireEnv("GOOGLE_DEVELOPER_TOKEN"),
  });
}

export async function syncGoogleForClient(params: {
  clientId: string;
  googleAdsCustomerId: string;
  since: Date;
  until: Date;
}): Promise<{ recordsSynced: number }> {
  const { clientId, googleAdsCustomerId, since, until } = params;
  const sinceStr = isoDate(since);
  const untilStr = isoDate(until);
  let recordsSynced = 0;

  const customer = client().Customer({
    customer_id: googleAdsCustomerId,
    refresh_token: requireEnv("GOOGLE_REFRESH_TOKEN"),
    login_customer_id: requireEnv("GOOGLE_LOGIN_CUSTOMER_ID"),
  });

  // 1. Cost/clicks/impressions per campaign-day — not segmented by
  // conversion category, so cost isn't double-counted across segment rows.
  const costRows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      segments.date,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions
    FROM campaign
    WHERE segments.date BETWEEN '${sinceStr}' AND '${untilStr}'
      AND campaign.status != 'REMOVED'
  `);

  // 2. Conversions segmented by category — used to classify resultType and
  // split leads vs purchases. Cost is intentionally not requested here.
  const conversionRows = await customer.query(`
    SELECT
      campaign.id,
      segments.date,
      segments.conversion_action_category,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${sinceStr}' AND '${untilStr}'
      AND campaign.status != 'REMOVED'
  `);

  type ConvByDay = { leads: number; purchases: number; revenue: number };
  const convByCampaignDay = new Map<string, ConvByDay>();
  const leadTotalByCampaign = new Map<string, number>();
  const purchaseTotalByCampaign = new Map<string, number>();

  for (const row of conversionRows) {
    const campaignId = String(row.campaign?.id);
    const date = String(row.segments?.date);
    const category = String(row.segments?.conversion_action_category ?? "");
    const conversions = Number(row.metrics?.conversions ?? 0);
    const value = Number(row.metrics?.conversions_value ?? 0);

    const key = `${campaignId}:${date}`;
    const bucket = convByCampaignDay.get(key) ?? { leads: 0, purchases: 0, revenue: 0 };

    if (LEAD_CATEGORIES.has(category)) {
      bucket.leads += conversions;
      leadTotalByCampaign.set(
        campaignId,
        (leadTotalByCampaign.get(campaignId) ?? 0) + conversions,
      );
    } else if (PURCHASE_CATEGORIES.has(category)) {
      bucket.purchases += conversions;
      bucket.revenue += value;
      purchaseTotalByCampaign.set(
        campaignId,
        (purchaseTotalByCampaign.get(campaignId) ?? 0) + conversions,
      );
    }

    convByCampaignDay.set(key, bucket);
  }

  // 3. Upsert campaigns, resultType = whichever bucket dominates the period.
  const campaignIdByExternal = new Map<string, string>();
  const seenCampaigns = new Map<
    string,
    { name: string; status: string; channelType: string }
  >();
  for (const row of costRows) {
    const externalId = String(row.campaign?.id);
    if (!seenCampaigns.has(externalId)) {
      seenCampaigns.set(externalId, {
        name: String(row.campaign?.name ?? externalId),
        status: String(row.campaign?.status ?? ""),
        channelType: String(row.campaign?.advertising_channel_type ?? ""),
      });
    }
  }

  for (const [externalId, meta] of seenCampaigns) {
    const leads = leadTotalByCampaign.get(externalId) ?? 0;
    const purchases = purchaseTotalByCampaign.get(externalId) ?? 0;
    const resultType = leads > purchases ? ResultType.LEADS : ResultType.PURCHASES;

    const campaignRow = await prisma.campaign.upsert({
      where: {
        clientId_platform_externalId: {
          clientId,
          platform: Platform.GOOGLE,
          externalId,
        },
      },
      update: {
        name: meta.name,
        objective: meta.channelType,
        status: meta.status,
        resultType,
      },
      create: {
        clientId,
        platform: Platform.GOOGLE,
        externalId,
        name: meta.name,
        objective: meta.channelType,
        status: meta.status,
        resultType,
      },
    });
    campaignIdByExternal.set(externalId, campaignRow.id);
    recordsSynced++;
  }

  // 4. Upsert CampaignDailyMetric, merging cost with the classified conversions.
  for (const row of costRows) {
    const externalId = String(row.campaign?.id);
    const campaignId = campaignIdByExternal.get(externalId);
    if (!campaignId) continue;

    const date = String(row.segments?.date);
    const spend = Number(row.metrics?.cost_micros ?? 0) / 1_000_000;
    const conv = convByCampaignDay.get(`${externalId}:${date}`) ?? {
      leads: 0,
      purchases: 0,
      revenue: 0,
    };

    await prisma.campaignDailyMetric.upsert({
      where: { campaignId_date: { campaignId, date: new Date(date) } },
      update: {
        spend: spend.toFixed(2),
        impressions: Number(row.metrics?.impressions ?? 0),
        clicks: Number(row.metrics?.clicks ?? 0),
        leads: Math.round(conv.leads),
        purchases: Math.round(conv.purchases),
        revenue: conv.revenue.toFixed(2),
      },
      create: {
        campaignId,
        date: new Date(date),
        spend: spend.toFixed(2),
        impressions: Number(row.metrics?.impressions ?? 0),
        clicks: Number(row.metrics?.clicks ?? 0),
        leads: Math.round(conv.leads),
        purchases: Math.round(conv.purchases),
        revenue: conv.revenue.toFixed(2),
      },
    });
    recordsSynced++;
  }

  return { recordsSynced };
}
