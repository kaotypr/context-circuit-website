import * as React from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "rounded-chip border border-[var(--kbd-border)] bg-[var(--kbd-bg)] px-2 font-mono text-xs text-[var(--kbd-fg)]",
        className,
      )}
      {...props}
    />
  );
}
