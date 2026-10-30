import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contentRoutes } from "../src/lib/content-routes";

const root = process.cwd();

describe("delivery configuration", () => {
  it("keeps CI reproducible and free of provider or production writes", async () => {
    const workflow = await fs.readFile(path.join(root, ".github/workflows/check.yml"), "utf8");

    for (const command of [
      "pnpm install --frozen-lockfile",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm theme:check",
      "pnpm test -- --runInBand",
      "pnpm build",
      "pnpm static:check",
    ]) {
      expect(workflow, command).toContain(`run: ${command}`);
    }
    expect(workflow).not.toContain("content:check");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("NEXT_PUBLIC_DEPLOYMENT_ENV: preview");
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).not.toMatch(/cloudflare|wrangler|pages: write|production/i);
  });

  it("points every static host redirect at a content page", async () => {
    const [routes, redirectsSource] = await Promise.all([
      contentRoutes(path.join(root, "content")),
      fs.readFile(path.join(root, "public/_redirects"), "utf8"),
    ]);
    const redirects = redirectsSource
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split(/\s+/));

    expect(redirects.length).toBeGreaterThan(0);
    for (const [from, target, status] of redirects) {
      expect(status, from).toBe("301");
      expect(routes, `${from} -> ${target}`).toContain(target.replace(/\/$/, "") || "/");
      expect(routes, `${from} must not shadow a page`).not.toContain(from.replace(/\/$/, ""));
    }
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
