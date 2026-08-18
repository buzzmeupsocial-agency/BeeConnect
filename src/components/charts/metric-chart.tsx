"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrencyBRL, formatNumber } from "@/lib/format";

export type MetricPoint = {
  date: string;
  label: string;
  value: number;
  isProjected: boolean;
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
  seriesName,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { payload: MetricPoint }[];
  label?: string;
  seriesName: string;
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      <p>
        {point.isProjected ? "Projeção" : seriesName}: {valueFormatter(point.value)}
      </p>
    </div>
  );
}

function ChartLegend({ seriesName, color }: { seriesName: string; color: string }) {
  return (
    <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2.5 rounded-sm" style={{ background: color }} />
        {seriesName}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block size-2.5 rounded-sm"
          style={{ background: "transparent", border: `1.5px dashed ${color}` }}
        />
        Projeção
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
      <ResponsiveContainer width="100%" height={260}>
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
          <Tooltip
            content={<ChartTooltip seriesName={seriesName} valueFormatter={valueFormatter} />}
            cursor={{ fill: "var(--color-muted)" }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {data.map((d) => (
              <Cell
                key={d.date}
                fill={d.isProjected ? "transparent" : color}
                stroke={color}
                strokeWidth={d.isProjected ? 1.5 : 0}
                strokeDasharray={d.isProjected ? "3 3" : undefined}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
