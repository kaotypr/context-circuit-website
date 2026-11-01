import { promises as fs } from "node:fs";
import path from "node:path";
import { staticClient } from "fumadocs-core/search/client/orama-static";
import { contentRoutes } from "../src/lib/content-routes";
import { releaseRegistry, releasesNewestFirst, tracks } from "../src/lib/releases";
import { pageUrl, siteUrl } from "../src/lib/site";

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
    // Each page names itself on the custom domain, so duplicate hosts defer to it.
    const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((match) => match[1]);
    if (html && (canonicals.length !== 1 || canonicals[0] !== pageUrl(route))) {
      failures.push(`${file}: expected one canonical link to ${pageUrl(route)}, found ${JSON.stringify(canonicals)}`);
    }
  }

  // The sitemap lists exactly the exported content pages, on the custom domain.
  const sitemapFile = "out/sitemap.xml";
  const sitemap = await read(sitemapFile);
  const listed = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]).sort();
  const expected = routes.map(pageUrl).sort();
  for (const url of expected) if (!listed.includes(url)) failures.push(`${sitemapFile}: missing ${url}`);
  for (const url of listed) if (!expected.includes(url)) failures.push(`${sitemapFile}: lists ${url}, which is not a content page`);

  // The site's own robots.txt: readable by AI assistants, not for training, and pointing at the sitemap.
  const robotsFile = "out/robots.txt";
  const robots = await read(robotsFile);
  requireText(robotsFile, robots, "ai-train=no");
  requireText(robotsFile, robots, `Sitemap: ${siteUrl}/sitemap.xml`);

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
    ["/", "The circuit"],
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
  // Pages that list every release carry no single-release badges.
  for (const route of ["/changelog", "/changelog/template", "/changelog/cli"]) {
    const file = artifactPath(route);
    if ((await read(file)).includes('class="version-baseline"')) failures.push(`${file}: lists every release, so it shows no baseline badges`);
  }

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
  // Only the pages.dev alias is kept out of the index; the custom domain must stay indexable.
  const headerBlock = (pattern: string) =>
    headers.split(/\n\s*\n/).find((block) => block.split("\n").some((line) => line.trim() === pattern));
  const aliasBlock = headerBlock("https://context-circuit.pages.dev/*");
  if (!aliasBlock?.includes("X-Robots-Tag: noindex")) failures.push(`${headersFile}: the pages.dev alias needs X-Robots-Tag: noindex`);
  const globalBlock = headerBlock("/*");
  if (globalBlock?.includes("X-Robots-Tag")) failures.push(`${headersFile}: X-Robots-Tag must not apply to every host`);

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
