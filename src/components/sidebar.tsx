"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import type { NavigationItem } from "@/lib/content/consumers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavLink } from "./nav-link";

export function Sidebar({ items, mobile = false }: { items: NavigationItem[]; mobile?: boolean }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const groups = Map.groupBy(
    items.filter((item) => item.route !== "/" && !["versioned", "release", "changelog"].includes(item.kind)),
    (item) => item.section,
  );

  return (
    <nav
      className="sidebar"
      aria-label={mobile ? "Mobile documentation navigation" : "Documentation navigation"}
    >
      {[...groups].map(([section, entries]) => {
        const active = entries.some((entry) => entry.route === pathname || pathname.startsWith(entry.route + "/"));
        if (section === "Documentation") {
          return (
            <div className="sidebar-group" key={section}>
              <NavLink href="/docs">Documentation</NavLink>
            </div>
          );
        }

        const index = entries.find((entry) => entry.order === 0);
        const children = entries.filter((entry) => entry.order !== 0);
        const open = mobile || active;

        return (
          <Collapsible
            className="sidebar-group"
            defaultOpen={open}
            key={section + String(open)}
          >
            <div className="sidebar-group-head">
              {index ? (
                <NavLink href={index.route}>{index.label}</NavLink>
              ) : (
                <span className="sidebar-group-label">{section}</span>
              )}
              {children.length ? (
                <CollapsibleTrigger className="sidebar-group-toggle" aria-label={"Toggle " + section}>
                  <ChevronRight aria-hidden="true" className="sidebar-chevron" />
                </CollapsibleTrigger>
              ) : null}
            </div>
            {children.length ? (
              <CollapsibleContent>
                <ul className="sidebar-list">
                  {children.map((entry) => (
                    <li key={entry.route}>
                      <NavLink href={entry.route}>{entry.label}</NavLink>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            ) : null}
          </Collapsible>
        );
      })}
      <div className="sidebar-foot">
        <Link href="/docs/template/v2/getting-started">Template v2.1.0</Link>
        <Link href="/docs/cli/v2/getting-started">CLI v2.1.0</Link>
        <Link href="/changelog/template">Template changelog</Link>
        <Link href="/changelog/cli">CLI changelog</Link>
      </div>
    </nav>
  );
}

export function MobileNav({ items }: { items: NavigationItem[] }) {
  const menu = useRef<HTMLDetailsElement>(null);

  return (
    <details
      className="mobile-nav"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          menu.current?.removeAttribute("open");
          menu.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        Browse documentation <span aria-hidden="true">☰</span>
      </summary>
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            menu.current?.removeAttribute("open");
          }
        }}
      >
        <Sidebar items={items} mobile />
      </div>
    </details>
  );
}
