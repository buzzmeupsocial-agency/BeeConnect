import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { formatDateBR, getCurrentMonthRange, isoDate } from "@/lib/date-range";
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
  daysInMonth: Date;
  daysRemaining: number;
  selectedCampaignId: string;
}) {
  const { clientId, platform, from, to, daysInMonth, daysRemaining, selectedCampaignId } = params;

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
    periodEnd: daysInMonth,
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
  searchParams: Promise<{ campaignMeta?: string; campaignGoogle?: string }>;
}) {
  const { clientSlug } = await params;
  const { campaignMeta, campaignGoogle } = await searchParams;
  const { client } = await requireClientAccess(clientSlug);
  const { from, to, daysInMonth, daysRemaining } = getCurrentMonthRange();

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
      daysInMonth,
      daysRemaining,
      selectedCampaignId: selectedMetaId,
    }),
    loadChannel({
      clientId: client.id,
      platform: Platform.GOOGLE,
      from,
      to,
      daysInMonth,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Investido no mês"
          value={formatCurrencyBRL(realized)}
          hint={`Meta + Google, até ${formatDateBR(to)}`}
        />
        <StatTile
          label="Ritmo diário (média do período)"
          value={formatCurrencyBRL(dailyPace)}
          hint="Montante realizado ÷ dias decorridos"
        />
        <StatTile
          label="Projeção para o mês"
          value={formatCurrencyBRL(projected)}
          hint={`${daysRemaining} dia(s) restante(s) no ritmo atual`}
        />
      </div>

      {channels.map((c) => (
        <div key={c.name} className="rounded-xl border bg-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">{c.name}</h2>
              <p className="text-xs text-muted-foreground">
                Realizado: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.realized)}</span>
                {" · "}Ritmo: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.dailyPace)}</span>/dia
                {" · "}Projeção: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.projected)}</span>
              </p>
            </div>
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
          <MetricChart
            data={c.series.data}
            seriesName={c.name}
            color={c.color}
            valueType="currency"
          />
        </div>
      ))}
    </div>
  );
}
