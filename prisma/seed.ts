import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { PrismaClient, Platform, ResultType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Deterministic PRNG so re-running the seed produces the same-looking demo data.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const DAYS = 30;

function dateNDaysAgo(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

type CampaignSeed = {
  platform: Platform;
  externalId: string;
  name: string;
  objective: string;
  status: string;
  resultType: ResultType;
  baseDailySpend: number;
  resultRate: number; // results per R$ spent
  revenuePerResult: number; // used when resultType is PURCHASES
};

async function seedClient(params: {
  slug: string;
  name: string;
  metaAdAccountId?: string;
  googleAdsCustomerId?: string;
  campaigns: CampaignSeed[];
  creatives?: { name: string; adSuffix: string }[];
}) {
  const client = await prisma.client.upsert({
    where: { slug: params.slug },
    update: {
      name: params.name,
      metaAdAccountId: params.metaAdAccountId,
      googleAdsCustomerId: params.googleAdsCustomerId,
    },
    create: {
      slug: params.slug,
      name: params.name,
      metaAdAccountId: params.metaAdAccountId,
      googleAdsCustomerId: params.googleAdsCustomerId,
    },
  });

  for (const c of params.campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: {
        clientId_platform_externalId: {
          clientId: client.id,
          platform: c.platform,
          externalId: c.externalId,
        },
      },
      update: {
        name: c.name,
        objective: c.objective,
        status: c.status,
        resultType: c.resultType,
      },
      create: {
        clientId: client.id,
        platform: c.platform,
        externalId: c.externalId,
        name: c.name,
        objective: c.objective,
        status: c.status,
        resultType: c.resultType,
      },
    });

    for (let i = DAYS - 1; i >= 0; i--) {
      const date = dateNDaysAgo(i);
      // Gentle upward trend + day-to-day noise, weekends a bit quieter.
      const dow = date.getUTCDay();
      const weekendFactor = dow === 0 || dow === 6 ? 0.7 : 1;
      const trendFactor = 0.8 + (0.5 * (DAYS - i)) / DAYS;
      const noise = 0.75 + rand() * 0.5;
      const spend =
        c.baseDailySpend * weekendFactor * trendFactor * noise;
      const results = Math.max(0, Math.round(spend * c.resultRate * (0.7 + rand() * 0.6)));
      const impressions = Math.round(spend * (80 + rand() * 40));
      const clicks = Math.round(impressions * (0.01 + rand() * 0.02));
      const revenue =
        c.resultType === ResultType.PURCHASES
          ? results * c.revenuePerResult * (0.85 + rand() * 0.3)
          : 0;

      await prisma.campaignDailyMetric.upsert({
        where: { campaignId_date: { campaignId: campaign.id, date } },
        update: {},
        create: {
          campaignId: campaign.id,
          date,
          spend: spend.toFixed(2),
          impressions,
          clicks,
          leads: c.resultType === ResultType.LEADS ? results : 0,
          purchases: c.resultType === ResultType.PURCHASES ? results : 0,
          revenue: revenue.toFixed(2),
        },
      });
    }

    // Creatives (Meta only) attached to the first Meta campaign for the client.
    if (c.platform === Platform.META && params.creatives) {
      for (const [idx, cr] of params.creatives.entries()) {
        const creative = await prisma.creative.upsert({
          where: {
            clientId_platform_externalId: {
              clientId: client.id,
              platform: Platform.META,
              externalId: `${c.externalId}-creative-${idx}`,
            },
          },
          update: { name: cr.name, campaignId: campaign.id },
          create: {
            clientId: client.id,
            campaignId: campaign.id,
            platform: Platform.META,
            externalId: `${c.externalId}-creative-${idx}`,
            adId: `${c.externalId}-ad-${idx}`,
            name: cr.name,
            thumbnailUrl: `https://picsum.photos/seed/${params.slug}-${cr.adSuffix}/200/200`,
            status: "ACTIVE",
          },
        });

        for (let i = DAYS - 1; i >= 0; i--) {
          const date = dateNDaysAgo(i);
          const noise = 0.6 + rand() * 0.8;
          const spend = 15 * noise * (idx === 0 ? 1.6 : 1);
          const purchases = Math.round(spend * 0.08 * (0.6 + rand() * 0.8));
          const revenue = purchases * 180 * (0.8 + rand() * 0.4);
          const impressions = Math.round(spend * 90);
          const clicks = Math.round(impressions * 0.015);

          await prisma.creativeDailyMetric.upsert({
            where: { creativeId_date: { creativeId: creative.id, date } },
            update: {},
            create: {
              creativeId: creative.id,
              date,
              spend: spend.toFixed(2),
              impressions,
              clicks,
              purchases,
              revenue: revenue.toFixed(2),
            },
          });
        }
      }
    }
  }

  return client;
}

async function main() {
  await seedClient({
    slug: "winepopper",
    name: "Winepopper",
    metaAdAccountId: "act_536931227174862",
    googleAdsCustomerId: "1234567890",
    campaigns: [
      {
        platform: Platform.META,
        externalId: "seed-wp-meta-sales",
        name: "PM [Conversão] Winepopper - Catálogo",
        objective: "OUTCOME_SALES",
        status: "ACTIVE",
        resultType: ResultType.PURCHASES,
        baseDailySpend: 220,
        resultRate: 0.02,
        revenuePerResult: 220,
      },
      {
        platform: Platform.META,
        externalId: "seed-wp-meta-leads",
        name: "FD [Leads] Winepopper - B2B Brindes",
        objective: "OUTCOME_LEADS",
        status: "ACTIVE",
        resultType: ResultType.LEADS,
        baseDailySpend: 90,
        resultRate: 0.06,
        revenuePerResult: 0,
      },
      {
        platform: Platform.GOOGLE,
        externalId: "seed-wp-google-search",
        name: "Search - Winepopper Genérico",
        objective: "SEARCH",
        status: "ACTIVE",
        resultType: ResultType.PURCHASES,
        baseDailySpend: 150,
        resultRate: 0.015,
        revenuePerResult: 240,
      },
    ],
    creatives: [
      { name: "Feed - Abridor a gás em ação", adSuffix: "feed-acao" },
      { name: "Stories - Depoimento cliente", adSuffix: "stories-depoimento" },
      { name: "Feed - Kit presente", adSuffix: "feed-kit" },
      { name: "Reels - Unboxing", adSuffix: "reels-unboxing" },
    ],
  });

  await seedClient({
    slug: "code-collections",
    name: "Code Collections",
    metaAdAccountId: "act_812922295905185",
    campaigns: [
      {
        platform: Platform.META,
        externalId: "seed-cc-meta-sales",
        name: "PM [Conversão] COD COLLECTION",
        objective: "OUTCOME_SALES",
        status: "ACTIVE",
        resultType: ResultType.PURCHASES,
        baseDailySpend: 320,
        resultRate: 0.018,
        revenuePerResult: 190,
      },
      {
        platform: Platform.META,
        externalId: "seed-cc-meta-remarketing",
        name: "FD - [Conversão] SITE - Remarketing",
        objective: "OUTCOME_SALES",
        status: "ACTIVE",
        resultType: ResultType.PURCHASES,
        baseDailySpend: 110,
        resultRate: 0.03,
        revenuePerResult: 190,
      },
      {
        platform: Platform.GOOGLE,
        externalId: "seed-cc-google-pmax",
        name: "Performance Max - Code Collections",
        objective: "PERFORMANCE_MAX",
        status: "ACTIVE",
        resultType: ResultType.PURCHASES,
        baseDailySpend: 180,
        resultRate: 0.014,
        revenuePerResult: 210,
      },
    ],
    creatives: [
      { name: "Feed - Look completo", adSuffix: "feed-look" },
      { name: "Stories - Nova coleção", adSuffix: "stories-colecao" },
      { name: "Feed - Detalhe do tecido", adSuffix: "feed-tecido" },
    ],
  });

  console.log("Seed concluído: winepopper e code-collections com 30 dias de métricas.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
