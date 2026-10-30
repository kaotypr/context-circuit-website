import { promises as fs } from "node:fs";
import path from "node:path";

/** The public route of a content file: the content tree is the URL tree. */
export function routeForContentFile(relativeFile: string): string {
  const segments = relativeFile.replace(/\.mdx$/, "").split(/[\\/]/);
  if (segments.at(-1) === "index") segments.pop();
  return "/" + segments.join("/");
}

/** Every public route produced by `content/**\/*.mdx`, sorted. */
export async function contentRoutes(contentDirectory: string): Promise<string[]> {
  const files = await fs.readdir(contentDirectory, { recursive: true });
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => routeForContentFile(file.split(path.sep).join("/")))
    .sort();
}
