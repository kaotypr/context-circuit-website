import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BrandMark } from "@/components/brand-mark";
import { releaseRegistry } from "@/lib/releases";

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
    themeSwitch: { mode: "light-dark" },
    links: [
      { text: "Docs", url: "/docs", active: "nested-url" },
      { text: "Release notes", url: `/releases/template/${releaseRegistry.template.current}`, active: "none" },
      { text: "Changelog", url: "/changelog", active: "nested-url" },
    ],
  };
}
