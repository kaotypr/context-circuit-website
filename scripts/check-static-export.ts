import { promises as fs } from "node:fs";
import path from "node:path";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { contentRoutes } from "../src/lib/content-routes";
import { releaseRegistry, releasesNewestFirst, tracks } from "../src/lib/releases";

const root = process.cwd();
const contentDirectory = path.join(root, "content");
const failures: string[] = [];

async function read(relativePath: string): Promise<string> {
  try {
    return await fs.readFile(path.join(root, relativePath), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${relativePath}: ${message}`);
    return "";
  }
}

async function exists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function requireText(file: string, source: string, expected: string): void {
  if (!source.includes(expected)) failures.push(`${file}: missing ${JSON.stringify(expected)}`);
}

function artifactPath(route: string): string {
  return route === "/" ? "out/index.html" : `out${route.replace(/\/$/, "")}/index.html`;
}

async function main(): Promise<void> {
  const routes = await contentRoutes(contentDirectory);

  // Every content page is exported with exactly one page heading.
  for (const route of routes) {
    const file = artifactPath(route);
    const html = await read(file);
    if (html && (html.match(/<h1[\s>]/g) ?? []).length !== 1) {
      failures.push(`${file}: expected exactly one h1`);
    }
  }

  // Public URLs named by the intent's constraints.
  const required = new Set<string>(["/", "/docs", "/docs/get-started", "/docs/reference/cli-commands"]);
  for (const track of tracks) {
    required.add(`/changelog/${track}`);
    required.add(`/docs/${track}/v2/getting-started`);
    for (const release of releasesNewestFirst(track)) required.add(`/releases/${track}/${release.version}`);
  }
  for (const route of required) {
    if (!routes.includes(route)) failures.push(`${route}: no content file produces this public route`);
    if (!(await exists(artifactPath(route)))) failures.push(`${artifactPath(route)}: required route was not exported`);
  }

  const representative = new Map([
    ["/", "Why it exists"],
    ["/docs", "Understand Context Circuit"],
    ["/docs/get-started", "Setup Context Circuit"],
    ["/docs/reference/cli-commands", "CLI commands"],
    ["/docs/template/v2/getting-started", "Workspace template v2"],
    ["/docs/cli/v2/getting-started", "Context Circuit CLI v2"],
    ["/changelog", "Changelog"],
    ["/changelog/template", "Workspace template changelog"],
    ["/changelog/cli", "Context Circuit CLI changelog"],
  ]);
  for (const [route, text] of representative) {
    const file = artifactPath(route);
    requireText(file, await read(file), text);
  }

  // The changelog lists every registry release for both tracks, with its filters.
  const changelogFile = artifactPath("/changelog");
  const changelogPage = await read(changelogFile);
  requireText(changelogFile, changelogPage, 'aria-label="Filter releases"');
  for (const track of tracks) {
    for (const release of releasesNewestFirst(track)) {
      const href = `/releases/${track}/${release.version}`;
      if (!changelogPage.includes(`href="${href}"`) && !changelogPage.includes(`href="${href}/"`)) {
        failures.push(`${changelogFile}: changelog does not list ${href}`);
      }
    }
  }

  // Each page names the releases it describes.
  const baselineFile = artifactPath("/docs/cli/v2/getting-started");
  const baselinePage = await read(baselineFile);
  requireText(baselineFile, baselinePage, 'class="version-baseline"');
  requireText(baselineFile, baselinePage, `CLI ${releaseRegistry.cli.current}`);

  const cliChangelogFile = artifactPath("/changelog/cli");
  requireText(cliChangelogFile, await read(cliChangelogFile), "/releases/cli/2.1.0");

  // Every redirect lands on an exported page.
  const redirectsFile = "out/_redirects";
  const redirects = await read(redirectsFile);
  for (const line of redirects.split("\n").map((entry) => entry.trim())) {
    if (!line || line.startsWith("#")) continue;
    const [, target] = line.split(/\s+/);
    if (!target || !(await exists(artifactPath(target)))) {
      failures.push(`${redirectsFile}: target of "${line}" was not exported`);
    }
  }

  const headersFile = "out/_headers";
  const headers = await read(headersFile);
  requireText(headersFile, headers, "X-Content-Type-Options: nosniff");
  requireText(headersFile, headers, "Cache-Control: public, max-age=31536000, immutable");

  const homeFile = "out/index.html";
  const home = await read(homeFile);
  requireText(homeFile, home, 'class="skip-link"');
  requireText(homeFile, home, 'id="main-content"');

  // Static search: the exported index parses and matches titles and body text.
  const searchFile = "out/search-index.json";
  const searchSource = await read(searchFile);
  try {
    JSON.parse(searchSource);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response(searchSource, { status: 200 })) as typeof fetch;
    try {
      const client = staticClient({ from: "/search-index.json" });
      const byTitle = await client.search("version pinning");
      if (!byTitle.some((result) => result.url.startsWith("/docs/cli/version-pinning") && result.type === "page")) {
        failures.push(`${searchFile}: title search for "version pinning" does not find /docs/cli/version-pinning`);
      }
      const byBody = await client.search("There is no CLI 1.x history");
      if (!byBody.some((result) => result.url.startsWith("/docs/cli/v2/getting-started"))) {
        failures.push(`${searchFile}: body search does not find /docs/cli/v2/getting-started`);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  } catch (error) {
    failures.push(`${searchFile}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const staticDirectory = path.join(root, "out/_next/static");
  const staticFiles = await fs.readdir(staticDirectory, { recursive: true });
  const css = (
    await Promise.all(staticFiles.filter((file) => file.endsWith(".css")).map((file) => read(`out/_next/static/${file}`)))
  ).join("\n");
  requireText("out/_next/static/**/*.css", css, "prefers-reduced-motion:reduce");
  requireText("out/_next/static/**/*.css", css, ":focus-visible");
  // The search dialog is configured to load the exported static index.
  requireText(homeFile, home, "/search-index.json");

  const htmlFiles = await Promise.all(routes.map((route) => read(artifactPath(route))));
  if (htmlFiles.some((html) => html.includes("plausible.io/js/script.js"))) {
    failures.push("out/: preview artifact contains the production analytics script");
  }

  for (const runtimeArtifact of ["out/server.js", "out/package.json", "out/.next/BUILD_ID"]) {
    if (await exists(runtimeArtifact)) failures.push(`${runtimeArtifact}: runtime-only artifact must not be present`);
  }

  if (failures.length > 0) {
    throw new Error(`Static export acceptance failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  }

  console.log(`Static export acceptance passed for ${routes.length} content routes.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
