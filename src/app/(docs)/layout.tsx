import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  // Fumadocs' default docs layout: logo, search, navigation, and theme in a
  // full-height sidebar; every section stays in one tree rather than tabs.
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions()} tabs={false}>
      {children}
    </DocsLayout>
  );
}
