import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button border text-sm font-medium transition-colors duration-fast ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:bg-primary hover:shadow-focus",
        secondary: "border-border bg-secondary text-secondary-foreground hover:bg-secondary",
        outline: "border-border bg-card text-card-foreground hover:bg-state-hover hover:border-border-strong",
        ghost: "border-transparent bg-transparent text-foreground hover:bg-state-hover",
        muted: "border-border bg-muted text-foreground hover:bg-state-hover hover:border-border-strong",
        destructive:
          "border-destructive-border bg-destructive text-destructive-foreground hover:bg-state-hover",
        link: "border-transparent bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[var(--density-control-h)] px-4 py-2",
        sm: "min-h-[var(--size-control-sm)] px-3 text-xs",
        lg: "min-h-[var(--size-control-lg)] px-6",
        icon: "size-[var(--size-touch-target)] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
