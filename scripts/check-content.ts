import path from "node:path";
import { publishedDocuments } from "../src/lib/content/consumers";
import { validateContent } from "../src/lib/content/validate";

const contentDirectory = path.join(process.cwd(), "content");

async function main() {
  try {
    const graph = await validateContent(contentDirectory);
    const published = publishedDocuments(graph);
    console.log(`Content valid: ${graph.documents.length} documents, ${published.length} published.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

void main();
