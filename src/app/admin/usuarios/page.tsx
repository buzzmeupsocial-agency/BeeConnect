import { prisma } from "@/lib/db";
import { inviteUser, setUserAdmin, toggleClientAccess } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default async function AdminUsuariosPage() {
  const [profiles, clients, access] = await Promise.all([
    prisma.profile.findMany({ orderBy: { email: "asc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.userClientAccess.findMany(),
  ]);

  const accessByUser = new Map<string, Set<string>>();
  for (const a of access) {
    const set = accessByUser.get(a.userId) ?? new Set<string>();
    set.add(a.clientId);
    accessByUser.set(a.userId, set);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Convidar usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteUser} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <Button type="submit">Convidar</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            A pessoa recebe um email do Supabase para definir a senha e entrar.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {profiles.map((p) => {
          const userClients = accessByUser.get(p.id) ?? new Set<string>();
          return (
            <Card key={p.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{p.email}</CardTitle>
                  {p.name && <p className="text-sm text-muted-foreground">{p.name}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {p.isAdmin && <Badge>Admin</Badge>}
                  <form action={setUserAdmin}>
                    <input type="hidden" name="userId" value={p.id} />
                    <input type="hidden" name="isAdmin" value={(!p.isAdmin).toString()} />
                    <Button type="submit" variant="outline" size="sm">
                      {p.isAdmin ? "Remover admin" : "Tornar admin"}
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-3" />
                <p className="mb-2 text-xs text-muted-foreground">
                  {p.isAdmin
                    ? "Admin vê todos os clientes automaticamente."
                    : "Acesso por cliente"}
                </p>
                {!p.isAdmin && (
                  <div className="flex flex-wrap gap-2">
                    {clients.map((c) => {
                      const hasAccess = userClients.has(c.id);
                      return (
                        <form key={c.id} action={toggleClientAccess}>
                          <input type="hidden" name="userId" value={p.id} />
                          <input type="hidden" name="clientId" value={c.id} />
                          <input
                            type="hidden"
                            name="grant"
                            value={(!hasAccess).toString()}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant={hasAccess ? "default" : "outline"}
                          >
                            {c.name}
                          </Button>
                        </form>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {profiles.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum usuário fez login ainda.
          </p>
        )}
      </div>
    </div>
  );
}
