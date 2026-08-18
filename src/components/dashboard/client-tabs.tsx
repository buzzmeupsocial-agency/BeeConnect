"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/${slug}`, label: "Investimento" },
    { href: `/${slug}/leads`, label: "Leads e Compras" },
    { href: `/${slug}/campanhas`, label: "Campanhas" },
    { href: `/${slug}/criativos`, label: "Criativos campeões" },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
