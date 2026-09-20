import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full gap-4 rounded-card border p-[var(--density-card-padding)] text-sm",
  {
    variants: {
      variant: {
        info: "border-info-border bg-info text-info-foreground",
        success: "border-success-border bg-success text-success-foreground",
        warning: "border-warning-border bg-warning text-warning-foreground",
        destructive: "border-destructive-border bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

export type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="note"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("[&_p]:m-0", className)}
      {...props}
    />
  );
}
