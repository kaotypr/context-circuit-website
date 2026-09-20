import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNavigation, buildSearchIndex } from "../src/lib/content/consumers";
import { ContentValidationError, validateContent } from "../src/lib/content/validate";

const temporaryDirectories: string[] = [];

const validFrontmatter = `---
title: Test page
description: A deterministic fixture document.
section: Tests
order: 1
audience: [contributor]
tracks: [template]
versions:
  template: 2.1.0
redirects: []
sources:
  - track: template
    repository: context-circuit-source
    ref: v2.1.0
    path: README.md
---`;

async function fixture(files: Record<string, string>): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "context-circuit-content-"));
  temporaryDirectories.push(directory);
  await Promise.all(
    Object.entries(files).map(async ([name, content]) => {
      const filename = path.join(directory, name);
      await fs.mkdir(path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, content, "utf8");
    }),
  );
  return directory;
}

async function validationMessage(files: Record<string, string>): Promise<string> {
  const directory = await fixture(files);
  try {
    await validateContent(directory);
  } catch (error) {
    expect(error).toBeInstanceOf(ContentValidationError);
    return (error as Error).message;
  }
  throw new Error("Expected content validation to fail");
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("content validation", () => {
  it("builds stable routes and keeps release tracks independent", async () => {
    const directory = await fixture({
      "index.mdx": `${validFrontmatter}\n\n# Welcome`,
      "versions/template/2/start.mdx": `${validFrontmatter.replace("order: 1", "order: 2")}\n\n# Start`,
      "versions/cli/2/start.mdx": `${validFrontmatter
        .replace("order: 1", "order: 3")
        .replaceAll("template", "cli")
        .replace("context-circuit-source", "context-circuit")
        .replace("ref: v2.1.0", "ref: cli-v2.1.0")}\n\n# Start`,
    });

    const graph = await validateContent(directory);
    expect([...graph.byRoute.keys()]).toEqual([
      "/",
      "/docs/cli/v2/start",
      "/docs/template/v2/start",
    ]);
    expect(graph.byRoute.get("/docs/template/v2/start")?.frontmatter.versions.template).toBe("2.1.0");
    expect(graph.byRoute.get("/docs/cli/v2/start")?.frontmatter.versions.cli).toBe("2.1.0");
  });

  it("identifies the file and unknown metadata field", async () => {
    const message = await validationMessage({
      "index.mdx": `${validFrontmatter.replace("order: 1", "order: 1\nunexpected: true")}\n\n# Page`,
    });
    expect(message).toContain("index.mdx: frontmatter: Unrecognized key");
  });

  it("requires a version selection for every track", async () => {
    const message = await validationMessage({
      "index.mdx": `${validFrontmatter.replace("tracks: [template]", "tracks: [template, cli]")}\n\n# Page`,
    });
    expect(message).toContain("index.mdx: versions.cli: is required because tracks includes cli");
  });

  it("rejects duplicate sibling orders", async () => {
    const message = await validationMessage({
      "docs/one.mdx": `${validFrontmatter}\n\n# One`,
      "docs/two.mdx": `${validFrontmatter}\n\n# Two`,
    });
    expect(message).toContain("docs/two.mdx: order: duplicates 1 in section Tests");
  });

  it("rejects missing navigation parents", async () => {
    const message = await validationMessage({
      "docs/guides/setup.mdx": `${validFrontmatter}\n\n# Setup`,
    });
    expect(message).toContain("docs/guides/setup.mdx: path: missing navigation parent /docs/guides");
  });

  it("reports broken internal links and fragments", async () => {
    const message = await validationMessage({
      "docs/start.mdx": `${validFrontmatter}\n\n# Existing\n\n[Missing](/docs/nope)\n[Heading](#absent)`,
    });
    expect(message).toContain("docs/start.mdx: link: broken internal target /docs/nope");
    expect(message).toContain("docs/start.mdx: link: missing fragment #absent in docs/start.mdx");
  });

  it("rejects redirects that collide with routes or redirect to themselves", async () => {
    const message = await validationMessage({
      "docs/one.mdx": `${validFrontmatter.replace("redirects: []", "redirects: [/docs/two]")}\n\n# One`,
      "docs/two.mdx": `${validFrontmatter
        .replace("order: 1", "order: 2")
        .replace("redirects: []", "redirects: [/docs/two]")}\n\n# Two`,
    });
    expect(message).toContain("docs/one.mdx: redirects: /docs/two conflicts with a document route");
    expect(message).toContain("docs/two.mdx: redirects: /docs/two cannot redirect to itself");
  });

  it("rejects undeclared releases and mismatched immutable source refs", async () => {
    const message = await validationMessage({
      "index.mdx": `${validFrontmatter
        .replace("template: 2.1.0", "template: 9.9.9")
        .replace("ref: v2.1.0", "ref: main")}\n\n# Page`,
    });
    expect(message).toContain("index.mdx: versions.template: unknown release selector 9.9.9");

    const refMessage = await validationMessage({
      "index.mdx": `${validFrontmatter.replace("ref: v2.1.0", "ref: main")}\n\n# Page`,
    });
    expect(refMessage).toContain("index.mdx: sources.0.ref: expected immutable ref v2.1.0");
  });

  it("retains excluded documents in the graph and prevents published links to them", async () => {
    const message = await validationMessage({
      "docs/public.mdx": `${validFrontmatter}\n\n# Public\n\n[Hidden](/docs/hidden)`,
      "docs/hidden.mdx": `${validFrontmatter
        .replace("order: 1", "order: 2")
        .replace("redirects: []", "draft: true\nunlisted: true\nredirects: []")}\n\n# Hidden`,
    });
    expect(message).toContain(
      "docs/public.mdx: link: published content cannot target excluded document docs/hidden.mdx",
    );
  });

  it("excludes drafts and unlisted pages from navigation and search consumers", async () => {
    const directory = await fixture({
      "docs/public.mdx": `${validFrontmatter}\n\n# Public`,
      "docs/hidden.mdx": `${validFrontmatter
        .replace("order: 1", "order: 2")
        .replace("redirects: []", "draft: true\nunlisted: true\nredirects: []")}\n\n# Hidden`,
    });
    const graph = await validateContent(directory);

    expect(buildNavigation(graph).map((item) => item.route)).toEqual(["/docs/public"]);
    expect(buildSearchIndex(graph).map((item) => item.route)).toEqual(["/docs/public"]);
  });
});
