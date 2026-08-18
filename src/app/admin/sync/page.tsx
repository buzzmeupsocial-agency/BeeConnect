import { prisma } from "@/lib/db";
import { triggerSyncAll, triggerSyncClient } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SyncStatus } from "@/generated/prisma/client";

export default async function AdminSyncPage() {
  const [clients, runs] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { client: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <form action={triggerSyncAll}>
          <Button type="submit">Sincronizar todos os clientes agora</Button>
        </form>
        {clients.map((c) => (
          <form key={c.id} action={triggerSyncClient}>
            <input type="hidden" name="clientId" value={c.id} />
            <Button type="submit" variant="outline" size="sm">
              Sincronizar {c.name}
            </Button>
          </form>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        O sync automático roda 1x/dia via Vercel Cron em produção. Localmente
        (ou antes de configurar o cron), use os botões acima.
      </p>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plataforma</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Registros</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.client.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.platform}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.startedAt.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell>
                  {r.status === SyncStatus.SUCCESS && <Badge>Sucesso</Badge>}
                  {r.status === SyncStatus.ERROR && (
                    <Badge variant="destructive">Erro</Badge>
                  )}
                  {!r.status && <Badge variant="outline">Em andamento</Badge>}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.recordsSynced}
                </TableCell>
                <TableCell className="max-w-72 truncate text-xs text-muted-foreground">
                  {r.error}
                </TableCell>
              </TableRow>
            ))}
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma sincronização ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
