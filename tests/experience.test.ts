import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isProductionDeployment, sanitizeEvent } from "../src/lib/analytics";
import { templateInitCommand } from "../src/lib/install";
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

  it("lays out the home page in the five i143 sections", async () => {
    const home = await read("content/index.mdx");
    const order = ["<HomeHero>", "<HomeSplit>", "<Steps>", "<Features>", "<Products>", "<HomeCallToAction>"].map((tag) => home.indexOf(tag));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("copies the same workspace command the install page shows", async () => {
    const install = await read("content/docs/get-started/install.mdx");
    const block = /```sh\n(npx tembiter init[\s\S]*?)\n```/.exec(install)?.[1] ?? "";
    expect(block.replace(/\\\n\s*/g, "")).toBe(templateInitCommand());
  });

  it("keeps the changelog filterable by product and version", async () => {
    const timeline = await read("src/components/changelog-timeline.tsx");
    expect(timeline).toContain('aria-label="Filter releases"');
    expect(timeline).toContain('aria-label="Product"');
    expect(timeline).toContain("All versions");
  });
});
