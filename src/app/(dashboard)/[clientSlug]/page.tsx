import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { formatDateBR, getAnalysisRange, isoDate, parsePeriod, PERIOD_OPTIONS } from "@/lib/date-range";
import { buildMetricSeries } from "@/lib/build-metric-series";
import { getActiveCampaignsInPeriod } from "@/lib/queries";
import { formatCurrencyBRL } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { MetricChart } from "@/components/charts/metric-chart";
import { UrlSelect } from "@/components/dashboard/url-select";
import { Platform } from "@/generated/prisma/client";

async function loadChannel(params: {
  clientId: string;
  platform: Platform;
  from: Date;
  to: Date;
  periodEnd: Date;
  daysRemaining: number;
  selectedCampaignId: string;
}) {
  const { clientId, platform, from, to, periodEnd, daysRemaining, selectedCampaignId } = params;

  const metrics = await prisma.campaignDailyMetric.findMany({
    where: {
      campaign: {
        clientId,
        platform,
        ...(selectedCampaignId !== "all" ? { id: selectedCampaignId } : {}),
      },
      date: { gte: from, lte: to },
    },
    select: { date: true, spend: true },
  });

  const byDate = new Map<string, number>();
  for (const m of metrics) {
    const key = isoDate(m.date);
    byDate.set(key, (byDate.get(key) ?? 0) + Number(m.spend));
  }

  return buildMetricSeries({
    from,
    periodEnd,
    today: to,
    daysRemaining,
    valueByDate: byDate,
  });
}

export default async function InvestmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ period?: string; campaignMeta?: string; campaignGoogle?: string }>;
}) {
  const { clientSlug } = await params;
  const { period: periodParam, campaignMeta, campaignGoogle } = await searchParams;
  const { client } = await requireClientAccess(clientSlug);

  const period = parsePeriod(periodParam);
  const { from, to, periodEnd, daysRemaining } = getAnalysisRange(period);
  const projectionHint = period === "month" ? `${daysRemaining} dia(s) restante(s) no ritmo atual` : "Período já encerrado";

  const [metaCampaigns, googleCampaigns] = await Promise.all([
    getActiveCampaignsInPeriod(client.id, from, to, Platform.META),
    getActiveCampaignsInPeriod(client.id, from, to, Platform.GOOGLE),
  ]);

  const selectedMetaId =
    campaignMeta && metaCampaigns.some((c) => c.id === campaignMeta) ? campaignMeta : "all";
  const selectedGoogleId =
    campaignGoogle && googleCampaigns.some((c) => c.id === campaignGoogle) ? campaignGoogle : "all";

  const [metaSeries, googleSeries] = await Promise.all([
    loadChannel({
      clientId: client.id,
      platform: Platform.META,
      from,
      to,
      periodEnd,
      daysRemaining,
      selectedCampaignId: selectedMetaId,
    }),
    loadChannel({
      clientId: client.id,
      platform: Platform.GOOGLE,
      from,
      to,
      periodEnd,
      daysRemaining,
      selectedCampaignId: selectedGoogleId,
    }),
  ]);

  const realized = metaSeries.realized + googleSeries.realized;
  const dailyPace = metaSeries.dailyPace + googleSeries.dailyPace;
  const projected = metaSeries.projected + googleSeries.projected;

  const channels = [
    {
      name: "Meta Ads",
      series: metaSeries,
      color: "var(--color-chart-1)",
      paramName: "campaignMeta",
      selectedId: selectedMetaId,
      campaigns: metaCampaigns,
    },
    {
      name: "Google Ads",
      series: googleSeries,
      color: "var(--color-chart-2)",
      paramName: "campaignGoogle",
      selectedId: selectedGoogleId,
      campaigns: googleCampaigns,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <UrlSelect paramName="period" value={period} options={PERIOD_OPTIONS} className="w-full sm:w-56" />

      <h2 className="font-display text-lg font-bold">Geral (Meta + Google)</h2>
      <div className="-mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Investido no período"
          value={formatCurrencyBRL(realized)}
          hint={`Meta + Google, até ${formatDateBR(to)}`}
        />
        <StatTile
          label="Ritmo diário (média do período)"
          value={formatCurrencyBRL(dailyPace)}
          hint="Montante realizado ÷ dias decorridos"
        />
        <StatTile
          label="Projeção do período"
          value={formatCurrencyBRL(projected)}
          hint={projectionHint}
          highlight
        />
      </div>

      {channels.map((c) => (
        <div key={c.name} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">{c.name}</h2>
            <UrlSelect
              paramName={c.paramName}
              value={c.selectedId}
              options={[
                { value: "all", label: "Todas as campanhas" },
                ...c.campaigns.map((camp) => ({ value: camp.id, label: camp.name })),
              ]}
              className="w-full sm:w-64"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              label="Investido no período"
              value={formatCurrencyBRL(c.series.realized)}
              hint={`Até ${formatDateBR(to)}`}
            />
            <StatTile
              label="Ritmo diário (média do período)"
              value={formatCurrencyBRL(c.series.dailyPace)}
              hint="Montante realizado ÷ dias decorridos"
            />
            <StatTile
              label="Projeção do período"
              value={formatCurrencyBRL(c.series.projected)}
              hint={projectionHint}
              highlight
            />
          </div>

          <div className="rounded-xl border bg-card p-4">
            <MetricChart
              data={c.series.data}
              seriesName={c.name}
              color={c.color}
              valueType="currency"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
