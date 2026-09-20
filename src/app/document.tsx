import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { PromptBlock } from "@/components/prompt-block";
import { InstallLink } from "@/components/install-link";
import { TrackedLink } from "@/components/tracked-link";
import { ReleasePicker } from "@/components/version-selector";
import {
  CardGrid,
  DocCard,
  TopicList,
  Topic,
  Callout,
  HomeIntro,
} from "@/components/content-blocks";
import { getNavigation, sourceUrl, type ContentDocument } from "@/lib/content";
import { websiteSource } from "@/lib/content/website";
import { pageDensity, pageKind, scopeLabel } from "@/lib/page-kind";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function Table({ children }: { children?: ReactNode }) {
  return (
    <div className="table-scroll" role="region" aria-label="Reference table" tabIndex={0}>
      <table>{children}</table>
    </div>
  );
}

function Blockquote({ children }: { children?: ReactNode }) {
  return <blockquote>{children}</blockquote>;
}

export async function DocumentPage({ document }: { document: ContentDocument }) {
  const navigation = await getNavigation();
  const { frontmatter: fm, routeInfo } = document;
  const kind = pageKind(document);
  const home = kind === "home";
  const { content } = await compileMDX({
    source: document.body,
    components: {
      InstallLink,
      CardGrid,
      DocCard,
      TopicList,
      Topic,
      Callout,
      HomeIntro,
      ReleasePicker,
      pre: CodeBlock,
      blockquote: routeInfo.route === "/docs/prompts" ? PromptBlock : Blockquote,
      table: Table,
    },
    options: { mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } },
  });
  const siblings = navigation.filter((item) => item.section === fm.section);
  const currentIndex = siblings.findIndex((item) => item.route === routeInfo.route);
  const previous = currentIndex > 0 ? siblings[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 ? siblings[currentIndex + 1] : undefined;
  const section = navigation.find((item) => item.section === fm.section && item.order === 0);
  const scope = scopeLabel(document);
  const website = websiteSource(document.file);
  const headings = [...document.headings].map((id, index) => ({
    id,
    text: document.headingText[index],
  }));

  return (
    <div
      className={home ? "document-home" : "document-layout"}
      data-page={kind}
      data-density={pageDensity(kind)}
    >
      <div className="document-frame">
        {!home ? (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/docs">Docs</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {section && section.route !== routeInfo.route ? (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={section.route}>{fm.section}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              ) : null}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{fm.sidebar_label ?? fm.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        ) : null}
        <article className={home ? "prose home-prose" : "prose"}>
          {!home ? (
            <header className="document-header">
              <h1>{fm.title}</h1>
              <p className="summary">{fm.description}</p>
              <p className="version-baseline">
                {fm.tracks.map((track) => (
                  <Link href={"/releases/" + track + "/" + fm.versions[track]} key={track}>
                    {track === "cli" ? "CLI" : "Template"} {fm.versions[track]}
                  </Link>
                ))}
              </p>
            </header>
          ) : null}
          {content}
        </article>
        <footer className="page-meta">
          <div>
            <span className="eyebrow">Page evidence</span>
            <p>
              {scope} ·{" "}
              {fm.scope === "website"
                ? "Website implementation and content contract"
                : "Claims tied to the releases below"}
            </p>
          </div>
          <ul>
            {fm.sources.map((source) => {
              const version = fm.versions[source.track];
              const href = version ? sourceUrl(source.track, version, source.path) : undefined;
              return href ? (
                <li key={source.track + source.path}>
                  <TrackedLink href={href} repository={source.repository}>
                    <span>
                      {source.repository} · {source.ref}
                    </span>
                    <code>{source.path}</code>
                  </TrackedLink>
                </li>
              ) : null;
            })}
          </ul>
          <details className="contribute">
            <summary>Improve this page</summary>
            <p>
              Edit <code>{"content/" + document.file}</code> in <code>context-circuit-website</code>.
            </p>
            {website ? (
              <TrackedLink href={website} repository="context-circuit-website">
                View the published website snapshot ↗
              </TrackedLink>
            ) : (
              <p>
                This is a new page in the local redesign. A published source link will be available
                after the file is committed and delivered.
              </p>
            )}
            <p>
              <Link href="/docs/maintainers/documentation">Contribution and validation guide →</Link>
            </p>
          </details>
        </footer>
        {!home && (previous || next) ? (
          <nav className="page-nav" aria-label="Previous and next pages">
            {previous ? (
              <Link className="page-nav-link" href={previous.route} data-direction="previous">
                <small><span aria-hidden="true">←</span> Previous</small>
                <strong>{previous.label}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="page-nav-link" href={next.route} data-direction="next">
                <small>Next <span aria-hidden="true">→</span></small>
                <strong>{next.label}</strong>
              </Link>
            ) : null}
          </nav>
        ) : null}
        <div className="site-footer">
          <span>Context Circuit</span>
          <span>Project knowledge, kept in the loop.</span>
          <Link href="/docs/releases">Release history →</Link>
        </div>
      </div>
      {!home ? (
        <aside className="page-aside">
          <nav aria-label="On this page">
            <p className="eyebrow">On this page</p>
            {headings.length ? (
              headings.map((heading) => (
                <a key={heading.id} href={"#" + heading.id}>
                  {heading.text}
                </a>
              ))
            ) : (
              <span className="metadata-label">Choose a topic in this section.</span>
            )}
          </nav>
          <div className="aside-reference">
            <p className="eyebrow">Release reference</p>
            <ReleasePicker template={fm.versions.template} cli={fm.versions.cli} />
            <Link href="/docs/releases/major-versions">About documentation versions →</Link>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
