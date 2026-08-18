import { eachDayUTC, formatDateBR, isoDate } from "@/lib/date-range";
import { projectPace } from "@/lib/projections";
import type { MetricPoint } from "@/components/charts/metric-chart";

// Builds a daily chart series (realized + "ritmo 7d" projection) spanning
// the full month, given a lookup of realized value per ISO date. Shared by
// the leads and purchases sections of the Leads/Compras dashboard.
export function buildMetricSeries(params: {
  from: Date;
  monthEnd: Date;
  today: Date;
  daysRemaining: number;
  valueByDate: Map<string, number>;
}): { data: MetricPoint[]; realized: number; dailyPace: number; projected: number } {
  const { from, monthEnd, today, daysRemaining, valueByDate } = params;
  const monthDays = eachDayUTC(from, monthEnd);
  const todayKey = isoDate(today);

  const realizedSeries: number[] = [];
  for (const d of monthDays) {
    const key = isoDate(d);
    if (key > todayKey) break;
    realizedSeries.push(valueByDate.get(key) ?? 0);
  }
  const { realized, projected, dailyPace } = projectPace(realizedSeries, daysRemaining);

  const data: MetricPoint[] = monthDays.map((d) => {
    const key = isoDate(d);
    const isFuture = key > todayKey;
    const value = valueByDate.get(key) ?? 0;

    let projecao: number | null = null;
    if (key === todayKey) {
      projecao = value;
    } else if (isFuture) {
      projecao = dailyPace;
    }

    return {
      date: key,
      label: formatDateBR(d),
      value: isFuture ? 0 : value,
      projecao,
    };
  });

  return { data, realized, dailyPace, projected };
}
