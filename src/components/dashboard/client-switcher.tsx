"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Client } from "@/generated/prisma/client";

export function ClientSwitcher({
  clients,
  currentSlug,
}: {
  clients: Client[];
  currentSlug?: string;
}) {
  const router = useRouter();
  const current = clients.find((c) => c.slug === currentSlug);

  if (clients.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">Nenhum cliente</span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
      >
        {current ? current.name : "Selecionar cliente"}
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {clients.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => router.push(`/${c.slug}`)}
          >
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
