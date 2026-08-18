import { eachDayUTC, formatDateBR, isoDate } from "@/lib/date-range";
import { projectPace } from "@/lib/projections";
import type { MetricPoint } from "@/components/charts/metric-chart";

// Builds a daily chart series spanning the full period: solid bars for days
// up to today (realizado), a dashed line for the projection (ritmo médio do
// período, repetido por dia) picking up exactly where the bars end and
// running through the rest of the period.
export function buildMetricSeries(params: {
  from: Date;
  periodEnd: Date;
  today: Date;
  daysRemaining: number;
  valueByDate: Map<string, number>;
}): { data: MetricPoint[]; realized: number; dailyPace: number; projected: number } {
  const { from, periodEnd, today, daysRemaining, valueByDate } = params;
  const days = eachDayUTC(from, periodEnd);
  const todayKey = isoDate(today);

  const realizedSeries: number[] = [];
  for (const d of days) {
    const key = isoDate(d);
    if (key > todayKey) break;
    realizedSeries.push(valueByDate.get(key) ?? 0);
  }
  const { realized, projected, dailyPace } = projectPace(realizedSeries, daysRemaining);

  const data: MetricPoint[] = days.map((d) => {
    const key = isoDate(d);
    const isFuture = key > todayKey;
    const value = valueByDate.get(key) ?? 0;

    let projetado: number | null = null;
    if (key === todayKey) {
      // Bridge point so the dashed line starts exactly where the bars end.
      projetado = value;
    } else if (isFuture) {
      projetado = dailyPace;
    }

    return {
      date: key,
      label: formatDateBR(d),
      realizado: isFuture ? 0 : value,
      projetado,
    };
  });

  return { data, realized, dailyPace, projected };
}
