import type { ContentDocument, ContentGraph } from "./types";

function isPublished(document: ContentDocument): boolean {
  return !document.frontmatter.draft && !document.frontmatter.unlisted;
}

export type NavigationItem = {
  route: string;
  label: string;
  section: string;
  order: number;
  kind: ContentDocument["routeInfo"]["kind"];
  track?: string;
  version?: string;
  navigationRoot: string;
};

export type SearchRecord = {
  route: string;
  title: string;
  description: string;
  section: string;
  tracks: string[];
  versions: Record<string, string | undefined>;
  headings: string[];
  text: string;
};

const sectionOrder = [
  "Documentation", "Understand Context Circuit", "Prompt cookbook", "Get started", "Concepts", "Workflows", "Template", "CLI", "Reference", "Maintainers", "Releases",
  "Template v2", "CLI v2", "Changelog", "Template releases", "CLI releases", "Home",
];

export function publishedDocuments(graph: ContentGraph): ContentDocument[] {
  return graph.documents.filter(isPublished);
}

export function buildNavigation(graph: ContentGraph): NavigationItem[] {
  return publishedDocuments(graph)
    .map((document) => ({
      route: document.routeInfo.route,
      label: document.frontmatter.sidebar_label ?? document.frontmatter.title,
      section: document.frontmatter.section,
      order: document.frontmatter.order,
      kind: document.routeInfo.kind,
      track: document.routeInfo.track,
      version: document.routeInfo.track
        ? document.frontmatter.versions[document.routeInfo.track]
        : undefined,
      navigationRoot: document.routeInfo.navigationRoot,
    }))
    .sort(
      (left, right) =>
        (sectionOrder.indexOf(left.section) === -1 ? Number.MAX_SAFE_INTEGER : sectionOrder.indexOf(left.section)) -
          (sectionOrder.indexOf(right.section) === -1 ? Number.MAX_SAFE_INTEGER : sectionOrder.indexOf(right.section)) ||
        left.section.localeCompare(right.section) ||
        left.order - right.order ||
        left.route.localeCompare(right.route),
    );
}

export function buildSearchIndex(graph: ContentGraph): SearchRecord[] {
  return publishedDocuments(graph)
    .map((document) => ({
      route: document.routeInfo.route,
      title: document.frontmatter.title,
      description: document.frontmatter.description,
      section: document.frontmatter.section,
      tracks: [...document.frontmatter.tracks],
      versions: { ...document.frontmatter.versions },
      headings: document.headingText,
      text: document.body.replace(/<[^>]+>|[#*_`>[\]()!-]/g, " ").replace(/\s+/g, " ").trim(),
    }))
    .sort((left, right) => left.route.localeCompare(right.route));
}
