import Image from "next/image";
import Link from "next/link";
import { getAccessibleClients, getCurrentProfile } from "@/lib/access-control";
import { ClientSwitcher } from "@/components/dashboard/client-switcher";
import { LogoutButton } from "@/components/dashboard/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, clients] = await Promise.all([
    getCurrentProfile(),
    getAccessibleClients(),
  ]);

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/brand/logo-preto.png" alt="BuzzMeUp" width={24} height={24} className="size-6 object-contain" />
              <span className="font-display text-lg font-bold">BeeConnect</span>
            </Link>
            <ClientSwitcher clients={clients} />
          </div>
          <div className="flex items-center gap-3">
            {profile.isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {profile.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
