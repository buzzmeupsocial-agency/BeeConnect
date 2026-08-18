import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { eachDayUTC, formatDateBR, getCurrentMonthRange, isoDate } from "@/lib/date-range";
import { projectPace } from "@/lib/projections";
import { formatCurrencyBRL } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { InvestmentChart, type InvestmentPoint } from "@/components/charts/investment-chart";
import { Platform } from "@/generated/prisma/client";

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ clientSlug: string }>;
}) {
  const { clientSlug } = await params;
  const { client } = await requireClientAccess(clientSlug);
  const { from, to, daysInMonth, daysRemaining } = getCurrentMonthRange();

  const metrics = await prisma.campaignDailyMetric.findMany({
    where: {
      campaign: { clientId: client.id },
      date: { gte: from, lte: to },
    },
    select: {
      date: true,
      spend: true,
      campaign: { select: { platform: true } },
    },
  });

  const byDate = new Map<string, { meta: number; google: number }>();
  for (const m of metrics) {
    const key = isoDate(m.date);
    const bucket = byDate.get(key) ?? { meta: 0, google: 0 };
    const spend = Number(m.spend);
    if (m.campaign.platform === Platform.META) bucket.meta += spend;
    else bucket.google += spend;
    byDate.set(key, bucket);
  }

  // Chart spans the whole month (realized days + the days still ahead) so
  // the projection line visibly reaches the end of the month.
  const monthDays = eachDayUTC(from, daysInMonth);
  const todayKey = isoDate(to);

  const realizedTotals: number[] = [];
  for (const d of monthDays) {
    const key = isoDate(d);
    if (key > todayKey) break;
    const bucket = byDate.get(key) ?? { meta: 0, google: 0 };
    realizedTotals.push(bucket.meta + bucket.google);
  }
  const { realized, projected, dailyPace } = projectPace(realizedTotals, daysRemaining);

  const data: InvestmentPoint[] = monthDays.map((d) => {
    const key = isoDate(d);
    const isFuture = key > todayKey;
    const bucket = byDate.get(key) ?? { meta: 0, google: 0 };

    let projecao: number | null = null;
    if (key === todayKey) {
      // Bridge point: today's realized total, so the dashed line starts
      // exactly where the solid bars end.
      projecao = bucket.meta + bucket.google;
    } else if (isFuture) {
      projecao = dailyPace;
    }

    return {
      date: key,
      label: formatDateBR(d),
      meta: isFuture ? 0 : bucket.meta,
      google: isFuture ? 0 : bucket.google,
      projecao,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Investido no mês"
          value={formatCurrencyBRL(realized)}
          hint={`Meta + Google, até ${formatDateBR(to)}`}
        />
        <StatTile
          label="Ritmo diário (últimos 7 dias)"
          value={formatCurrencyBRL(dailyPace)}
          hint="Média diária usada na projeção"
        />
        <StatTile
          label="Projeção para o mês"
          value={formatCurrencyBRL(projected)}
          hint={`${daysRemaining} dia(s) restante(s) no ritmo atual`}
        />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Investimento diário — Meta Ads vs Google Ads
        </h2>
        <InvestmentChart data={data} />
      </div>
    </div>
  );
}
