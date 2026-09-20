import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSearchIndex, publishedDocuments, sourceUrl } from "../src/lib/content";
import { validateContent } from "../src/lib/content/validate";

const root = process.cwd();
const outputDirectory = path.join(root, "out");
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

function requireText(file: string, source: string, expected: string): void {
  if (!source.includes(expected)) failures.push(`${file}: missing ${JSON.stringify(expected)}`);
}

function artifactPath(route: string): string {
  return route === "/" ? "out/index.html" : `out${route}/index.html`;
}

async function main(): Promise<void> {
  const graph = await validateContent(path.join(root, "content"));
  const documents = publishedDocuments(graph);

  const representativeRoutes = new Map([
    ["/", "Why it exists"],
    ["/docs", "Understand Context Circuit"],
    ["/docs/get-started", "Setup Context Circuit"],
    ["/docs/reference/cli-commands", "CLI commands"],
    ["/docs/template/v2/getting-started", "Workspace template v2"],
    ["/docs/cli/v2/getting-started", "Context Circuit CLI v2"],
    ["/changelog/template", "Workspace template changelog"],
    ["/changelog/cli", "Context Circuit CLI changelog"],
  ]);

  for (const [route, text] of representativeRoutes) {
    const file = artifactPath(route);
    requireText(file, await read(file), text);
  }

  const cliVersionFile = artifactPath("/docs/cli/v2/getting-started");
  const cliVersionPage = await read(cliVersionFile);
  requireText(cliVersionFile, cliVersionPage, 'aria-label="CLI release"');
  requireText(cliVersionFile, cliVersionPage, "2.1.0");
  requireText(cliVersionFile, cliVersionPage, 'aria-label="Template release"');

  const cliChangelogFile = artifactPath("/changelog/cli");
  requireText(cliChangelogFile, await read(cliChangelogFile), "/releases/cli/2.1.0");

  for (const document of documents) {
    const file = artifactPath(document.routeInfo.route);
    const html = await read(file);
    for (const source of document.frontmatter.sources) {
      const selector = document.frontmatter.versions[source.track];
      const url = selector ? sourceUrl(source.track, selector, source.path) : undefined;
      if (!url) failures.push(`${document.file}: could not resolve source ${source.path}`);
      else requireText(file, html, url);
    }
  }

  for (const document of graph.documents.filter(
    (candidate) => candidate.frontmatter.draft || candidate.frontmatter.unlisted,
  )) {
    try {
      await fs.access(path.join(root, artifactPath(document.routeInfo.route)));
      failures.push(`${artifactPath(document.routeInfo.route)}: excluded document was exported`);
    } catch {
      // Excluded content must have no artifact.
    }
  }

  const searchFile = "out/search-index.json";
  const searchSource = await read(searchFile);
  try {
    const actual = JSON.parse(searchSource) as unknown;
    const expected = buildSearchIndex(graph);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      failures.push(`${searchFile}: does not match the validated published content graph`);
    }
  } catch (error) {
    failures.push(`${searchFile}: invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  }

  const redirectsFile = "out/_redirects";
  const redirects = await read(redirectsFile);
  for (const document of documents) {
    for (const redirect of document.frontmatter.redirects) {
      requireText(redirectsFile, redirects, `${redirect} ${document.routeInfo.route}/ 301`);
    }
  }

  const headersFile = "out/_headers";
  const headers = await read(headersFile);
  requireText(headersFile, headers, "X-Content-Type-Options: nosniff");
  requireText(headersFile, headers, "Cache-Control: public, max-age=31536000, immutable");

  const homeFile = "out/index.html";
  const home = await read(homeFile);
  requireText(homeFile, home, 'class="skip-link"');
  requireText(homeFile, home, 'aria-haspopup="dialog"');

  const staticDirectory = path.join(outputDirectory, "_next/static");
  const staticFiles = await fs.readdir(staticDirectory, { recursive: true });
  const cssFiles = staticFiles.filter((file) => file.endsWith(".css"));
  const css = (await Promise.all(cssFiles.map((file) => read(`out/_next/static/${file}`)))).join("\n");
  requireText("out/_next/static/css/*.css", css, "prefers-reduced-motion:reduce");
  requireText("out/_next/static/css/*.css", css, ":focus-visible");
  const javascriptFiles = staticFiles.filter((file) => file.endsWith(".js"));
  const javascript = (await Promise.all(
    javascriptFiles.map((file) => read(`out/_next/static/${file}`)),
  )).join("\n");
  requireText("out/_next/static/**/*.js", javascript, "/search-index.json");

  const htmlFiles = await Promise.all(
    documents.map((document) => read(artifactPath(document.routeInfo.route))),
  );
  if (htmlFiles.some((html) => html.includes("plausible.io/js/script.js"))) {
    failures.push("out/: preview artifact contains the production analytics script");
  }

  for (const runtimeArtifact of ["out/server.js", "out/package.json", "out/.next/BUILD_ID"]) {
    try {
      await fs.access(path.join(root, runtimeArtifact));
      failures.push(`${runtimeArtifact}: runtime-only artifact must not be present`);
    } catch {
      // A static export has no runtime entrypoint or Next.js server state.
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Static export acceptance failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`,
    );
  }

  console.log(`Static export acceptance passed for ${documents.length} published routes.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
