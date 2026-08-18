import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { formatDateBR, getAnalysisRange, isoDate, parsePeriod, PERIOD_OPTIONS } from "@/lib/date-range";
import { buildMetricSeries } from "@/lib/build-metric-series";
import { isOrganicCampaign } from "@/lib/organic";
import { formatCurrencyBRL, formatNumber, formatRoas } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { MetricChart } from "@/components/charts/metric-chart";
import { UrlSelect } from "@/components/dashboard/url-select";
import { ResultType } from "@/generated/prisma/client";

type Section = "organico" | "leads" | "compras";

export default async function ResultadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { clientSlug } = await params;
  const { period: periodParam } = await searchParams;
  const { client } = await requireClientAccess(clientSlug);

  const period = parsePeriod(periodParam);
  const { from, to, periodEnd, daysRemaining } = getAnalysisRange(period);

  const campaigns = await prisma.campaign.findMany({
    where: { clientId: client.id },
    select: { id: true, name: true, resultType: true },
  });

  const sectionByCampaignId = new Map<string, Section>();
  for (const c of campaigns) {
    if (isOrganicCampaign(c.name)) {
      sectionByCampaignId.set(c.id, "organico");
    } else {
      sectionByCampaignId.set(c.id, c.resultType === ResultType.LEADS ? "leads" : "compras");
    }
  }

  const metrics = await prisma.campaignDailyMetric.findMany({
    where: {
      campaign: { clientId: client.id },
      date: { gte: from, lte: to },
    },
    select: { date: true, spend: true, clicks: true, leads: true, purchases: true, revenue: true, campaignId: true },
  });

  const spendByDate: Record<Section, Map<string, number>> = {
    organico: new Map(),
    leads: new Map(),
    compras: new Map(),
  };
  const resultByDate: Record<Section, Map<string, number>> = {
    organico: new Map(),
    leads: new Map(),
    compras: new Map(),
  };
  const revenueByDate = new Map<string, number>();

  for (const m of metrics) {
    const section = sectionByCampaignId.get(m.campaignId);
    if (!section) continue;
    const key = isoDate(m.date);
    const spend = Number(m.spend);

    spendByDate[section].set(key, (spendByDate[section].get(key) ?? 0) + spend);

    const resultValue =
      section === "organico" ? m.clicks : section === "leads" ? m.leads : m.purchases;
    resultByDate[section].set(key, (resultByDate[section].get(key) ?? 0) + resultValue);

    if (section === "compras") {
      revenueByDate.set(key, (revenueByDate.get(key) ?? 0) + Number(m.revenue));
    }
  }

  const seriesArgs = { from, periodEnd, today: to, daysRemaining };
  const projectionHint =
    period === "month" ? `Até ${formatDateBR(periodEnd)}` : "Período já encerrado";

  const organicoSpend = buildMetricSeries({ ...seriesArgs, valueByDate: spendByDate.organico });
  const organicoResult = buildMetricSeries({ ...seriesArgs, valueByDate: resultByDate.organico });

  const leadsSpend = buildMetricSeries({ ...seriesArgs, valueByDate: spendByDate.leads });
  const leadsResult = buildMetricSeries({ ...seriesArgs, valueByDate: resultByDate.leads });

  const comprasSpend = buildMetricSeries({ ...seriesArgs, valueByDate: spendByDate.compras });
  const comprasResult = buildMetricSeries({ ...seriesArgs, valueByDate: resultByDate.compras });
  const comprasRevenue = buildMetricSeries({ ...seriesArgs, valueByDate: revenueByDate });

  const comprasRoasRealized = comprasSpend.realized > 0 ? comprasRevenue.realized / comprasSpend.realized : 0;
  const comprasRoasProjected = comprasSpend.projected > 0 ? comprasRevenue.projected / comprasSpend.projected : 0;

  return (
    <div className="flex flex-col gap-10">
      <UrlSelect paramName="period" value={period} options={PERIOD_OPTIONS} className="w-full sm:w-56" />

      {/* Orgânico */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg font-bold">Orgânico</h2>
          <p className="text-xs text-muted-foreground">
            Campanhas [Traf] [Audiência]. Resultado = cliques no link — o Meta não
            expõe &quot;visitas ao perfil&quot; nos dados dessa campanha (é uma métrica do
            Instagram, exige a permissão instagram_manage_insights no token).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="Investimento total" value={formatCurrencyBRL(organicoSpend.realized)} />
          <StatTile label="Ritmo diário" value={formatCurrencyBRL(organicoSpend.dailyPace)} hint="Investimento/dia" />
          <StatTile
            label="Projeção de investimento"
            value={formatCurrencyBRL(organicoSpend.projected)}
            hint={projectionHint}
            highlight
          />
          <StatTile label="Resultados no período" value={formatNumber(organicoResult.realized)} hint="Cliques no link" />
          <StatTile
            label="Projeção de resultados"
            value={formatNumber(Math.round(organicoResult.projected))}
            hint={projectionHint}
            highlight
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <MetricChart data={organicoResult.data} seriesName="Cliques" color="var(--color-chart-4)" />
        </div>
      </section>

      {/* Leads */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold">Leads</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatTile label="Investimento total" value={formatCurrencyBRL(leadsSpend.realized)} />
          <StatTile label="Ritmo diário" value={formatCurrencyBRL(leadsSpend.dailyPace)} hint="Investimento/dia" />
          <StatTile
            label="Projeção de investimento"
            value={formatCurrencyBRL(leadsSpend.projected)}
            hint={projectionHint}
            highlight
          />
          <StatTile label="Resultados no período" value={formatNumber(leadsResult.realized)} hint="Leads" />
          <StatTile
            label="Projeção de resultados"
            value={formatNumber(Math.round(leadsResult.projected))}
            hint={projectionHint}
            highlight
          />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <MetricChart data={leadsResult.data} seriesName="Leads" color="var(--color-chart-3)" />
        </div>
      </section>

      {/* Compras */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold">Compras</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Investimento total" value={formatCurrencyBRL(comprasSpend.realized)} />
          <StatTile label="Ritmo diário" value={formatCurrencyBRL(comprasSpend.dailyPace)} hint="Investimento/dia" />
          <StatTile
            label="Projeção de investimento"
            value={formatCurrencyBRL(comprasSpend.projected)}
            hint={projectionHint}
            highlight
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile label="Compras no período" value={formatNumber(comprasResult.realized)} />
          <StatTile label="Vendas no período" value={formatCurrencyBRL(comprasRevenue.realized)} />
          <StatTile label="ROAS no período" value={formatRoas(comprasRoasRealized)} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatTile
            label="Projeção de compras"
            value={formatNumber(Math.round(comprasResult.projected))}
            hint={projectionHint}
            highlight
          />
          <StatTile
            label="Projeção de vendas"
            value={formatCurrencyBRL(comprasRevenue.projected)}
            hint={projectionHint}
            highlight
          />
          <StatTile label="ROAS projetado" value={formatRoas(comprasRoasProjected)} highlight />
        </div>
        <div className="rounded-xl border bg-card p-4">
          <MetricChart data={comprasResult.data} seriesName="Compras" color="var(--color-chart-1)" />
        </div>
      </section>
    </div>
  );
}
