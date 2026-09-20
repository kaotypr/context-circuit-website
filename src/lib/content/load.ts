import { promises as fs } from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import type { Heading, Root } from "mdast";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { ZodError } from "zod";
import { routeForFile } from "./routes";
import { frontmatterSchema } from "./schema";
import type { ContentDocument } from "./types";

async function findDocuments(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findDocuments(entryPath);
      return entry.name.endsWith(".mdx") ? [entryPath] : [];
    }),
  );
  return files.flat().sort();
}

function textContent(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const candidate = node as { value?: unknown; children?: unknown[] };
  if (typeof candidate.value === "string") return candidate.value;
  return candidate.children?.map(textContent).join("") ?? "";
}

function collectHeadings(tree: Root): { ids: Set<string>; text: string[] } {
  const headings = new Set<string>();
  const headingText: string[] = [];
  const slugger = new GithubSlugger();
  visit(tree, "heading", (node: Heading) => {
    const text = textContent(node).trim();
    headings.add(slugger.slug(text));
    headingText.push(text);
  });
  return { ids: headings, text: headingText };
}

function formatSchemaError(file: string, error: ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
    return `${file}: ${field}: ${issue.message}`;
  });
}

export async function loadDocuments(contentDirectory: string): Promise<{
  documents: ContentDocument[];
  errors: string[];
}> {
  const documents: ContentDocument[] = [];
  const errors: string[] = [];
  let files: string[];

  try {
    files = await findDocuments(contentDirectory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { documents, errors: [`${contentDirectory}: content: ${message}`] };
  }

  for (const absoluteFile of files) {
    const file = path.relative(contentDirectory, absoluteFile).split(path.sep).join("/");
    try {
      const source = await fs.readFile(absoluteFile, "utf8");
      const parsed = matter(source);
      const frontmatterResult = frontmatterSchema.safeParse(parsed.data);
      if (!frontmatterResult.success) {
        errors.push(...formatSchemaError(file, frontmatterResult.error));
        continue;
      }

      const tree = unified().use(remarkParse).use(remarkMdx).parse(parsed.content) as Root;
      const headings = collectHeadings(tree);
      documents.push({
        file,
        absoluteFile,
        body: parsed.content,
        frontmatter: frontmatterResult.data,
        routeInfo: routeForFile(file),
        headings: headings.ids,
        headingText: headings.text,
        tree,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message.startsWith(`${file}:`) ? message : `${file}: content: ${message}`);
    }
  }

  return { documents, errors };
}
