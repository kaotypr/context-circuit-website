import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isProductionDeployment, resultBucket, sanitizeEvent } from "../src/lib/analytics";
import type { SearchRecord } from "../src/lib/content/consumers";
import { rankSearch } from "../src/lib/search";
import { validateTheme } from "../src/lib/theme";

const record = (partial: Partial<SearchRecord>): SearchRecord => ({
  route: "/docs/example", title: "Example", description: "A useful page", section: "Reference",
  tracks: ["cli"], versions: { cli: "2.1.0" }, headings: ["Run a command"], text: "body terminology", ...partial,
});

describe("documentation experience", () => {
  it("keeps the canonical theme and font roles intact", async () => {
    await expect(validateTheme(process.cwd())).resolves.toEqual([]);
  });

  it("ranks exact titles and headings above body matches", () => {
    const results = rankSearch([
      record({ route: "/body", title: "Other", headings: [], text: "workspace files" }),
      record({ route: "/heading", title: "Other heading", headings: ["Workspace files"] }),
      record({ route: "/title", title: "Workspace files", headings: [] }),
    ], "workspace files");
    expect(results.map((result) => result.route)).toEqual(["/title", "/heading", "/body"]);
  });

  it("filters search by independent track and version", () => {
    const results = rankSearch([
      record({ route: "/cli", tracks: ["cli"], versions: { cli: "2.1.0" } }),
      record({ route: "/template", tracks: ["template"], versions: { template: "2.1.0" } }),
    ], "example", { track: "template", version: "2.1.0" });
    expect(results.map((result) => result.route)).toEqual(["/template"]);
  });

  it("allows only bounded aggregate analytics properties", () => {
    expect(sanitizeEvent("docs_search", { section: "Reference", results: "1-5", query: "secret" })).toEqual({ section: "Reference", results: "1-5" });
    expect(sanitizeEvent("code_copy", { category: "shell", code: "token=secret" })).toEqual({ category: "shell" });
    expect(resultBucket(0)).toBe("0"); expect(resultBucket(6)).toBe("6-20"); expect(resultBucket(42)).toBe("20+");
    expect(isProductionDeployment("preview")).toBe(false);
    expect(isProductionDeployment("production")).toBe(true);
  });

  it("ships keyboard, responsive, focus, and reduced-motion fixtures", async () => {
    const [layout, styles, search] = await Promise.all([
      fs.readFile(path.join(process.cwd(), "src/app/layout.tsx"), "utf8"),
      fs.readFile(path.join(process.cwd(), "src/styles/site.css"), "utf8"),
      fs.readFile(path.join(process.cwd(), "src/components/search.tsx"), "utf8"),
    ]);
    expect(layout).toContain("skip-link");
    expect(layout).toContain("mobile-nav");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(search).toContain("event.key.toLowerCase() === \"k\"");
    expect(search).toContain("aria-label=\"Filter by product track\"");
  });
});
