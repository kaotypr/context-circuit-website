import type { NavigationItem } from "@/lib/content/consumers";
import { NavLink } from "./nav-link";

function groups(items: NavigationItem[]) {
  return Map.groupBy(items.filter((item) => item.route !== "/"), (item) => item.section);
}

export function Sidebar({ items }: { items: NavigationItem[] }) {
  return (
    <nav className="sidebar" aria-label="Documentation navigation">
      {[...groups(items)].map(([section, entries]) => (
        <section className="sidebar-group" key={section}>
          <h2 className="sidebar-label">{section}</h2>
          <ul className="sidebar-list">
            {entries.map((entry) => (
              <li key={entry.route}>
                <NavLink href={entry.route}>{entry.label}</NavLink>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
