import { ImageOff } from "lucide-react";
import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { getPeriodRange, parsePeriod, PERIOD_OPTIONS } from "@/lib/date-range";
import { formatCurrencyBRL, formatNumber, formatRoas } from "@/lib/format";
import { UrlSelect } from "@/components/dashboard/url-select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SORT_OPTIONS = [
  { value: "purchases", label: "Mais compras" },
  { value: "roas", label: "Melhor ROAS" },
  { value: "spend", label: "Maior investimento" },
];

type SortField = "purchases" | "roas" | "spend";

export default async function CriativosPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{ period?: string; sort?: string }>;
}) {
  const { clientSlug } = await params;
  const sp = await searchParams;
  const { client } = await requireClientAccess(clientSlug);

  const period = parsePeriod(sp.period);
  const sort: SortField =
    sp.sort === "roas" || sp.sort === "spend" ? sp.sort : "purchases";
  const { from, to } = getPeriodRange(period);

  const creatives = await prisma.creative.findMany({
    where: { clientId: client.id },
    include: {
      campaign: { select: { name: true } },
      metrics: { where: { date: { gte: from, lte: to } } },
    },
  });

  const rows = creatives
    .map((cr) => {
      const spend = cr.metrics.reduce((s, m) => s + Number(m.spend), 0);
      const purchases = cr.metrics.reduce((s, m) => s + m.purchases, 0);
      const revenue = cr.metrics.reduce((s, m) => s + Number(m.revenue), 0);
      const roas = spend > 0 ? revenue / spend : 0;
      return {
        id: cr.id,
        name: cr.name ?? "Sem nome",
        campaignName: cr.campaign?.name,
        thumbnailUrl: cr.thumbnailUrl,
        spend,
        purchases,
        roas,
      };
    })
    .filter((r) => r.spend > 0 || r.purchases > 0)
    .sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <UrlSelect paramName="period" value={period} options={PERIOD_OPTIONS} />
        <UrlSelect paramName="sort" value={sort} options={SORT_OPTIONS} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum criativo com atividade no período selecionado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r, i) => (
            <Card key={r.id} className="overflow-hidden py-0">
              <div className="relative aspect-square w-full bg-muted">
                {r.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnailUrl}
                    alt={r.name}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-8" />
                  </div>
                )}
                {i < 3 && (
                  <Badge className="absolute left-2 top-2" variant="default">
                    #{i + 1}
                  </Badge>
                )}
              </div>
              <CardContent className="flex flex-col gap-2 py-4">
                <p className="truncate text-sm font-medium">{r.name}</p>
                {r.campaignName && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.campaignName}
                  </p>
                )}
                <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Compras</p>
                    <p className="font-semibold tabular-nums">
                      {formatNumber(r.purchases)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className="font-semibold tabular-nums">
                      {formatRoas(r.roas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gasto</p>
                    <p className="font-semibold tabular-nums">
                      {formatCurrencyBRL(r.spend)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
