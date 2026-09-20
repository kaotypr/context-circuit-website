import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import type { ContentDocument } from "@/lib/content";

export async function DocumentPage({ document }: { document: ContentDocument }) {
  const { content } = await compileMDX({
    source: document.body,
    options: { mdxOptions: { rehypePlugins: [rehypeSlug] } },
  });

  return (
    <main className="shell">
      <article className="prose">
        <p className="eyebrow">{document.frontmatter.section}</p>
        <h1>{document.frontmatter.title}</h1>
        <p className="summary">{document.frontmatter.description}</p>
        {content}
      </article>
    </main>
  );
}
