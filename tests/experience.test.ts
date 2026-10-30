import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isProductionDeployment, sanitizeEvent } from "../src/lib/analytics";
import { validateTheme } from "../src/lib/theme";

const read = (file: string) => fs.readFile(path.join(process.cwd(), file), "utf8");

describe("documentation experience", () => {
  it("keeps the canonical theme and font roles intact", async () => {
    await expect(validateTheme(process.cwd())).resolves.toEqual([]);
  });

  it("allows only bounded aggregate analytics properties", () => {
    expect(sanitizeEvent("install_cta", { destination: "template", query: "secret" })).toEqual({
      destination: "template",
    });
    expect(sanitizeEvent("install_cta", { destination: "elsewhere" })).toEqual({});
    expect(isProductionDeployment("preview")).toBe(false);
    expect(isProductionDeployment("production")).toBe(true);
  });

  it("ships skip-link, focus, reduced-motion, and static search fixtures", async () => {
    const [layout, styles, docsPage] = await Promise.all([
      read("src/app/layout.tsx"),
      read("src/styles/site.css"),
      read("src/app/(docs)/[...slug]/page.tsx"),
    ]);
    expect(layout).toContain("skip-link");
    expect(layout).toContain('href="#main-content"');
    expect(docsPage).toContain('id="main-content"');
    expect(layout).toContain('type: "static"');
    expect(layout).toContain('api: "/search-index.json"');
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("keeps the changelog filterable by product and version", async () => {
    const timeline = await read("src/components/changelog-timeline.tsx");
    expect(timeline).toContain('aria-label="Filter releases"');
    expect(timeline).toContain('aria-label="Product"');
    expect(timeline).toContain("All versions");
  });
});
