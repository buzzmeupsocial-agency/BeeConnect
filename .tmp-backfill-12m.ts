import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
process.env.DATABASE_URL = process.env.DIRECT_URL;

import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function monthChunks(monthsBack: number): { since: Date; until: Date; label: string }[] {
  const chunks: { since: Date; until: Date; label: string }[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (monthsBack - 1), 1));

  while (cursor <= today) {
    const monthStart = new Date(cursor);
    const monthEndCandidate = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const monthEnd = monthEndCandidate > today ? today : monthEndCandidate;
    chunks.push({
      since: monthStart,
      until: monthEnd,
      label: `${monthStart.toISOString().slice(0, 7)}`,
    });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return chunks;
}

async function main() {
  const { syncMetaForClient } = await import("./src/lib/sync/meta");
  const { syncGoogleForClient } = await import("./src/lib/sync/google");

  const jobs: { slug: string; platform: "META" | "GOOGLE" }[] = [
    { slug: "winepopper", platform: "META" },
    { slug: "winepopper", platform: "GOOGLE" },
    { slug: "code-collections", platform: "META" },
  ];

  const chunks = monthChunks(12);
  console.log(`Janelas: ${chunks.map((c) => c.label).join(", ")}`);

  const results: { job: string; chunk: string; ok: boolean; records?: number; error?: string }[] = [];

  for (const job of jobs) {
    const client = await prisma.client.findUniqueOrThrow({ where: { slug: job.slug } });
    for (const chunk of chunks) {
      const jobLabel = `${job.slug}/${job.platform}/${chunk.label}`;
      try {
        let recordsSynced = 0;
        if (job.platform === "META") {
          if (!client.metaAdAccountId) throw new Error("sem metaAdAccountId");
          ({ recordsSynced } = await syncMetaForClient({
            clientId: client.id,
            metaAdAccountId: client.metaAdAccountId,
            since: chunk.since,
            until: chunk.until,
          }));
        } else {
          if (!client.googleAdsCustomerId) throw new Error("sem googleAdsCustomerId");
          ({ recordsSynced } = await syncGoogleForClient({
            clientId: client.id,
            googleAdsCustomerId: client.googleAdsCustomerId,
            since: chunk.since,
            until: chunk.until,
          }));
        }
        console.log(`OK   ${jobLabel}: ${recordsSynced} registros`);
        results.push({ job: `${job.slug}/${job.platform}`, chunk: chunk.label, ok: true, records: recordsSynced });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`FALHA ${jobLabel}: ${msg}`);
        results.push({ job: `${job.slug}/${job.platform}`, chunk: chunk.label, ok: false, error: msg });
      }
    }
  }

  const totalRecords = results.reduce((s, r) => s + (r.records ?? 0), 0);
  const failures = results.filter((r) => !r.ok);
  console.log(`\n=== RESUMO ===`);
  console.log(`Total de registros sincronizados: ${totalRecords}`);
  console.log(`Falhas: ${failures.length}`);
  if (failures.length) console.log(JSON.stringify(failures, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("ERRO FATAL:", e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
