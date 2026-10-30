import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { getMDXComponents } from "@/mdx-components";
import { PageBaseline, PageSources } from "@/components/page-baseline";
import { PromptBlock } from "@/components/prompt-block";
import { source } from "@/lib/source";

type RouteProps = { params: Promise<{ slug: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return source.generateParams().filter((params) => params.slug.length > 0);
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}

export default async function Page({ params }: RouteProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const components = getMDXComponents(
    page.url === "/docs/prompts" ? { blockquote: PromptBlock } : undefined,
  );

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} id="main-content" tabIndex={-1}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <PageBaseline tracks={page.data.tracks} versions={page.data.versions} />
      <DocsBody>
        <MDX components={components} />
      </DocsBody>
      <PageSources sources={page.data.sources ?? []} />
    </DocsPage>
  );
}
