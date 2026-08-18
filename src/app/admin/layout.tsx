import Link from "next/link";
import { requireAdmin } from "@/lib/access-control";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const tabs = [
    { href: "/admin/clientes", label: "Clientes" },
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/sync", label: "Sincronização" },
  ];

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              Dashboard Ratos
            </Link>
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar aos dashboards
            </Link>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-4 px-4">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="border-b-2 border-transparent px-1 py-2 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
