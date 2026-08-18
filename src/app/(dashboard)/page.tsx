import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccessibleClients } from "@/lib/access-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const clients = await getAccessibleClients();

  if (clients.length === 1) {
    redirect(`/${clients[0].slug}`);
  }

  if (clients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não tem acesso a nenhum cliente. Peça para um admin te dar
        acesso.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Seus clientes</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <Link key={c.id} href={`/${c.slug}`}>
            <Card className="transition-colors hover:border-foreground/30">
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ver dashboards
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
