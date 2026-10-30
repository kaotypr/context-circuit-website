import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/mdx-components";
import { source } from "@/lib/source";

function homePage() {
  const page = source.getPage([]);
  if (!page) notFound();
  return page;
}

export function generateMetadata(): Metadata {
  const page = homePage();
  return { title: { absolute: page.data.title }, description: page.data.description };
}

export default function HomePage() {
  const page = homePage();
  const MDX = page.data.body;
  return (
    <div className="home-page" id="main-content" tabIndex={-1}>
      <article className="prose home-prose">
        <MDX components={getMDXComponents()} />
      </article>
    </div>
  );
}
