import { prisma } from "@/lib/db";
import { createOrUpdateClient } from "@/app/admin/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  const editing = edit ? clients.find((c) => c.id === edit) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Meta Ad Account</TableHead>
              <TableHead>Google Ads Customer</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.metaAdAccountId ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.googleAdsCustomerId ?? "—"}
                </TableCell>
                <TableCell>
                  <a
                    href={`/admin/clientes?edit=${c.id}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Editar
                  </a>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum cliente cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {editing ? `Editar ${editing.name}` : "Novo cliente"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createOrUpdateClient} className="flex flex-col gap-4">
            <input type="hidden" name="id" defaultValue={editing?.id ?? ""} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={editing?.name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Slug (usado na URL)</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editing?.slug}
                placeholder="ex: winepopper"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metaAdAccountId">Meta Ad Account ID</Label>
              <Input
                id="metaAdAccountId"
                name="metaAdAccountId"
                defaultValue={editing?.metaAdAccountId ?? ""}
                placeholder="act_123456789"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="googleAdsCustomerId">Google Ads Customer ID</Label>
              <Input
                id="googleAdsCustomerId"
                name="googleAdsCustomerId"
                defaultValue={editing?.googleAdsCustomerId ?? ""}
                placeholder="somente números, sem traços"
              />
            </div>
            <Button type="submit" className="mt-2 w-fit">
              {editing ? "Salvar alterações" : "Criar cliente"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
