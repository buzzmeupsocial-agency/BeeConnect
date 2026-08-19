import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { formatDateBR, getAnalysisRange, isoDate, parsePeriod, PERIOD_OPTIONS } from "@/lib/date-range";
import { buildMetricSeries } from "@/lib/build-metric-series";
import { isOrganicCampaign } from "@/lib/organic";
import { formatCurrencyBRL, formatNumber, formatRoas } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { MetricChart } from "@/components/charts/metric-chart";
import { UrlSelect } from "@/components/dashboard/url-select";
import { Badge } from "@/components/ui/badge";
import { Platform, ResultType } from "@/generated/prisma/client";

const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas as plataformas" },
  { value: "META", label: "Meta Ads" },
  { value: "GOOGLE", label: "Google Ads" },
];

type Kind = "organico" | "leads" | "compras";

export default async function CampanhasPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ period?: string; platform?: string }>;
}) {
  const { clientSlug } = await params;
  const sp = await searchParams;
  const { client } = await requireClientAccess(clientSlug);

  const period = parsePeriod(sp.period);
  const platform = sp.platform === "META" || sp.platform === "GOOGLE" ? sp.platform : "all";
  const { from, to, periodEnd, daysRemaining } = getAnalysisRange(period);

  const campaigns = await prisma.campaign.findMany({
    where: {
      clientId: client.id,
      ...(platform === "all" ? {} : { platform: platform as Platform }),
      metrics: {
        some: {
          date: { gte: from, lte: to },
          OR: [{ spend: { gt: 0 } }, { leads: { gt: 0 } }, { purchases: { gt: 0 } }],
        },
      },
    },
    select: { id: true, name: true, platform: true, resultType: true },
  });

  const kindByCampaignId = new Map<string, Kind>();
  for (const c of campaigns) {
    if (isOrganicCampaign(c.name)) {
      kindByCampaignId.set(c.id, "organico");
    } else {
      kindByCampaignId.set(c.id, c.resultType === ResultType.LEADS ? "leads" : "compras");
    }
  }

  const metrics = await prisma.campaignDailyMetric.findMany({
    where: {
      campaignId: { in: campaigns.map((c) => c.id) },
      date: { gte: from, lte: to },
    },
    select: { campaignId: true, date: true, spend: true, clicks: true, leads: true, purchases: true, revenue: true },
  });

  const spendByCampaign = new Map<string, Map<string, number>>();
  const resultByCampaign = new Map<string, Map<string, number>>();
  const revenueByCampaign = new Map<string, Map<string, number>>();

  for (const c of campaigns) {
    spendByCampaign.set(c.id, new Map());
    resultByCampaign.set(c.id, new Map());
    revenueByCampaign.set(c.id, new Map());
  }

  for (const m of metrics) {
    const kind = kindByCampaignId.get(m.campaignId);
    if (!kind) continue;
    const key = isoDate(m.date);
    const spendMap = spendByCampaign.get(m.campaignId)!;
    const resultMap = resultByCampaign.get(m.campaignId)!;

    spendMap.set(key, (spendMap.get(key) ?? 0) + Number(m.spend));

    const resultValue = kind === "organico" ? m.clicks : kind === "leads" ? m.leads : m.purchases;
    resultMap.set(key, (resultMap.get(key) ?? 0) + resultValue);

    if (kind === "compras") {
      const revenueMap = revenueByCampaign.get(m.campaignId)!;
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(m.revenue));
    }
  }

  const seriesArgs = { from, periodEnd, today: to, daysRemaining };
  const projectionHint = period === "month" ? `Até ${formatDateBR(periodEnd)}` : "Período já encerrado";

  const KIND_META: Record<Kind, { label: string; resultLabel: string; chartLabel: string; color: string }> = {
    organico: { label: "Orgânico", resultLabel: "Cliques no link", chartLabel: "Cliques", color: "var(--color-chart-4)" },
    leads: { label: "Leads", resultLabel: "Leads", chartLabel: "Leads", color: "var(--color-chart-3)" },
    compras: { label: "Compras", resultLabel: "Compras", chartLabel: "Compras", color: "var(--color-chart-1)" },
  };

  const sections = campaigns
    .map((c) => {
      const kind = kindByCampaignId.get(c.id)!;
      const spend = buildMetricSeries({ ...seriesArgs, valueByDate: spendByCampaign.get(c.id)! });
      const result = buildMetricSeries({ ...seriesArgs, valueByDate: resultByCampaign.get(c.id)! });
      const revenue =
        kind === "compras" ? buildMetricSeries({ ...seriesArgs, valueByDate: revenueByCampaign.get(c.id)! }) : null;
      const roasRealized = revenue && spend.realized > 0 ? revenue.realized / spend.realized : 0;
      const roasProjected = revenue && spend.projected > 0 ? revenue.projected / spend.projected : 0;

      return { campaign: c, kind, spend, result, revenue, roasRealized, roasProjected };
    })
    .sort((a, b) => b.spend.realized - a.spend.realized);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-3">
        <UrlSelect paramName="period" value={period} options={PERIOD_OPTIONS} className="w-full sm:w-56" />
        <UrlSelect paramName="platform" value={platform} options={PLATFORM_OPTIONS} className="w-full sm:w-56" />
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma campanha ativa no período selecionado.</p>
      )}

      {sections.map(({ campaign, kind, spend, result, revenue, roasRealized, roasProjected }) => {
        const meta = KIND_META[kind];
        return (
          <section key={campaign.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold">{campaign.name}</h2>
              <Badge variant="secondary">{campaign.platform === Platform.META ? "Meta" : "Google"}</Badge>
              <Badge variant="outline">{meta.label}</Badge>
            </div>

            {kind !== "compras" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <StatTile label="Investimento total" value={formatCurrencyBRL(spend.realized)} />
                <StatTile label="Ritmo diário" value={formatCurrencyBRL(spend.dailyPace)} hint="Investimento/dia" />
                <StatTile
                  label="Projeção de investimento"
                  value={formatCurrencyBRL(spend.projected)}
                  hint={projectionHint}
                  highlight
                />
                <StatTile label="Resultados no período" value={formatNumber(result.realized)} hint={meta.resultLabel} />
                <StatTile
                  label="Projeção de resultados"
                  value={formatNumber(Math.round(result.projected))}
                  hint={projectionHint}
                  highlight
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <StatTile label="Investimento total" value={formatCurrencyBRL(spend.realized)} />
                  <StatTile label="Ritmo diário" value={formatCurrencyBRL(spend.dailyPace)} hint="Investimento/dia" />
                  <StatTile
                    label="Projeção de investimento"
                    value={formatCurrencyBRL(spend.projected)}
                    hint={projectionHint}
                    highlight
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <StatTile label="Compras no período" value={formatNumber(result.realized)} />
                  <StatTile label="Vendas no período" value={formatCurrencyBRL(revenue!.realized)} />
                  <StatTile label="ROAS no período" value={formatRoas(roasRealized)} />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <StatTile
                    label="Projeção de compras"
                    value={formatNumber(Math.round(result.projected))}
                    hint={projectionHint}
                    highlight
                  />
                  <StatTile
                    label="Projeção de vendas"
                    value={formatCurrencyBRL(revenue!.projected)}
                    hint={projectionHint}
                    highlight
                  />
                  <StatTile label="ROAS projetado" value={formatRoas(roasProjected)} highlight />
                </div>
              </>
            )}

            <div className="rounded-xl border bg-card p-4">
              <MetricChart data={result.data} seriesName={meta.chartLabel} color={meta.color} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
