import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";

export function SortableTh({
  label,
  field,
  currentSort,
  currentDir,
  basePath,
  extraParams,
  align = "left",
}: {
  label: string;
  field: string;
  currentSort: string;
  currentDir: "asc" | "desc";
  basePath: string;
  extraParams: Record<string, string>;
  align?: "left" | "right";
}) {
  const nextDir = currentSort === field && currentDir === "desc" ? "asc" : "desc";
  const params = new URLSearchParams({ ...extraParams, sort: field, dir: nextDir });
  const active = currentSort === field;

  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Link
        href={`${basePath}?${params.toString()}`}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {active ? (
          currentDir === "desc" ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUp className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" />
        )}
      </Link>
    </TableHead>
  );
}
