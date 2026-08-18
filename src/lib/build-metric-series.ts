import { eachDayUTC, formatDateBR, isoDate } from "@/lib/date-range";
import { projectPace } from "@/lib/projections";
import type { MetricPoint } from "@/components/charts/metric-chart";

// Builds a daily chart series spanning the full period with 3 layers:
// - daily: solid bars, gasto/resultado do dia (só dias já realizados)
// - cumulative: linha contínua com o acumulado real até hoje
// - cumulativeProjected: linha pontilhada, começando exatamente onde o
//   acumulado real parou e crescendo pelo ritmo médio do período até o
//   total projetado no fim do período.
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

  let runningTotal = 0;
  let daysPastToday = 0;

  const data: MetricPoint[] = days.map((d) => {
    const key = isoDate(d);
    const isFuture = key > todayKey;

    if (!isFuture) {
      runningTotal += valueByDate.get(key) ?? 0;
    }

    let cumulativeProjected: number | null = null;
    if (key === todayKey) {
      // Bridge point so the dashed line starts exactly where the solid line ends.
      cumulativeProjected = runningTotal;
    } else if (isFuture) {
      daysPastToday += 1;
      cumulativeProjected = runningTotal + dailyPace * daysPastToday;
    }

    return {
      date: key,
      label: formatDateBR(d),
      daily: isFuture ? 0 : (valueByDate.get(key) ?? 0),
      cumulative: isFuture ? null : runningTotal,
      cumulativeProjected,
    };
  });

  return { data, realized, dailyPace, projected };
}
