import { prisma } from "@/lib/db";
import type { Platform } from "@/generated/prisma/client";

// Campaigns with at least one day of real activity (spend, leads or
// purchases) inside the given period — used to populate the campaign filter
// on the Investimento/Leads dashboards, so the dropdown doesn't get cluttered
// with long-paused or never-active campaigns. Pass `platform` to scope the
// list to one channel (used for the per-channel selectors on Investimento).
export async function getActiveCampaignsInPeriod(
  clientId: string,
  from: Date,
  to: Date,
  platform?: Platform,
) {
  return prisma.campaign.findMany({
    where: {
      clientId,
      ...(platform ? { platform } : {}),
      metrics: {
        some: {
          date: { gte: from, lte: to },
          OR: [{ spend: { gt: 0 } }, { leads: { gt: 0 } }, { purchases: { gt: 0 } }],
        },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
