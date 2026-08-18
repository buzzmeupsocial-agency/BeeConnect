import { prisma } from "@/lib/db";
import { Platform, SyncStatus, type Client } from "@/generated/prisma/client";
import { syncMetaForClient } from "@/lib/sync/meta";
import { syncGoogleForClient } from "@/lib/sync/google";

// Re-pulls a trailing window (not just "yesterday") because both platforms
// can adjust attribution/conversion counts retroactively for a few days.
function trailingWindow(days: number) {
  const until = new Date();
  until.setUTCHours(0, 0, 0, 0);
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  return { since, until };
}

async function runOne(clientId: string, platform: Platform, fn: () => Promise<{ recordsSynced: number }>) {
  const run = await prisma.syncRun.create({ data: { clientId, platform } });
  try {
    const { recordsSynced } = await fn();
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: SyncStatus.SUCCESS, finishedAt: new Date(), recordsSynced },
    });
    return { platform, status: "success" as const, recordsSynced };
  } catch (error) {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: SyncStatus.ERROR,
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return { platform, status: "error" as const, error: String(error) };
  }
}

export async function syncClient(client: Client) {
  const { since, until } = trailingWindow(3);
  const results = [];

  if (client.metaAdAccountId) {
    results.push(
      await runOne(client.id, Platform.META, () =>
        syncMetaForClient({
          clientId: client.id,
          metaAdAccountId: client.metaAdAccountId!,
          since,
          until,
        }),
      ),
    );
  }

  if (client.googleAdsCustomerId) {
    results.push(
      await runOne(client.id, Platform.GOOGLE, () =>
        syncGoogleForClient({
          clientId: client.id,
          googleAdsCustomerId: client.googleAdsCustomerId!,
          since,
          until,
        }),
      ),
    );
  }

  return { clientId: client.id, clientSlug: client.slug, results };
}

export async function syncAllClients() {
  const clients = await prisma.client.findMany();
  const out = [];
  for (const client of clients) {
    out.push(await syncClient(client));
  }
  return out;
}
