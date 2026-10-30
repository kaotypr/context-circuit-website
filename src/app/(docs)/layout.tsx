import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  const { nav, ...options } = baseOptions();
  return (
    <DocsLayout tree={source.pageTree} {...options} nav={{ ...nav, mode: "top" }} tabs={false}>
      {children}
    </DocsLayout>
  );
}
