"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const current = pathname === href;

  return (
    <Link
      className={cn("sidebar-link")}
      href={href}
      aria-current={current ? "page" : undefined}
      data-active={current}
    >
      {children}
    </Link>
  );
}
