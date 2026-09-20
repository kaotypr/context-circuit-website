import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    // Official product mark from context-circuit; keep the SVG as a static asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mark.svg"
      alt={alt}
      width={40}
      height={40}
      className={cn("brand-logo", className)}
    />
  );
}
