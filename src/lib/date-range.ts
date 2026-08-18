export type PeriodKey = "7d" | "14d" | "30d" | "month";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Mês atual" },
];

function utcDay(d: Date) {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

export function parsePeriod(value: string | undefined): PeriodKey {
  if (value === "7d" || value === "14d" || value === "30d" || value === "month") {
    return value;
  }
  return "30d";
}

// Range for ranking/analysis screens (Campanhas, Criativos) — always
// finished ranges, no projection involved.
export function getPeriodRange(period: PeriodKey): { from: Date; to: Date } {
  const to = utcDay(new Date());
  if (period === "month") {
    const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
    return { from, to };
  }
  const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from, to };
}

// Range for the current month to date, used by the Investimento and
// Leads/Compras dashboards (they always project to end of this month).
export function getCurrentMonthRange(): {
  from: Date;
  to: Date;
  daysElapsed: number;
  daysInMonth: Date; // last day of month, for display
  daysRemaining: number;
} {
  const today = utcDay(new Date());
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const lastDay = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  );
  const daysElapsed =
    Math.floor((today.getTime() - from.getTime()) / 86_400_000) + 1;
  const totalDaysInMonth =
    Math.floor((lastDay.getTime() - from.getTime()) / 86_400_000) + 1;
  return {
    from,
    to: today,
    daysElapsed,
    daysInMonth: lastDay,
    daysRemaining: totalDaysInMonth - daysElapsed,
  };
}

// Unified range for screens with projection (Investimento, Resultados):
// "month" keeps the usual to-date-vs-rest-of-month split; the fixed trailing
// windows (7d/14d/30d) are already fully elapsed, so daysRemaining is 0 and
// the projection tiles/lines naturally collapse to "= realizado".
export function getAnalysisRange(period: PeriodKey): {
  from: Date;
  to: Date;
  periodEnd: Date;
  daysRemaining: number;
} {
  if (period === "month") {
    const { from, to, daysInMonth, daysRemaining } = getCurrentMonthRange();
    return { from, to, periodEnd: daysInMonth, daysRemaining };
  }
  const { from, to } = getPeriodRange(period);
  return { from, to, periodEnd: to, daysRemaining: 0 };
}

export function formatDateBR(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function eachDayUTC(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = utcDay(from);
  const end = utcDay(to);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}
