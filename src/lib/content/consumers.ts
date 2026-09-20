import type { ContentDocument, ContentGraph } from "./types";

function isPublished(document: ContentDocument): boolean {
  return !document.frontmatter.draft && !document.frontmatter.unlisted;
}

export type NavigationItem = {
  route: string;
  label: string;
  section: string;
  order: number;
};

export type SearchRecord = {
  route: string;
  title: string;
  description: string;
  section: string;
  tracks: string[];
  text: string;
};

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
    }))
    .sort(
      (left, right) =>
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
      text: document.body.replace(/<[^>]+>|[#*_`>[\]()!-]/g, " ").replace(/\s+/g, " ").trim(),
    }))
    .sort((left, right) => left.route.localeCompare(right.route));
}

