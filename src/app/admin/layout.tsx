import Image from "next/image";
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
    <div className="min-h-svh">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/brand/logo-preto.png" alt="BuzzMeUp" width={24} height={24} className="size-6 object-contain" />
              <span className="font-display text-lg font-bold">BeeConnect</span>
            </Link>
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar aos dashboards
            </Link>
            <Link href="/conta" className="text-sm text-muted-foreground hover:text-foreground">
              Minha conta
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
