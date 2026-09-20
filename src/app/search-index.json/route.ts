import { buildSearchIndex, getContentGraph } from "@/lib/content";

export const dynamic = "force-static";

export async function GET() {
  const graph = await getContentGraph();
  return Response.json(buildSearchIndex(graph), {
    headers: { "Cache-Control": "public, max-age=3600, immutable" },
  });
}
