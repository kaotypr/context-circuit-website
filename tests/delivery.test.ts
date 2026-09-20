import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { publishedDocuments } from "../src/lib/content/consumers";
import { validateContent } from "../src/lib/content/validate";

const root = process.cwd();

describe("delivery configuration", () => {
  it("keeps CI reproducible and free of provider or production writes", async () => {
    const workflow = await fs.readFile(path.join(root, ".github/workflows/check.yml"), "utf8");

    for (const command of [
      "pnpm install --frozen-lockfile",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm content:check",
      "pnpm test -- --runInBand",
      "pnpm build",
      "pnpm static:check",
    ]) {
      expect(workflow, command).toContain(`run: ${command}`);
    }
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("NEXT_PUBLIC_DEPLOYMENT_ENV: preview");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).not.toMatch(/cloudflare|wrangler|pages: write|production/i);
  });

  it("keeps static host redirects synchronized with content metadata", async () => {
    const [graph, redirectsSource] = await Promise.all([
      validateContent(path.join(root, "content")),
      fs.readFile(path.join(root, "public/_redirects"), "utf8"),
    ]);
    const configuredRedirects = redirectsSource
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    const expectedRedirects = publishedDocuments(graph).flatMap((document) =>
      document.frontmatter.redirects.map(
        (redirect) => `${redirect} ${document.routeInfo.route}/ 301`,
      ),
    );

    expect(configuredRedirects).toEqual(expectedRedirects);
  });

  it("documents the static boundary and publication gate", async () => {
    const deployment = await fs.readFile(path.join(root, "docs/deployment.md"), "utf8");

    expect(deployment).toContain("Build output directory | `out`");
    expect(deployment).toContain("NEXT_PUBLIC_DEPLOYMENT_ENV=production");
    expect(deployment).toContain("Publication is a later authorized action");
    expect(deployment).toMatch(/last known-good successful production\s+deployment/);
    expect(deployment).toMatch(/does not read a database, CMS, runtime API/);
  });
});
