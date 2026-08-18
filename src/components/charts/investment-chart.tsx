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
import { formatCurrencyBRL } from "@/lib/format";

export type InvestmentPoint = {
  date: string;
  label: string;
  meta: number;
  google: number;
  projecao: number | null;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrencyBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export function InvestmentChart({ data }: { data: InvestmentPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
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
          tickFormatter={(v) => formatCurrencyBRL(v)}
          width={72}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="meta"
          name="Meta Ads"
          stackId="spend"
          fill="var(--color-chart-1)"
          radius={[0, 0, 0, 0]}
          maxBarSize={28}
        />
        <Bar
          dataKey="google"
          name="Google Ads"
          stackId="spend"
          fill="var(--color-chart-2)"
          radius={[3, 3, 0, 0]}
          maxBarSize={28}
        />
        <Line
          dataKey="projecao"
          name="Projeção (ritmo 7d)"
          stroke="var(--color-muted-foreground)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
