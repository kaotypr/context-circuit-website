import path from "node:path";
import type { Link } from "mdast";
import { visit } from "unist-util-visit";
import { loadDocuments } from "./load";
import { releaseRegistry, resolveRelease } from "./releases";
import { parentRoute } from "./routes";
import type { ContentDocument, ContentGraph } from "./types";

export class ContentValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Content validation failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}:\n${issues.join("\n")}`);
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

function addDocumentRules(document: ContentDocument, errors: string[]): void {
  const { file, frontmatter, routeInfo } = document;

  if (frontmatter.canonical_url && frontmatter.canonical_url !== routeInfo.route) {
    errors.push(`${file}: canonical_url: must equal derived route ${routeInfo.route}`);
  }

  for (const track of frontmatter.tracks) {
    const selector = frontmatter.versions[track];
    if (selector && !resolveRelease(track, selector)) {
      errors.push(`${file}: versions.${track}: unknown release selector ${selector}`);
    }
  }

  if (routeInfo.kind === "versioned" && routeInfo.track && routeInfo.major) {
    const selector = frontmatter.versions[routeInfo.track];
    const release = selector ? resolveRelease(routeInfo.track, selector) : undefined;
    if (!frontmatter.tracks.includes(routeInfo.track)) {
      errors.push(`${file}: tracks: must include route track ${routeInfo.track}`);
    } else if (release && release.major !== routeInfo.major) {
      errors.push(
        `${file}: versions.${routeInfo.track}: release ${release.version} is not in route major v${routeInfo.major}`,
      );
    }
  }

  if (routeInfo.kind === "release" && routeInfo.track && routeInfo.release) {
    const selector = frontmatter.versions[routeInfo.track];
    const selected = selector ? resolveRelease(routeInfo.track, selector) : undefined;
    if (!frontmatter.tracks.includes(routeInfo.track)) {
      errors.push(`${file}: tracks: must include route track ${routeInfo.track}`);
    } else if (selected?.version !== routeInfo.release) {
      errors.push(
        `${file}: versions.${routeInfo.track}: must resolve to route release ${routeInfo.release}`,
      );
    }
  }

  if (routeInfo.kind === "changelog" && routeInfo.track && !frontmatter.tracks.includes(routeInfo.track)) {
    errors.push(`${file}: tracks: must include route track ${routeInfo.track}`);
  }

  for (const [index, source] of frontmatter.sources.entries()) {
    const selector = frontmatter.versions[source.track];
    const release = selector ? resolveRelease(source.track, selector) : undefined;
    if (!release) continue;
    if (source.repository !== release.repository) {
      errors.push(
        `${file}: sources.${index}.repository: expected ${release.repository} for ${source.track} ${release.version}`,
      );
    }
    if (source.ref !== release.ref) {
      errors.push(`${file}: sources.${index}.ref: expected immutable ref ${release.ref}`);
    }
  }
}

function resolveLinkRoute(documentRoute: string, href: string): { route: string; fragment?: string } {
  const hashIndex = href.indexOf("#");
  const pathPart = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? undefined : decodeURIComponent(href.slice(hashIndex + 1));
  const withoutQuery = pathPart.split("?", 1)[0];

  if (!withoutQuery) return { route: documentRoute, fragment };
  const resolved = withoutQuery.startsWith("/")
    ? path.posix.normalize(withoutQuery)
    : path.posix.resolve(path.posix.dirname(documentRoute), withoutQuery);
  const route = resolved.length > 1 ? resolved.replace(/\/$/, "") : resolved;
  return { route, fragment };
}

function validateLinks(graph: ContentGraph, errors: string[]): void {
  for (const document of graph.documents) {
    visit(document.tree, "link", (node: Link) => {
      if (/^(?:[a-z]+:|\/\/)/i.test(node.url)) return;
      let resolved: { route: string; fragment?: string };
      try {
        resolved = resolveLinkRoute(document.routeInfo.route, node.url);
      } catch {
        errors.push(`${document.file}: link: contains an invalid URL encoding: ${node.url}`);
        return;
      }

      const redirectedRoute = graph.redirects.get(resolved.route);
      const target = graph.byRoute.get(redirectedRoute ?? resolved.route);
      if (!target) {
        errors.push(`${document.file}: link: broken internal target ${node.url}`);
        return;
      }
      if (!document.frontmatter.draft && !document.frontmatter.unlisted && (target.frontmatter.draft || target.frontmatter.unlisted)) {
        errors.push(`${document.file}: link: published content cannot target excluded document ${target.file}`);
      }
      if (resolved.fragment && !target.headings.has(resolved.fragment)) {
        errors.push(`${document.file}: link: missing fragment #${resolved.fragment} in ${target.file}`);
      }
    });
  }
}

function validateRedirectCycles(graph: ContentGraph, errors: string[]): void {
  for (const start of graph.redirects.keys()) {
    const seen = new Set<string>();
    let route: string | undefined = start;
    while (route && graph.redirects.has(route)) {
      if (seen.has(route)) {
        errors.push(`${graph.byRoute.get(graph.redirects.get(start) ?? "")?.file ?? start}: redirects: cycle includes ${route}`);
        break;
      }
      seen.add(route);
      route = graph.redirects.get(route);
    }
  }
}

export async function validateContent(contentDirectory: string): Promise<ContentGraph> {
  const loaded = await loadDocuments(contentDirectory);
  const errors = [...loaded.errors];
  const byRoute = new Map<string, ContentDocument>();
  const redirects = new Map<string, string>();
  const orderKeys = new Map<string, ContentDocument>();

  for (const document of loaded.documents) {
    const { file, frontmatter, routeInfo } = document;
    const duplicate = byRoute.get(routeInfo.route);
    if (duplicate) {
      errors.push(`${file}: path: duplicate route ${routeInfo.route}; already declared by ${duplicate.file}`);
    } else {
      byRoute.set(routeInfo.route, document);
    }

    const orderKey = `${parentRoute(routeInfo.route)}\0${frontmatter.section}\0${frontmatter.order}`;
    const sameOrder = orderKeys.get(orderKey);
    if (sameOrder) {
      errors.push(
        `${file}: order: duplicates ${frontmatter.order} in section ${frontmatter.section}; already used by ${sameOrder.file}`,
      );
    } else {
      orderKeys.set(orderKey, document);
    }

    addDocumentRules(document, errors);
  }

  for (const document of loaded.documents) {
    const { file, routeInfo, frontmatter } = document;
    const parent = parentRoute(routeInfo.route);
    if (parent !== routeInfo.navigationRoot && !byRoute.has(parent)) {
      errors.push(`${file}: path: missing navigation parent ${parent}`);
    }

    for (const redirect of frontmatter.redirects) {
      if (redirect === routeInfo.route) {
        errors.push(`${file}: redirects: ${redirect} cannot redirect to itself`);
      } else if (byRoute.has(redirect)) {
        errors.push(`${file}: redirects: ${redirect} conflicts with a document route`);
      } else if (redirects.has(redirect)) {
        errors.push(`${file}: redirects: ${redirect} is already claimed by another document`);
      } else {
        redirects.set(redirect, routeInfo.route);
      }
    }
  }

  for (const [track, line] of Object.entries(releaseRegistry)) {
    if (!line.releases[line.current]) {
      errors.push(`release-registry: ${track}.current: ${line.current} is not declared`);
    }
    for (const [key, release] of Object.entries(line.releases)) {
      if (release.version !== key) errors.push(`release-registry: ${track}.${key}.version: must equal registry key`);
      if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$/.test(key)) {
        errors.push(`release-registry: ${track}.${key}: must be a semantic version`);
      }
      if (!release.ref || !release.repository || !release.sourceBaseUrl) {
        errors.push(`release-registry: ${track}.${key}: repository, sourceBaseUrl, and immutable ref are required`);
      }
    }
  }

  const graph = { documents: loaded.documents, byRoute, redirects };
  validateRedirectCycles(graph, errors);
  validateLinks(graph, errors);

  if (errors.length > 0) throw new ContentValidationError(errors.sort());
  return graph;
}

