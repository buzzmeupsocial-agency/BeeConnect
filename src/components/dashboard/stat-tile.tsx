import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  highlight = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  // Laranja reservado para ação/destaque (buzzconnect/readme.md) — usar só
  // no número que representa a meta/projeção, não em todo KPI.
  highlight?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            highlight && "text-primary",
          )}
        >
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
