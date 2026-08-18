"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL, formatNumber } from "@/lib/format";

export type MetricPoint = {
  date: string;
  label: string;
  daily: number;
  cumulative: number | null;
  cumulativeProjected: number | null;
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
  const entries = payload.filter((p) => p.value != null);
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

// Recharts' built-in <Legend> renders every series with the same small-dot
// icon, so a solid line and a dashed line look identical — a custom legend
// lets each swatch actually match its mark (filled square / solid line /
// dashed line).
function ChartLegend({ seriesName, color }: { seriesName: string; color: string }) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: color, opacity: 0.35 }} />
        {seriesName} (dia)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-4 border-t-2" style={{ borderColor: color }} />
        Acumulado
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-0 w-4 border-t-2 border-dashed"
          style={{ borderColor: color }}
        />
        Projeção acumulada
      </span>
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
    <div>
      <ChartLegend seriesName={seriesName} color={color} />
      <ResponsiveContainer width="100%" height={290}>
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
            yAxisId="daily"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            tickFormatter={valueFormatter}
            width={56}
            label={{
              value: `${seriesName} (dia)`,
              angle: -90,
              position: "insideLeft",
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="acumulado"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            tickFormatter={valueFormatter}
            width={64}
            label={{
              value: "Acumulado",
              angle: 90,
              position: "insideRight",
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
            }}
          />
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Bar
            yAxisId="daily"
            dataKey="daily"
            name={`${seriesName} (dia)`}
            fill={color}
            fillOpacity={0.35}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Line
            yAxisId="acumulado"
            dataKey="cumulative"
            name="Acumulado"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="acumulado"
            dataKey="cumulativeProjected"
            name="Projeção acumulada"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
