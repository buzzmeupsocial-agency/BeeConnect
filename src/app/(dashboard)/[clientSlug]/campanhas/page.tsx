import { requireClientAccess } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { getPeriodRange, parsePeriod, PERIOD_OPTIONS } from "@/lib/date-range";
import { formatCurrencyBRL, formatNumber, formatRoas } from "@/lib/format";
import { UrlSelect } from "@/components/dashboard/url-select";
import { SortableTh } from "@/components/dashboard/sortable-th";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Platform, ResultType } from "@/generated/prisma/client";

const PLATFORM_OPTIONS = [
  { value: "all", label: "Todas as plataformas" },
  { value: "META", label: "Meta Ads" },
  { value: "GOOGLE", label: "Google Ads" },
];

type SortField = "spend" | "result" | "cpa" | "roas";

export default async function CampanhasPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientSlug: string }>;
  searchParams: Promise<{
    period?: string;
    platform?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const { clientSlug } = await params;
  const sp = await searchParams;
  const { client } = await requireClientAccess(clientSlug);

  const period = parsePeriod(sp.period);
  const platform = sp.platform === "META" || sp.platform === "GOOGLE" ? sp.platform : "all";
  const sort: SortField =
    sp.sort === "result" || sp.sort === "cpa" || sp.sort === "roas" ? sp.sort : "spend";
  const dir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const { from, to } = getPeriodRange(period);

  const campaigns = await prisma.campaign.findMany({
    where: {
      clientId: client.id,
      ...(platform === "all" ? {} : { platform: platform as Platform }),
    },
    include: {
      metrics: { where: { date: { gte: from, lte: to } } },
    },
  });

  const rows = campaigns.map((c) => {
    const spend = c.metrics.reduce((s, m) => s + Number(m.spend), 0);
    const leads = c.metrics.reduce((s, m) => s + m.leads, 0);
    const purchases = c.metrics.reduce((s, m) => s + m.purchases, 0);
    const revenue = c.metrics.reduce((s, m) => s + Number(m.revenue), 0);
    const result = c.resultType === ResultType.LEADS ? leads : purchases;
    const cpa = result > 0 ? spend / result : null;
    const roas = c.resultType === ResultType.PURCHASES && spend > 0 ? revenue / spend : null;

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      resultType: c.resultType,
      status: c.status,
      spend,
      result,
      cpa,
      roas,
    };
  });

  rows.sort((a, b) => {
    const av = a[sort] ?? -Infinity;
    const bv = b[sort] ?? -Infinity;
    return dir === "desc" ? bv - av : av - bv;
  });

  const basePath = `/${clientSlug}/campanhas`;
  const extraParams = { period, platform };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <UrlSelect paramName="period" value={period} options={PERIOD_OPTIONS} />
        <UrlSelect paramName="platform" value={platform} options={PLATFORM_OPTIONS} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campanha</TableHead>
              <TableHead>Plataforma</TableHead>
              <SortableTh
                label="Investimento"
                field="spend"
                currentSort={sort}
                currentDir={dir}
                basePath={basePath}
                extraParams={extraParams}
                align="right"
              />
              <SortableTh
                label="Resultado"
                field="result"
                currentSort={sort}
                currentDir={dir}
                basePath={basePath}
                extraParams={extraParams}
                align="right"
              />
              <SortableTh
                label="CPA"
                field="cpa"
                currentSort={sort}
                currentDir={dir}
                basePath={basePath}
                extraParams={extraParams}
                align="right"
              />
              <SortableTh
                label="ROAS"
                field="roas"
                currentSort={sort}
                currentDir={dir}
                basePath={basePath}
                extraParams={extraParams}
                align="right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-72 truncate font-medium">{r.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {r.platform === Platform.META ? "Meta" : "Google"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrencyBRL(r.spend)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.result)}{" "}
                  <span className="text-xs text-muted-foreground">
                    {r.resultType === ResultType.LEADS ? "leads" : "compras"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.cpa !== null ? formatCurrencyBRL(r.cpa) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.roas !== null ? formatRoas(r.roas) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma campanha no período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
