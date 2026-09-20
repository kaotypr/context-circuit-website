import path from "node:path";
import { cache } from "react";
import { buildNavigation, publishedDocuments } from "./consumers";
import { validateContent } from "./validate";

export const contentDirectory = path.join(process.cwd(), "content");

export const getContentGraph = cache(() => validateContent(contentDirectory));

export async function getPublishedDocuments() {
  const graph = await getContentGraph();
  return publishedDocuments(graph);
}

export async function getPublishedDocument(route: string) {
  const documents = await getPublishedDocuments();
  return documents.find((document) => document.routeInfo.route === route);
}

export async function getNavigation() {
  const graph = await getContentGraph();
  return buildNavigation(graph);
}

export { releaseRegistry, resolveRelease, sourceUrl } from "./releases";
export { buildNavigation, buildSearchIndex, publishedDocuments } from "./consumers";
export type { ContentDocument, ContentGraph } from "./types";
