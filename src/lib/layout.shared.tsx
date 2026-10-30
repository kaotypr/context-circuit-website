import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BrandMark } from "@/components/brand-mark";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="brand">
          <BrandMark />
          <span className="brand-text">Context Circuit</span>
        </span>
      ),
      url: "/",
    },
    links: [
      { text: "Docs", url: "/docs", active: "nested-url" },
      { text: "Releases", url: "/docs/releases", active: "url" },
      { text: "Changelog", url: "/changelog/template", active: "none" },
    ],
  };
}
