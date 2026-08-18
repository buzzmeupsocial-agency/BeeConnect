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

export default async function InvestmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { clientSlug } = await params;
  const { campaign: campaignParam } = await searchParams;
  const { client } = await requireClientAccess(clientSlug);
  const { from, to, daysInMonth, daysRemaining } = getCurrentMonthRange();

  const campaigns = await getActiveCampaignsInPeriod(client.id, from, to);
  const selectedCampaignId =
    campaignParam && campaigns.some((c) => c.id === campaignParam) ? campaignParam : "all";
  const campaignOptions = [
    { value: "all", label: "Todas as campanhas" },
    ...campaigns.map((c) => ({ value: c.id, label: c.name })),
  ];

  const metrics = await prisma.campaignDailyMetric.findMany({
    where: {
      campaign: {
        clientId: client.id,
        ...(selectedCampaignId !== "all" ? { id: selectedCampaignId } : {}),
      },
      date: { gte: from, lte: to },
    },
    select: {
      date: true,
      spend: true,
      campaign: { select: { platform: true } },
    },
  });

  const metaByDate = new Map<string, number>();
  const googleByDate = new Map<string, number>();
  for (const m of metrics) {
    const key = isoDate(m.date);
    const spend = Number(m.spend);
    const bucket = m.campaign.platform === Platform.META ? metaByDate : googleByDate;
    bucket.set(key, (bucket.get(key) ?? 0) + spend);
  }

  const seriesArgs = { from, periodEnd: daysInMonth, today: to, daysRemaining };
  const metaSeries = buildMetricSeries({ ...seriesArgs, valueByDate: metaByDate });
  const googleSeries = buildMetricSeries({ ...seriesArgs, valueByDate: googleByDate });

  const realized = metaSeries.realized + googleSeries.realized;
  const dailyPace = metaSeries.dailyPace + googleSeries.dailyPace;
  const projected = metaSeries.projected + googleSeries.projected;

  const channels = [
    { name: "Meta Ads", series: metaSeries, color: "var(--color-chart-1)" },
    { name: "Google Ads", series: googleSeries, color: "var(--color-chart-2)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <UrlSelect
        paramName="campaign"
        value={selectedCampaignId}
        options={campaignOptions}
        className="w-full sm:w-72"
      />

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
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">{c.name}</h2>
            <p className="text-xs text-muted-foreground">
              Realizado: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.realized)}</span>
              {" · "}Ritmo: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.dailyPace)}</span>/dia
              {" · "}Projeção: <span className="font-medium text-foreground">{formatCurrencyBRL(c.series.projected)}</span>
            </p>
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
