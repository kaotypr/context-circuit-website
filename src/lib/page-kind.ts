import type { ContentDocument } from "@/lib/content/types";

export type PageKind =
  | "home"
  | "onboarding"
  | "guide"
  | "workflow"
  | "reference"
  | "release"
  | "maintainer";

export function pageKind(document: ContentDocument): PageKind {
  if (document.routeInfo.kind === "landing" || document.routeInfo.route === "/") {
    return "home";
  }

  if (document.routeInfo.kind === "changelog" || document.routeInfo.kind === "release") {
    return "release";
  }

  switch (document.frontmatter.section) {
    case "Get started":
      return "onboarding";
    case "Workflows":
      return "workflow";
    case "Reference":
    case "CLI":
      return "reference";
    case "Maintainers":
      return "maintainer";
    case "Releases":
      return "release";
    default:
      return "guide";
  }
}

export function pageDensity(kind: PageKind): "comfortable" | "compact" {
  return kind === "reference" ? "compact" : "comfortable";
}

export function scopeLabel(document: ContentDocument): string {
  const { frontmatter: fm } = document;
  if (fm.scope === "website") return "Documentation website";
  if (fm.scope === "source") return "Source repository";
  if (fm.tracks.length === 2) return "Template + CLI";
  return fm.tracks[0] === "cli" ? "CLI" : "Workspace template";
}

export function kindLabel(document: ContentDocument): string {
  switch (document.routeInfo.kind) {
    case "versioned":
      return "Major-version guide";
    case "release":
      return "Release notes";
    case "changelog":
      return "Changelog";
    default:
      return "Documentation";
  }
}
