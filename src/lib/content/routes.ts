import path from "node:path";
import type { Track } from "./schema";

export type DocumentKind = "landing" | "evergreen" | "versioned" | "release" | "changelog";

export type RouteInfo = {
  route: string;
  kind: DocumentKind;
  track?: Track;
  major?: number;
  release?: string;
  navigationRoot: string;
};

function withoutExtension(file: string): string {
  return file.replace(/\.mdx?$/, "");
}

function routeFromSegments(prefix: string, segments: string[]): string {
  const clean = segments.at(-1) === "index" ? segments.slice(0, -1) : segments;
  return clean.length === 0 ? prefix : `${prefix}/${clean.join("/")}`;
}

export function routeForFile(relativeFile: string): RouteInfo {
  const normalized = relativeFile.split(path.sep).join("/");
  const parts = withoutExtension(normalized).split("/");

  if (parts.length === 1 && parts[0] === "index") {
    return { route: "/", kind: "landing", navigationRoot: "/" };
  }

  if (parts[0] === "docs" && parts.length > 1) {
    return {
      route: routeFromSegments("/docs", parts.slice(1)),
      kind: "evergreen",
      navigationRoot: "/docs",
    };
  }

  if (parts[0] === "versions" && parts.length > 3) {
    const track = parts[1];
    const major = Number(parts[2]);
    if ((track === "template" || track === "cli") && Number.isInteger(major) && major > 0) {
      const root = `/docs/${track}/v${major}`;
      return {
        route: routeFromSegments(root, parts.slice(3)),
        kind: "versioned",
        track,
        major,
        navigationRoot: root,
      };
    }
  }

  if (parts[0] === "releases" && parts.length === 3) {
    const track = parts[1];
    if (track === "template" || track === "cli") {
      return {
        route: `/releases/${track}/${parts[2]}`,
        kind: "release",
        track,
        release: parts[2],
        navigationRoot: `/releases/${track}`,
      };
    }
  }

  if (parts[0] === "changelogs" && parts.length === 2) {
    const track = parts[1];
    if (track === "template" || track === "cli") {
      return {
        route: `/changelog/${track}`,
        kind: "changelog",
        track,
        navigationRoot: "/changelog",
      };
    }
  }

  throw new Error(
    `${relativeFile}: path: is outside the content route contract (index, docs, versions, releases, or changelogs)`,
  );
}

export function parentRoute(route: string): string {
  const parent = path.posix.dirname(route);
  return parent === "." ? "/" : parent;
}

