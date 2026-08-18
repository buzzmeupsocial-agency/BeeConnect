import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { formatDateBR, getCurrentMonthRange, isoDate } from "@/lib/date-range";
import { buildMetricSeries } from "@/lib/build-metric-series";
import { formatNumber } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { MetricChart } from "@/components/charts/metric-chart";
import { ResultType } from "@/generated/prisma/client";

export default async function LeadsPage({
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
      leads: true,
      purchases: true,
      campaign: { select: { resultType: true } },
    },
  });

  const leadsByDate = new Map<string, number>();
  const purchasesByDate = new Map<string, number>();

  for (const m of metrics) {
    const key = isoDate(m.date);
    if (m.campaign.resultType === ResultType.LEADS) {
      leadsByDate.set(key, (leadsByDate.get(key) ?? 0) + m.leads);
    } else {
      purchasesByDate.set(key, (purchasesByDate.get(key) ?? 0) + m.purchases);
    }
  }

  const seriesArgs = { from, periodEnd: daysInMonth, today: to, daysRemaining };
  const leadsSeries = buildMetricSeries({ ...seriesArgs, valueByDate: leadsByDate });
  const purchasesSeries = buildMetricSeries({ ...seriesArgs, valueByDate: purchasesByDate });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Leads no mês" value={formatNumber(Math.round(leadsSeries.realized))} />
          <StatTile
            label="Ritmo diário (7 dias)"
            value={formatNumber(Math.round(leadsSeries.dailyPace))}
          />
          <StatTile
            label="Projeção de leads"
            value={formatNumber(Math.round(leadsSeries.projected))}
            hint={`Até ${formatDateBR(daysInMonth)}`}
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Leads por dia — campanhas com objetivo de geração de leads
          </h2>
          <MetricChart data={leadsSeries.data} seriesName="Leads" color="var(--color-chart-3)" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Compras no mês"
            value={formatNumber(Math.round(purchasesSeries.realized))}
          />
          <StatTile
            label="Ritmo diário (7 dias)"
            value={formatNumber(Math.round(purchasesSeries.dailyPace))}
          />
          <StatTile
            label="Projeção de compras"
            value={formatNumber(Math.round(purchasesSeries.projected))}
            hint={`Até ${formatDateBR(daysInMonth)}`}
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Compras por dia — campanhas com objetivo de conversão/venda
          </h2>
          <MetricChart data={purchasesSeries.data} seriesName="Compras" color="var(--color-chart-1)" />
        </div>
      </section>
    </div>
  );
}
