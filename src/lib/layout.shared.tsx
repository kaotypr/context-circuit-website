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
    // The sidebar tree marks the current page, so the section links carry no active state.
    links: [
      { text: "Docs", url: "/docs", active: "none" },
      { text: "Release notes", url: `/releases/template/${releaseRegistry.template.current}`, active: "none" },
      { text: "Changelog", url: "/changelog", active: "none" },
    ],
  };
}
