import type { Root } from "mdast";
import type { Frontmatter } from "./schema";
import type { RouteInfo } from "./routes";

export type ContentDocument = {
  file: string;
  absoluteFile: string;
  body: string;
  frontmatter: Frontmatter;
  routeInfo: RouteInfo;
  headings: Set<string>;
  tree: Root;
};

export type ContentGraph = {
  documents: ContentDocument[];
  byRoute: Map<string, ContentDocument>;
  redirects: Map<string, string>;
};

