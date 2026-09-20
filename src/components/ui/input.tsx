import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 min-h-[var(--density-control-h)] rounded-input border border-input bg-background px-[var(--field-padding-x)] py-2 text-sm text-foreground placeholder:text-foreground-subtle",
        className,
      )}
      {...props}
    />
  );
}
