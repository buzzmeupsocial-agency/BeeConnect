"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UrlSelect({
  paramName,
  value,
  options,
  className,
}: {
  paramName: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string | null) {
    if (!next) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, next);
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-44"}>
        <SelectValue>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
