import { eachDayUTC, formatDateBR, isoDate } from "@/lib/date-range";
import { projectPace } from "@/lib/projections";
import type { MetricPoint } from "@/components/charts/metric-chart";

// Builds a daily chart series spanning the full period: solid bars for days
// up to today (realizado), dashed/hollow bars for the remaining days
// (projetado — ritmo dos últimos 7 dias, repetido por dia). Together the two
// halves cover the whole period, so the bar sequence reads as one continuous
// trajectory ending at the projected period total.
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
    return {
      date: key,
      label: formatDateBR(d),
      value: isFuture ? dailyPace : (valueByDate.get(key) ?? 0),
      isProjected: isFuture,
    };
  });

  return { data, realized, dailyPace, projected };
}
