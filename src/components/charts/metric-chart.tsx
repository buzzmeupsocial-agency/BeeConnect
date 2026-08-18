"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyBRL, formatNumber } from "@/lib/format";

export type MetricPoint = {
  date: string;
  label: string;
  realizado: number;
  projetado: number | null;
};

// A function prop can't cross the server/client boundary, so callers pass a
// value type instead and the chart (a Client Component) picks the formatter.
export type ValueType = "number" | "currency";

function formatterFor(valueType: ValueType) {
  return valueType === "currency" ? formatCurrencyBRL : formatNumber;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter((p) => p.value > 0);
  if (!entries.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {entries.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {valueFormatter(p.value)}
        </p>
      ))}
    </div>
  );
}

export function MetricChart({
  data,
  seriesName,
  color,
  valueType = "number",
}: {
  data: MetricPoint[];
  seriesName: string;
  color: string;
  valueType?: ValueType;
}) {
  const valueFormatter = formatterFor(valueType);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          tickFormatter={valueFormatter}
          width={56}
        />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="realizado" name={seriesName} fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Line
          dataKey="projetado"
          name="Projeção"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
